import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSocketSync } from "../socket/socket";

const PATH_UPDATE_INTERVAL_MS = 120;
const MIN_POINT_DELTA = 0.0015;
const MIN_STROKE_WIDTH = 1;
const DRAWING_ASPECT_RATIO = 16 / 9;
const MAP_VIEWBOX_WIDTH = 1920;
const MAP_VIEWBOX_HEIGHT = 1080;

const COLORS = [
  "#0000FF",
  "#FF0000",
  "#00FF00",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#000000",
  "#FFFFFF",
  "#FFA500",
  "#800080",
];

const STROKE_WIDTHS = [2, 4, 6, 8, 12];
const DEFAULT_TRANSFORM_STATE = Object.freeze({
  scale: 1,
  positionX: 0,
  positionY: 0,
});
const DRAWING_PATH_STORE = new Map();

const PencilIcon = ({ size = 20, strokeColor = "#1f2937" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M17 3C17.5304 2.46957 18.2652 2.17157 19.0355 2.17157C19.4056 2.17157 19.7721 2.24461 20.1144 2.38635C20.4568 2.52809 20.7685 2.73567 21.0315 2.99863C21.2944 3.26159 21.502 3.57323 21.6437 3.91561C21.7855 4.25799 21.8585 4.62445 21.8585 4.99456C21.8585 5.36468 21.7855 5.73113 21.6437 6.07351C21.502 6.4159 21.2944 6.72754 21.0315 6.9905L7.5 20.522L2 22L3.478 16.5L17 3Z"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

const resetDrawingRef = (ref) => {
  ref.current = {
    isDrawing: false,
    currentPath: null,
    pointerId: null,
    lastUpdateTs: 0,
  };
};

const clonePath = (path) => ({
  ...path,
  points: Array.isArray(path.points)
    ? path.points.map((point) => ({ ...point }))
    : undefined,
});

const getStoredPathsForKey = (mapKey) => {
  const storedPaths = DRAWING_PATH_STORE.get(mapKey);
  if (!Array.isArray(storedPaths)) {
    return [];
  }
  return storedPaths.map(clonePath);
};

const setStoredPathsForKey = (mapKey, paths) => {
  DRAWING_PATH_STORE.set(mapKey, paths.map(clonePath));
};

const getDrawingBounds = (drawingWidth, drawingHeight) => {
  const width = Math.max(drawingWidth, 1);
  const height = Math.max(drawingHeight, 1);
  const viewportAspectRatio = width / height;

  if (viewportAspectRatio >= DRAWING_ASPECT_RATIO) {
    const boundsHeight = height;
    const boundsWidth = boundsHeight * DRAWING_ASPECT_RATIO;
    return {
      x: (width - boundsWidth) / 2,
      y: 0,
      width: boundsWidth,
      height: boundsHeight,
    };
  }

  const boundsWidth = width;
  const boundsHeight = boundsWidth / DRAWING_ASPECT_RATIO;
  return {
    x: 0,
    y: (height - boundsHeight) / 2,
    width: boundsWidth,
    height: boundsHeight,
  };
};

const normalizePointFromClientToBounds = (
  clientX,
  clientY,
  rect,
  drawingWidth,
  drawingHeight,
  transformState,
) => {
  const width = Math.max(drawingWidth, 1);
  const height = Math.max(drawingHeight, 1);
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const scale =
    typeof transformState.scale === "number" &&
    Number.isFinite(transformState.scale) &&
    transformState.scale > 0
      ? transformState.scale
      : 1;
  const positionX =
    typeof transformState.positionX === "number" &&
    Number.isFinite(transformState.positionX)
      ? transformState.positionX
      : 0;
  const positionY =
    typeof transformState.positionY === "number" &&
    Number.isFinite(transformState.positionY)
      ? transformState.positionY
      : 0;
  const unzoomedX = (localX - positionX) / scale;
  const unzoomedY = (localY - positionY) / scale;
  const drawingBounds = getDrawingBounds(width, height);
  const viewboxX = (unzoomedX - drawingBounds.x) / drawingBounds.width;
  const viewboxY = (unzoomedY - drawingBounds.y) / drawingBounds.height;

  return {
    x: clamp01(viewboxX),
    y: clamp01(viewboxY),
  };
};

const normalizedPointToViewportPoint = (point, drawingWidth, drawingHeight) => {
  const drawingBounds = getDrawingBounds(drawingWidth, drawingHeight);
  const viewboxX = clamp01(point.x);
  const viewboxY = clamp01(point.y);

  return {
    x: drawingBounds.x + viewboxX * drawingBounds.width,
    y: drawingBounds.y + viewboxY * drawingBounds.height,
  };
};

const convertViewportNormalizedPointToMapNormalized = (
  point,
  viewportWidth,
  viewportHeight,
) => {
  const width = Math.max(viewportWidth, 1);
  const height = Math.max(viewportHeight, 1);
  const pixelX = clamp01(point.x) * width;
  const pixelY = clamp01(point.y) * height;
  const drawingBounds = getDrawingBounds(width, height);
  const viewboxX = (pixelX - drawingBounds.x) / drawingBounds.width;
  const viewboxY = (pixelY - drawingBounds.y) / drawingBounds.height;

  return {
    x: clamp01(viewboxX),
    y: clamp01(viewboxY),
  };
};

const normalizeIncomingPathBySpace = (
  incomingPath,
  payloadMeta,
  fallbackWidth,
  fallbackHeight,
) => {
  if (!incomingPath || typeof incomingPath !== "object") {
    return incomingPath;
  }
  if (!Array.isArray(incomingPath.points)) {
    return incomingPath;
  }

  const coordSpace =
    typeof payloadMeta?.coordSpace === "string"
      ? payloadMeta.coordSpace
      : "map_viewbox_v2";

  if (coordSpace === "map_viewbox_v2" || coordSpace === "map_viewbox_v1") {
    return incomingPath;
  }

  const viewportWidth =
    typeof payloadMeta?.viewportWidth === "number" &&
    Number.isFinite(payloadMeta.viewportWidth) &&
    payloadMeta.viewportWidth > 0
      ? payloadMeta.viewportWidth
      : fallbackWidth;
  const viewportHeight =
    typeof payloadMeta?.viewportHeight === "number" &&
    Number.isFinite(payloadMeta.viewportHeight) &&
    payloadMeta.viewportHeight > 0
      ? payloadMeta.viewportHeight
      : fallbackHeight;

  return {
    ...incomingPath,
    points: incomingPath.points.map((point) =>
      point &&
      typeof point.x === "number" &&
      Number.isFinite(point.x) &&
      typeof point.y === "number" &&
      Number.isFinite(point.y)
        ? convertViewportNormalizedPointToMapNormalized(
            point,
            viewportWidth,
            viewportHeight,
          )
        : point,
    ),
  };
};

const pointsToPathData = (points, toAbsolutePoint) => {
  if (!Array.isArray(points) || points.length < 2) {
    return "";
  }

  const start = toAbsolutePoint(points[0]);
  if (!start) {
    return "";
  }
  let path = `M ${start.x} ${start.y}`;

  for (let i = 1; i < points.length; i += 1) {
    const prevPoint = toAbsolutePoint(points[i - 1]);
    const currentPoint = toAbsolutePoint(points[i]);
    if (!prevPoint || !currentPoint) {
      return "";
    }

    if (i === 1) {
      path += ` L ${currentPoint.x} ${currentPoint.y}`;
      continue;
    }

    const next = points[i + 1];
    if (next) {
      const cpx = (prevPoint.x + currentPoint.x) / 2;
      const cpy = (prevPoint.y + currentPoint.y) / 2;
      path += ` Q ${cpx} ${cpy} ${currentPoint.x} ${currentPoint.y}`;
    } else {
      path += ` L ${currentPoint.x} ${currentPoint.y}`;
    }
  }

  return path;
};

const sanitizeIncomingPath = (incomingPath) => {
  if (!incomingPath || typeof incomingPath !== "object") {
    return null;
  }

  if (
    typeof incomingPath.id !== "string" ||
    typeof incomingPath.color !== "string"
  ) {
    return null;
  }

  const normalizedPoints = Array.isArray(incomingPath.points)
    ? incomingPath.points
        .filter(
          (point) =>
            point &&
            typeof point.x === "number" &&
            Number.isFinite(point.x) &&
            typeof point.y === "number" &&
            Number.isFinite(point.y),
        )
        .map((point) => ({
          x: clamp01(point.x),
          y: clamp01(point.y),
        }))
    : undefined;

  const pathData =
    typeof incomingPath.pathData === "string"
      ? incomingPath.pathData
      : undefined;

  if ((!normalizedPoints || normalizedPoints.length < 2) && !pathData) {
    return null;
  }

  return {
    id: incomingPath.id,
    points: normalizedPoints,
    pathData,
    color: incomingPath.color,
    strokeWidth:
      typeof incomingPath.strokeWidth === "number" &&
      Number.isFinite(incomingPath.strokeWidth)
        ? incomingPath.strokeWidth
        : 0.004,
    timestamp:
      typeof incomingPath.timestamp === "number" &&
      Number.isFinite(incomingPath.timestamp)
        ? incomingPath.timestamp
        : Date.now(),
  };
};

const upsertPath = (paths, path) => {
  const index = paths.findIndex((existingPath) => existingPath.id === path.id);
  if (index === -1) {
    return [...paths, path];
  }
  const nextPaths = [...paths];
  nextPaths[index] = path;
  return nextPaths;
};

const getAbsoluteStrokeWidth = (strokeWidth, baseDimension) => {
  if (typeof strokeWidth !== "number" || !Number.isFinite(strokeWidth)) {
    return MIN_STROKE_WIDTH;
  }
  if (strokeWidth <= 1) {
    return Math.max(strokeWidth * baseDimension, MIN_STROKE_WIDTH);
  }
  return Math.max(strokeWidth, MIN_STROKE_WIDTH);
};

export default function MapDrawingOverlay({
  mapKey,
  transformState = DEFAULT_TRANSFORM_STATE,
  targetSvgId = "main-map-svg",
  isTV = false,
}) {
  const containerRef = useRef(null);
  const drawingStateRef = useRef(null);
  const pathCounterRef = useRef(0);
  const mapSvgRef = useRef(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#0000FF");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [paths, setPaths] = useState(() => getStoredPathsForKey(mapKey));
  const [livePathsById, setLivePathsById] = useState({});
  const [currentPath, setCurrentPath] = useState(null);

  if (!drawingStateRef.current) {
    resetDrawingRef(drawingStateRef);
  }

  const drawingWidth =
    containerSize.width > 0
      ? containerSize.width
      : typeof window !== "undefined"
        ? window.innerWidth
        : 1;
  const drawingHeight =
    containerSize.height > 0
      ? containerSize.height
      : typeof window !== "undefined"
        ? window.innerHeight
        : 1;
  const activeTransform = useMemo(
    () => ({
      scale:
        typeof transformState.scale === "number" &&
        Number.isFinite(transformState.scale) &&
        transformState.scale > 0
          ? transformState.scale
          : 1,
      positionX:
        typeof transformState.positionX === "number" &&
        Number.isFinite(transformState.positionX)
          ? transformState.positionX
          : 0,
      positionY:
        typeof transformState.positionY === "number" &&
        Number.isFinite(transformState.positionY)
          ? transformState.positionY
          : 0,
    }),
    [transformState.positionX, transformState.positionY, transformState.scale],
  );

  const getMapSvgElement = useCallback(() => {
    if (mapSvgRef.current && document.body.contains(mapSvgRef.current)) {
      return mapSvgRef.current;
    }
    const element = document.getElementById(targetSvgId);
    if (element && typeof element.getScreenCTM === "function") {
      mapSvgRef.current = element;
      return element;
    }
    return null;
  }, [targetSvgId]);

  const getMapCtm = useCallback(() => {
    const svgElement = getMapSvgElement();
    if (!svgElement) return null;
    const ctm = svgElement.getScreenCTM?.();
    if (!ctm) return null;
    return { svgElement, ctm };
  }, [getMapSvgElement]);

  const mapNormalizedPointToViewportUsingMatrix = useCallback(
    (point) => {
      const matrixContext = getMapCtm();
      if (!matrixContext) {
        return normalizedPointToViewportPoint(
          point,
          drawingWidth,
          drawingHeight,
        );
      }

      const { svgElement, ctm } = matrixContext;
      const svgPoint = svgElement.createSVGPoint();
      svgPoint.x = clamp01(point.x) * MAP_VIEWBOX_WIDTH;
      svgPoint.y = clamp01(point.y) * MAP_VIEWBOX_HEIGHT;
      const screenPoint = svgPoint.matrixTransform(ctm);
      return {
        x: screenPoint.x,
        y: screenPoint.y,
      };
    },
    [drawingHeight, drawingWidth, getMapCtm],
  );

  const clientPointToMapNormalizedUsingMatrix = useCallback(
    (clientX, clientY, rect) => {
      const matrixContext = getMapCtm();
      if (matrixContext) {
        const { svgElement, ctm } = matrixContext;
        const svgPoint = svgElement.createSVGPoint();
        svgPoint.x = clientX;
        svgPoint.y = clientY;
        const mapPoint = svgPoint.matrixTransform(ctm.inverse());
        return {
          x: clamp01(mapPoint.x / MAP_VIEWBOX_WIDTH),
          y: clamp01(mapPoint.y / MAP_VIEWBOX_HEIGHT),
        };
      }

      return normalizePointFromClientToBounds(
        clientX,
        clientY,
        rect,
        drawingWidth,
        drawingHeight,
        activeTransform,
      );
    },
    [activeTransform, drawingHeight, drawingWidth, getMapCtm],
  );

  const baseDimension = useMemo(
    () => Math.max(Math.min(drawingWidth, drawingHeight), 1),
    [drawingHeight, drawingWidth],
  );

  const toNormalizedStrokeWidth = useCallback(
    (rawStrokeWidth) => {
      if (rawStrokeWidth <= 0) {
        return MIN_STROKE_WIDTH / baseDimension;
      }
      return rawStrokeWidth / baseDimension;
    },
    [baseDimension],
  );

  const getRenderablePathData = useCallback(
    (path) => {
      if (Array.isArray(path?.points) && path.points.length > 1) {
        return pointsToPathData(
          path.points,
          mapNormalizedPointToViewportUsingMatrix,
        );
      }
      if (typeof path?.pathData === "string") {
        return path.pathData;
      }
      return "";
    },
    [mapNormalizedPointToViewportUsingMatrix],
  );

  const updateContainerSize = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    const width = Math.round(element.offsetWidth);
    const height = Math.round(element.offsetHeight);
    if (width <= 0 || height <= 0) return;
    setContainerSize((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  useEffect(() => {
    const storedPaths = getStoredPathsForKey(mapKey);
    setPaths(storedPaths);
    setLivePathsById({});
    setCurrentPath(null);
    setIsDrawingEnabled(false);
    setIsControlsOpen(false);
    resetDrawingRef(drawingStateRef);
  }, [mapKey]);

  useEffect(() => {
    setStoredPathsForKey(mapKey, paths);
  }, [mapKey, paths]);

  useEffect(() => {
    updateContainerSize();

    window.addEventListener("resize", updateContainerSize);
    let resizeObserver;

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(updateContainerSize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateContainerSize);
      resizeObserver?.disconnect();
    };
  }, [updateContainerSize]);

  const { emitSync } = useSocketSync({
    "drawing:path_start": (payload) => {
      if (!payload || payload.mapKey !== mapKey) return;
      const normalizedIncomingPath = normalizeIncomingPathBySpace(
        payload.path,
        payload,
        drawingWidth,
        drawingHeight,
      );
      const sanitizedPath = sanitizeIncomingPath(normalizedIncomingPath);
      if (!sanitizedPath) return;
      setLivePathsById((previous) => ({
        ...previous,
        [sanitizedPath.id]: sanitizedPath,
      }));
    },
    "drawing:path_update": (payload) => {
      if (!payload || payload.mapKey !== mapKey) return;
      const normalizedIncomingPath = normalizeIncomingPathBySpace(
        payload.path,
        payload,
        drawingWidth,
        drawingHeight,
      );
      const sanitizedPath = sanitizeIncomingPath(normalizedIncomingPath);
      if (!sanitizedPath) return;
      setLivePathsById((previous) => ({
        ...previous,
        [sanitizedPath.id]: sanitizedPath,
      }));
    },
    "drawing:path_end": (payload) => {
      if (!payload || payload.mapKey !== mapKey) return;
      const normalizedIncomingPath = normalizeIncomingPathBySpace(
        payload.path,
        payload,
        drawingWidth,
        drawingHeight,
      );
      const sanitizedPath = sanitizeIncomingPath(normalizedIncomingPath);
      if (!sanitizedPath) return;

      setLivePathsById((previous) => {
        const next = { ...previous };
        delete next[sanitizedPath.id];
        return next;
      });
      setPaths((previous) => upsertPath(previous, sanitizedPath));
    },
    "drawing:undo": (payload) => {
      if (!payload || payload.mapKey !== mapKey) return;
      setPaths((previous) => previous.slice(0, -1));
    },
    "drawing:clear": (payload) => {
      if (!payload || payload.mapKey !== mapKey) return;
      setPaths([]);
      setLivePathsById({});
      setCurrentPath(null);
      resetDrawingRef(drawingStateRef);
    },
    "drawing:mode": (payload) => {
      if (!payload || payload.mapKey !== mapKey) return;
      const enabled = !!payload.enabled;
      setIsDrawingEnabled(enabled);
      setIsControlsOpen(enabled ? !!payload.controlsOpen : false);
      if (!enabled) {
        setCurrentPath(null);
        resetDrawingRef(drawingStateRef);
      }
    },
  });

  const emitDrawingEvent = useCallback(
    (type, payload = {}) => {
      emitSync(type, {
        mapKey,
        coordSpace: "map_viewbox_v2",
        viewportWidth: drawingWidth,
        viewportHeight: drawingHeight,
        ...payload,
      });
    },
    [drawingHeight, drawingWidth, emitSync, mapKey],
  );

  const startPath = useCallback(
    (clientX, clientY, pointerId) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const point = clientPointToMapNormalizedUsingMatrix(
        clientX,
        clientY,
        rect,
      );
      const newPath = {
        id: `path_${Date.now()}_${pathCounterRef.current++}`,
        points: [point],
        color: strokeColor,
        strokeWidth: toNormalizedStrokeWidth(strokeWidth),
        timestamp: Date.now(),
      };

      drawingStateRef.current = {
        isDrawing: true,
        currentPath: newPath,
        pointerId,
        lastUpdateTs: Date.now(),
      };
      setCurrentPath(newPath);
      emitDrawingEvent("drawing:path_start", { path: newPath });
    },
    [
      clientPointToMapNormalizedUsingMatrix,
      emitDrawingEvent,
      strokeColor,
      strokeWidth,
      toNormalizedStrokeWidth,
    ],
  );

  const updatePath = useCallback(
    (clientX, clientY, pointerId) => {
      const drawing = drawingStateRef.current;
      if (!drawing?.isDrawing || drawing.pointerId !== pointerId) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const nextPoint = clientPointToMapNormalizedUsingMatrix(
        clientX,
        clientY,
        rect,
      );
      const existingPoints = drawing.currentPath?.points || [];
      const lastPoint = existingPoints[existingPoints.length - 1];

      if (
        lastPoint &&
        Math.abs(lastPoint.x - nextPoint.x) < MIN_POINT_DELTA &&
        Math.abs(lastPoint.y - nextPoint.y) < MIN_POINT_DELTA
      ) {
        return;
      }

      const nextPath = {
        ...drawing.currentPath,
        points: [...existingPoints, nextPoint],
      };

      drawingStateRef.current = {
        ...drawing,
        currentPath: nextPath,
      };
      setCurrentPath(nextPath);

      const now = Date.now();
      if (now - drawing.lastUpdateTs >= PATH_UPDATE_INTERVAL_MS) {
        drawingStateRef.current = {
          ...drawingStateRef.current,
          lastUpdateTs: now,
        };
        emitDrawingEvent("drawing:path_update", { path: nextPath });
      }
    },
    [clientPointToMapNormalizedUsingMatrix, emitDrawingEvent],
  );

  const finishPath = useCallback(() => {
    const drawing = drawingStateRef.current;
    if (!drawing?.isDrawing) {
      return;
    }

    const finalizedPath = drawing.currentPath;
    resetDrawingRef(drawingStateRef);
    setCurrentPath(null);

    if (
      !finalizedPath ||
      !Array.isArray(finalizedPath.points) ||
      finalizedPath.points.length < 2
    ) {
      return;
    }

    const committedPath = {
      ...finalizedPath,
      timestamp: Date.now(),
    };

    setPaths((previous) => upsertPath(previous, committedPath));
    setLivePathsById((previous) => {
      const next = { ...previous };
      delete next[committedPath.id];
      return next;
    });
    emitDrawingEvent("drawing:path_end", { path: committedPath });
  }, [emitDrawingEvent]);

  const disableDrawingMode = useCallback(() => {
    setIsDrawingEnabled(false);
    setIsControlsOpen(false);
    setCurrentPath(null);
    resetDrawingRef(drawingStateRef);
    emitDrawingEvent("drawing:mode", {
      enabled: false,
      controlsOpen: false,
    });
  }, [emitDrawingEvent]);

  const handleMainButtonClick = useCallback(() => {
    if (!isDrawingEnabled) {
      setIsDrawingEnabled(true);
      setIsControlsOpen(true);
      emitDrawingEvent("drawing:mode", {
        enabled: true,
        controlsOpen: true,
      });
      return;
    }

    setIsControlsOpen((previous) => !previous);
  }, [emitDrawingEvent, isDrawingEnabled]);

  const handleUndo = useCallback(() => {
    if (paths.length === 0) {
      return;
    }
    setPaths((previous) => previous.slice(0, -1));
    emitDrawingEvent("drawing:undo");
  }, [emitDrawingEvent, paths.length]);

  const handleClearAll = useCallback(() => {
    setPaths([]);
    setLivePathsById({});
    setCurrentPath(null);
    resetDrawingRef(drawingStateRef);
    emitDrawingEvent("drawing:clear");
  }, [emitDrawingEvent]);

  const handlePointerDown = useCallback(
    (event) => {
      if (!isDrawingEnabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (drawingStateRef.current?.isDrawing) return;
      startPath(event.clientX, event.clientY, event.pointerId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    },
    [isDrawingEnabled, startPath],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!isDrawingEnabled) return;
      updatePath(event.clientX, event.clientY, event.pointerId);
      event.preventDefault();
    },
    [isDrawingEnabled, updatePath],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (!isDrawingEnabled) return;
      if (drawingStateRef.current?.pointerId !== event.pointerId) return;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      finishPath();
      event.preventDefault();
    },
    [finishPath, isDrawingEnabled],
  );

  const livePaths = useMemo(
    () => Object.values(livePathsById),
    [livePathsById],
  );
  const canUndo = paths.length > 0;
  const visiblePaths = [...paths, ...livePaths];

  return (
    <div ref={containerRef} style={styles.overlayContainer}>
      <svg
        width="100%"
        height="100%"
        style={{
          ...styles.svgCanvas,
          pointerEvents: isDrawingEnabled ? "auto" : "none",
          touchAction: isDrawingEnabled ? "none" : "manipulation",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <g>
          {visiblePaths.map((path) => {
            const pathData = getRenderablePathData(path);
            if (!pathData) return null;
            return (
              <path
                key={path.id}
                d={pathData}
                stroke={path.color}
                strokeWidth={getAbsoluteStrokeWidth(
                  path.strokeWidth,
                  baseDimension,
                )}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.9}
              />
            );
          })}

          {isDrawingEnabled && currentPath && (
            <path
              d={getRenderablePathData(currentPath)}
              stroke={currentPath.color}
              strokeWidth={getAbsoluteStrokeWidth(
                currentPath.strokeWidth,
                baseDimension,
              )}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.85}
            />
          )}
        </g>
      </svg>

      {!isTV && (
        <div style={styles.controlsContainer}>
          <div style={styles.controlsButtonsRow}>
            <button
              type="button"
              onClick={handleMainButtonClick}
              style={{
                ...styles.mainButton,
                ...(isDrawingEnabled ? styles.mainButtonActive : {}),
              }}
              className="overlay-drawing-button"
              aria-label={
                !isDrawingEnabled
                  ? "Enter drawing mode"
                  : isControlsOpen
                    ? "Hide drawing controls"
                    : "Show drawing controls"
              }
            >
              <PencilIcon
                size={20}
                strokeColor={isDrawingEnabled ? "#ffffff" : "#333333"}
              />
            </button>
          </div>

          {isDrawingEnabled && isControlsOpen && (
            <div style={styles.panel}>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Color</div>
                <div style={styles.colorRow}>
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      style={{
                        ...styles.colorButton,
                        backgroundColor: color,
                        ...(strokeColor === color
                          ? styles.colorButtonSelected
                          : {}),
                      }}
                      onClick={() => setStrokeColor(color)}
                      aria-label={`Set color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>Thickness</div>
                <div style={styles.strokeRow}>
                  {STROKE_WIDTHS.map((widthOption) => (
                    <button
                      key={widthOption}
                      type="button"
                      style={{
                        ...styles.strokeButton,
                        ...(strokeWidth === widthOption
                          ? styles.strokeButtonSelected
                          : {}),
                      }}
                      onClick={() => setStrokeWidth(widthOption)}
                      aria-label={`Set thickness ${widthOption}`}
                    >
                      <span
                        style={{
                          ...styles.strokePreview,
                          width: Math.max(widthOption * 2, 12),
                          height: Math.max(widthOption, 2),
                          backgroundColor: strokeColor,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.actionsRow}>
                <button
                  type="button"
                  style={{
                    ...styles.actionButton,
                    ...(canUndo ? null : styles.actionButtonDisabled),
                  }}
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  Undo
                </button>
                <button
                  type="button"
                  style={styles.actionButton}
                  onClick={handleClearAll}
                >
                  Clear
                </button>
                <button
                  type="button"
                  style={styles.actionButton}
                  onClick={disableDrawingMode}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  overlayContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 650,
  },
  svgCanvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  controlsContainer: {
    position: "absolute",
    top: "14vh",
    left: "3vw",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "auto",
    zIndex: 660,
  },
  controlsButtonsRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: 64,
  },
  mainButton: {
    width: 64,
    height: 46,
    borderRadius: 23,
    border: "1px solid rgba(0, 0, 0, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    color: "#1f2937",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mainButtonActive: {
    backgroundColor: "#97BC52",
    color: "#ffffff",
  },
  panel: {
    width: 260,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
  },
  colorRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: "2px solid #d1d5db",
    cursor: "pointer",
  },
  colorButtonSelected: {
    border: "3px solid #111827",
  },
  strokeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  strokeButton: {
    minWidth: 40,
    minHeight: 32,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    backgroundColor: "#f9fafb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "0 6px",
  },
  strokeButtonSelected: {
    border: "1px solid #0f766e",
    backgroundColor: "#ccfbf1",
  },
  strokePreview: {
    borderRadius: 4,
    display: "inline-block",
  },
  actionsRow: {
    display: "flex",
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    border: "1px solid #d1d5db",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    fontSize: 12,
    fontWeight: 600,
    padding: "7px 10px",
    cursor: "pointer",
  },
  actionButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
};
