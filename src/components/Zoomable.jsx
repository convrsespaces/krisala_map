import React, { useCallback, useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useSocketSync } from "../socket/socket";

const DEFAULT_TRANSFORM_STATE = Object.freeze({
  scale: 1,
  positionX: 0,
  positionY: 0,
});

const zoomStateStore = new Map();

const normalizeTransformState = (incomingState = {}) => ({
  scale:
    typeof incomingState.scale === "number" &&
    Number.isFinite(incomingState.scale) &&
    incomingState.scale > 0
      ? incomingState.scale
      : 1,
  positionX:
    typeof incomingState.positionX === "number" &&
    Number.isFinite(incomingState.positionX)
      ? incomingState.positionX
      : 0,
  positionY:
    typeof incomingState.positionY === "number" &&
    Number.isFinite(incomingState.positionY)
      ? incomingState.positionY
      : 0,
});

const areStatesEqual = (firstState, secondState) =>
  firstState.scale === secondState.scale &&
  firstState.positionX === secondState.positionX &&
  firstState.positionY === secondState.positionY;

const getZoomState = (syncKey) =>
  normalizeTransformState(
    zoomStateStore.get(syncKey) || DEFAULT_TRANSFORM_STATE,
  );

function Zoomable({
  children,
  syncKey = "default",
  onTransformChange,
  maxScale = 3,
}) {
  const transformApiRef = useRef(null);
  const suppressEmitRef = useRef(false);

  const [transformState, setTransformState] = useState(() =>
    getZoomState(syncKey),
  );

  const applyTransformState = useCallback(
    (nextState) => {
      const normalized = normalizeTransformState(nextState);
      zoomStateStore.set(syncKey, normalized);
      setTransformState((previous) =>
        areStatesEqual(previous, normalized) ? previous : normalized,
      );
      onTransformChange?.(normalized);

      if (transformApiRef.current) {
        suppressEmitRef.current = true;
        transformApiRef.current.setTransform(
          normalized.positionX,
          normalized.positionY,
          normalized.scale,
          0,
        );
      }
    },
    [onTransformChange, syncKey],
  );

  useEffect(() => {
    const storedState = getZoomState(syncKey);
    applyTransformState(storedState);
  }, [applyTransformState, syncKey]);

  const { emitSync } = useSocketSync({
    "map:zoom": (payload) => {
      if (!payload || payload.syncKey !== syncKey) return;
      applyTransformState(payload);
    },
  });

  const handleInit = useCallback(
    (ref) => {
      transformApiRef.current = ref;
      const storedState = getZoomState(syncKey);
      suppressEmitRef.current = true;
      ref.setTransform(
        storedState.positionX,
        storedState.positionY,
        storedState.scale,
        0,
      );
    },
    [syncKey],
  );

  const handleTransformed = useCallback(
    (_ref, state) => {
      const normalized = normalizeTransformState(state);
      zoomStateStore.set(syncKey, normalized);
      setTransformState((previous) =>
        areStatesEqual(previous, normalized) ? previous : normalized,
      );
      onTransformChange?.(normalized);

      if (suppressEmitRef.current) {
        suppressEmitRef.current = false;
        return;
      }

      emitSync("map:zoom", {
        syncKey,
        ...normalized,
      });
    },
    [emitSync, onTransformChange, syncKey],
  );

  return (
    <TransformWrapper
      initialScale={transformState.scale}
      initialPositionX={transformState.positionX}
      initialPositionY={transformState.positionY}
      maxScale={maxScale}
      panning={{ disabled: true }}
      onInit={handleInit}
      onTransformed={handleTransformed}
    >
      <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }}>
        {children}
      </TransformComponent>
    </TransformWrapper>
  );
}

export default Zoomable;
