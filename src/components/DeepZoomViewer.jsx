import React, {
    useRef,
    useEffect,
    useState,
    useImperativeHandle,
    forwardRef,
    useCallback,
    useMemo,
  } from 'react';
  import OpenSeadragon from 'openseadragon';
  
  /**
   * DeepZoomViewer — Tiled deep-zoom viewer for ultra-high-resolution images.
   *
   * This implementation replaces single-image zooming with a tiled deep-zoom
   * viewer, eliminating first-zoom lag by design and making the system
   * production-safe for ultra-high-resolution images.
   *
   * Architecture:
   *   - Image is pre-split into 512×512 tiles across a multi-level zoom pyramid
   *   - Only visible tiles at the current zoom level are loaded and rasterized
   *   - No full-image rasterization ever occurs
   *   - Zooming loads new tiles instead of scaling pixels
   *
   * Requires: Tiles generated via `vips dzsave` (see scripts/generate-tiles.js)
   */
  
  // ─── Default tile configuration ─────────────────────────────────────────────
  const DEFAULTS = {
    // CDN base URL for the DZI _files directory (trailing slash required)
    tileBaseUrl:
      'https://d1ovqzmursgzel.cloudfront.net/krisala-img/krisala-updated-masterplan/',
    format: 'webp',
    tileSize: 512,
    overlap: 1,
    width: 7016,
    height: 9934,
  };
  
  // ─── Component ──────────────────────────────────────────────────────────────
  const DeepZoomViewer = forwardRef(
    (
      {
        // Tile source configuration
        tileBaseUrl = DEFAULTS.tileBaseUrl,
        tileFormat = DEFAULTS.format,
        tileSize = DEFAULTS.tileSize,
        tileOverlap = DEFAULTS.overlap,
        imageWidth = DEFAULTS.width,
        imageHeight = DEFAULTS.height,
  
        // View configuration
        rotation = 0,
        minZoomLevel = 0.5,
        maxZoomLevel = 20,
  
        // Callbacks
        onZoomChange,
        onReady,
  
        // Overlays: array of { x, y, html, className, style, placement }
        // Coordinates are in IMAGE PIXELS (0..9933 for x, 0..14041 for y)
        overlays = [],
  
        // UI options
        showMinimap = false,
        style = {},
      },
      ref,
    ) => {
      const containerRef = useRef(null);
      const viewerRef = useRef(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const prevRotationRef = useRef(rotation);
      const mountedRef = useRef(true);
  
      // Stable tile source object (only recompute when tile params change)
      const tileSource = useMemo(
        () => ({
          Image: {
            xmlns: 'http://schemas.microsoft.com/deepzoom/2008',
            Url: tileBaseUrl,
            Format: tileFormat,
            Overlap: String(tileOverlap),
            TileSize: String(tileSize),
            Size: {
              Width: String(imageWidth),
              Height: String(imageHeight),
            },
          },
        }),
        [tileBaseUrl, tileFormat, tileOverlap, tileSize, imageWidth, imageHeight],
      );
  
      // ─── Imperative API (via ref) ──────────────────────────────────────
      useImperativeHandle(
        ref,
        () => ({
          /** Zoom in by 1.5× */
          zoomIn() {
            const vp = viewerRef.current?.viewport;
            if (vp) {
              vp.zoomBy(1.5);
              vp.applyConstraints();
            }
          },
  
          /** Zoom out by 0.67× */
          zoomOut() {
            const vp = viewerRef.current?.viewport;
            if (vp) {
              vp.zoomBy(0.67);
              vp.applyConstraints();
            }
          },
  
          /** Reset to home (fit entire image in viewport) */
          resetView() {
            viewerRef.current?.viewport?.goHome();
          },
  
          /** Set rotation in degrees */
          setRotation(degrees) {
            viewerRef.current?.viewport?.setRotation(degrees);
          },
  
          /** Get current rotation in degrees */
          getRotation() {
            return viewerRef.current?.viewport?.getRotation() ?? 0;
          },
  
          /** Get the raw OpenSeadragon viewer instance */
          getViewer() {
            return viewerRef.current;
          },
  
          /**
           * Add an HTML overlay at image coordinates.
           * @param {{ x: number, y: number, html?: string, className?: string, style?: object }} config
           * @returns {HTMLElement} The overlay element (use for removal)
           */
          addOverlay(config) {
            const viewer = viewerRef.current;
            if (!viewer) return null;
            const el = document.createElement('div');
            el.innerHTML = config.html || '';
            el.className = config.className || '';
            if (config.style) Object.assign(el.style, config.style);
            viewer.addOverlay({
              element: el,
              location: new OpenSeadragon.Point(
                config.x / imageWidth,
                config.y / imageHeight,
              ),
              placement:
                config.placement || OpenSeadragon.Placement.CENTER,
              checkResize: false,
            });
            return el;
          },
  
          /** Remove a specific overlay element */
          removeOverlay(el) {
            viewerRef.current?.removeOverlay(el);
          },
  
          /** Clear all overlays */
          clearOverlays() {
            viewerRef.current?.clearOverlays();
          },
  
          /**
           * Convert image pixel coordinates to viewport coordinates.
           * Useful for positioning custom React-rendered overlays.
           */
          imageToViewport(imageX, imageY) {
            const vp = viewerRef.current?.viewport;
            if (!vp) return null;
            const tiledImage = viewerRef.current.world.getItemAt(0);
            if (!tiledImage) return null;
            const viewportPoint = tiledImage.imageToViewportCoordinates(
              imageX,
              imageY,
            );
            return vp.viewportToViewerElementCoordinates(viewportPoint);
          },
        }),
        [imageWidth, imageHeight],
      );
  
      // ─── Mount / Destroy OpenSeadragon ─────────────────────────────────
      useEffect(() => {
        if (!containerRef.current) return;
  
        mountedRef.current = true;
        setLoading(true);
        setError(null);
  
        // Prevent duplicate viewers
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
  
        const viewer = OpenSeadragon({
          element: containerRef.current,
  
          // Tile source (inline DZI — no .dzi file needed on server)
          tileSources: tileSource,
  
          // ─── Touch gestures (mobile / tablet) ───────────────────
          gestureSettingsTouch: {
            pinchToZoom: true,
            scrollToZoom: false,
            clickToZoom: false,
            dblClickToZoom: true,
            flickEnabled: true,
            flickMinSpeed: 120,
            flickMomentum: 0.25,
            pinchRotate: false,
          },
  
          // ─── Mouse gestures (desktop) ───────────────────────────
          gestureSettingsMouse: {
            scrollToZoom: true,
            clickToZoom: false,
            dblClickToZoom: true,
            flickEnabled: true,
            flickMinSpeed: 120,
            flickMomentum: 0.25,
          },
  
          // ─── Zoom behaviour ─────────────────────────────────────
          defaultZoomLevel: 0, // 0 = auto-fit image to viewport
          minZoomLevel: minZoomLevel,
          maxZoomLevel: maxZoomLevel,
          visibilityRatio: 0.8,
          constrainDuringPan: true,
          zoomPerClick: 1.5,
          zoomPerScroll: 1.3,
  
          // ─── Animation (smooth inertia) ─────────────────────────
          animationTime: 0.3,
          springStiffness: 10,
  
          // ─── Performance (critical for low-end Android) ─────────
          imageLoaderLimit: 4, // Max parallel tile downloads
          maxImageCacheCount: 200, // Cap tile cache for memory
          immediateRender: true, // Show tiles as soon as loaded
          placeholderFillStyle: '#f5f5f5',
          minPixelRatio: 0.5, // Load half-res tiles for faster perceived load
          smoothTileEdgesMinZoom: 1.1,
  
          // ─── UI (custom controls rendered by parent) ────────────
          showNavigationControl: false,
          showNavigator: showMinimap,
          navigatorPosition: 'BOTTOM_RIGHT',
          navigatorSizeRatio: 0.15,
          navigatorAutoFade: true,
          showZoomControl: false,
          showHomeControl: false,
          showFullPageControl: false,
          showRotationControl: false,
  
          // ─── Cross-origin (CDN tiles) ───────────────────────────
          // Set to false to avoid CORS preflight on tile requests.
          // Tiles are loaded as plain <img> tags — no pixel access needed.
          crossOriginPolicy: false,
          ajaxWithCredentials: false,
          loadTilesWithAjax: false,
  
          // ─── Debug ──────────────────────────────────────────────
          debugMode: false,
        });
  
        viewerRef.current = viewer;
  
        // ── Event: tiles opened successfully ──
        viewer.addHandler('open', () => {
          if (!mountedRef.current) return;
          setLoading(false);
  
          // Apply initial rotation
          if (rotation !== 0) {
            viewer.viewport.setRotation(rotation);
          }
  
          prevRotationRef.current = rotation;
          onReady?.(viewer);
        });
  
        // ── Event: zoom changed ──
        viewer.addHandler('zoom', (event) => {
          onZoomChange?.(event.zoom);
        });
  
        // ── Event: tile source failed to open ──
        viewer.addHandler('open-failed', (event) => {
          if (!mountedRef.current) return;
          console.error('[DeepZoomViewer] Open failed:', event.message);
          setLoading(false);
          setError(
            'Failed to load image tiles. Ensure tiles have been generated and uploaded to the CDN. ' +
              'See scripts/generate-tiles.js for instructions.',
          );
        });
  
        // ── Event: individual tile failed (edge tiles, network blips) ──
        viewer.addHandler('tile-load-failed', (event) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[DeepZoomViewer] Tile load failed:', event.tile?.url);
          }
        });
  
        // ── Cleanup on unmount ──
        return () => {
          mountedRef.current = false;
          if (viewerRef.current) {
            viewerRef.current.destroy();
            viewerRef.current = null;
          }
        };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [tileSource, minZoomLevel, maxZoomLevel, showMinimap]);
  
      // ─── Handle rotation prop changes ──────────────────────────────────
      useEffect(() => {
        if (
          prevRotationRef.current !== rotation &&
          viewerRef.current?.viewport
        ) {
          viewerRef.current.viewport.setRotation(rotation);
          prevRotationRef.current = rotation;
        }
      }, [rotation]);
  
      // ─── Handle declarative overlays ───────────────────────────────────
      useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || loading) return;
  
        // Clear previous overlays
        viewer.clearOverlays();
  
        // Add declared overlays
        overlays.forEach((overlay) => {
          const el = document.createElement('div');
          el.innerHTML = overlay.html || '';
          el.className = overlay.className || '';
          if (overlay.style) Object.assign(el.style, overlay.style);
  
          viewer.addOverlay({
            element: el,
            location: new OpenSeadragon.Point(
              // Normalize image-pixel coords to [0..1] viewport fraction
              overlay.x / imageWidth,
              overlay.y / imageHeight,
            ),
            placement:
              overlay.placement || OpenSeadragon.Placement.CENTER,
            checkResize: false,
          });
        });
      }, [overlays, loading, imageWidth, imageHeight]);
  
      // ─── Render ────────────────────────────────────────────────────────
      return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            ...style,
          }}
        >
          {/* OpenSeadragon mount point */}
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              touchAction: 'none',
            }}
          />
  
          {/* Loading overlay */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.92)',
                zIndex: 10,
              }}
            >
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: '3px solid #e0e0e0',
                    borderTop: '3px solid #555',
                    borderRadius: '50%',
                    animation: 'dzv-spin 0.8s linear infinite',
                    margin: '0 auto 12px',
                  }}
                />
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  Loading masterplan…
                </div>
              </div>
            </div>
          )}
  
          {/* Error overlay */}
          {error && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.96)',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  maxWidth: 360,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#c00',
                    marginBottom: 8,
                  }}
                >
                  Tile Load Error
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                  {error}
                </div>
              </div>
            </div>
          )}
  
          {/* Scoped keyframes */}
          <style>{`
            @keyframes dzv-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    },
  );
  
  DeepZoomViewer.displayName = 'DeepZoomViewer';
  
  export { DeepZoomViewer };
  export default DeepZoomViewer;
  