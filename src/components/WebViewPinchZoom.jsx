import React, { useRef, useEffect, useState } from 'react';

/**
 * WebViewPinchZoom — Lag-free pinch-zoom component.
 *
 * Strategy: The original image is 9933×14041 (139 MP). On first zoom the
 * browser must re-rasterize from the full 139 MP source → lag.
 *
 * Fix: We downsample to ~4096px using createImageBitmap (off main thread),
 * draw onto an offscreen canvas, export as a blob URL, and display that in
 * a regular <img>. Re-rasterizing from a 4096px source is ~10× faster
 * and eliminates the first-zoom lag entirely.
 */

const IMAGE_URL = "https://d1ovqzmursgzel.cloudfront.net/krisala-img/masterplan2.webp";
const MAX_DIM = 4096;

const WebViewPinchZoom = ({
  imageSrc = IMAGE_URL,
  minScale = 0.5,
  maxScale = 5,
  onZoomChange,
}) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [optimizedSrc, setOptimizedSrc] = useState(null);
  const [ready, setReady] = useState(false);

  // ── Step 1: Download, resize off-thread, export as small blob URL ──
  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      console.log('[Zoom] Loading original image…');
      const src = new Image();
      src.crossOrigin = 'anonymous';
      src.src = imageSrc;

      await new Promise((res, rej) => {
        if (src.complete && src.naturalWidth > 0) return res();
        src.onload = res;
        src.onerror = rej;
      });

      if (cancelled) return;
      const nw = src.naturalWidth;
      const nh = src.naturalHeight;
      console.log('[Zoom] Original:', nw, '×', nh);

      const ratio = Math.min(MAX_DIM / nw, MAX_DIM / nh, 1);
      const bw = Math.round(nw * ratio);
      const bh = Math.round(nh * ratio);

      // Resize off main thread
      let bitmap = src;
      if (typeof createImageBitmap === 'function') {
        try {
          bitmap = await createImageBitmap(src, {
            resizeWidth: bw,
            resizeHeight: bh,
            resizeQuality: 'high',
          });
          console.log('[Zoom] Resized to', bw, '×', bh, 'via createImageBitmap');
        } catch (e) {
          console.warn('[Zoom] createImageBitmap failed:', e);
        }
      }
      if (cancelled) { if (bitmap.close) bitmap.close(); return; }

      // Draw onto offscreen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = bw;
      offscreen.height = bh;
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, bw, bh);
      if (bitmap !== src && bitmap.close) bitmap.close();

      // Export as blob URL
      const blob = await new Promise(r => offscreen.toBlob(r, 'image/webp', 0.92));
      if (cancelled) return;

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      console.log('[Zoom] Blob URL ready, size:', (blob.size / 1024).toFixed(0), 'KB');
      setOptimizedSrc(url);
    }

    prepare().catch(err => {
      console.error('[Zoom] Prepare failed, using original:', err);
      if (!cancelled) setOptimizedSrc(imageSrc); // fallback to original
    });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [imageSrc]);

  // ── Step 2: Once the <img> is showing the optimized src, wire up zoom ──
  useEffect(() => {
    if (!optimizedSrc) return;
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    let destroyed = false;
    let scale = 1, tx = 0, ty = 0;
    let dragging = false, pinching = false;
    let initDist = 0, initScale = 1;
    let lastX = 0, lastY = 0, panStartTx = 0, panStartTy = 0;
    let mouseDown = false;
    let lastTap = 0, lastPinchEnd = 0;
    let raf = null;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const snap = s => Math.abs(s - 1) < 0.05 ? 1 : s;

    function bounds() {
      const cr = container.getBoundingClientRect();
      const iw = img.offsetWidth;
      const ih = img.offsetHeight;
      return {
        mx: Math.max((iw * scale - cr.width) / 2, 0),
        my: Math.max((ih * scale - cr.height) / 2, 0),
      };
    }

    function limitPan() {
      if (scale <= 1) { tx = 0; ty = 0; return; }
      const { mx, my } = bounds();
      tx = clamp(tx, -mx, mx);
      ty = clamp(ty, -my, my);
    }

    function apply(animate) {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        img.style.transition = animate ? 'transform .2s ease-out' : 'none';
        img.style.transform = `translate(${tx}px,${ty}px) scale(${scale}) translateZ(0)`;
      });
      onZoomChange?.(scale);
    }

    // ── Touch ──
    function onTouchStart(e) {
      e.preventDefault();
      if (e.touches.length === 2) {
        pinching = true;
        initDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        );
        initScale = scale;
      } else if (e.touches.length === 1) {
        dragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        panStartTx = tx;
        panStartTy = ty;
      }
      apply(false);
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (e.touches.length === 2 && pinching) {
        const d = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        );
        let ns = clamp(initScale * (d / initDist), minScale, maxScale);
        if (ns < 0.9) ns = 0.9;
        scale = ns;
        limitPan();
        apply(false);
      } else if (e.touches.length === 1 && dragging) {
        tx = panStartTx + (e.touches[0].clientX - lastX);
        ty = panStartTy + (e.touches[0].clientY - lastY);
        limitPan();
        apply(false);
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length < 2 && pinching) {
        pinching = false;
        lastPinchEnd = Date.now();
      }
      if (e.touches.length === 0) {
        scale = snap(scale);
        if (scale === 1) { tx = 0; ty = 0; }
        limitPan();
        dragging = false;
        apply(true);

        const now = Date.now();
        if (now - lastPinchEnd > 350 && now - lastTap < 300) {
          if (scale > 1) { scale = 1; tx = 0; ty = 0; }
          else { scale = 2; }
          limitPan();
          apply(true);
        }
        lastTap = now;
      }
    }

    // ── Mouse (desktop) ──
    function onMouseDown(e) {
      if (e.button !== 0) return;
      mouseDown = true;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      panStartTx = tx;
      panStartTy = ty;
      img.style.cursor = 'grabbing';
      apply(false);
      e.preventDefault();
    }
    function onMouseMove(e) {
      if (!mouseDown) return;
      tx = panStartTx + (e.clientX - lastX);
      ty = panStartTy + (e.clientY - lastY);
      limitPan();
      apply(false);
    }
    function onMouseUp() {
      if (!mouseDown) return;
      mouseDown = false;
      dragging = false;
      img.style.cursor = 'grab';
      scale = snap(scale);
      if (scale === 1) { tx = 0; ty = 0; }
      limitPan();
      apply(true);
    }
    function onDblClick() {
      if (scale > 1) { scale = 1; tx = 0; ty = 0; }
      else { scale = 2; }
      limitPan();
      apply(true);
    }

    // ── Wheel / trackpad ──
    let wheelTimer = null;
    function onWheel(e) {
      e.preventDefault();
      const factor = e.ctrlKey ? -e.deltaY * 0.003 : -e.deltaY * 0.002;
      let ns = clamp(scale * (1 + factor), minScale, maxScale);
      if (ns < 0.9) ns = 0.9;
      scale = ns;
      if (scale <= 1) { tx = 0; ty = 0; } else { limitPan(); }
      apply(false);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        scale = snap(scale);
        if (scale === 1) { tx = 0; ty = 0; }
        apply(true);
      }, 200);
    }

    // ── Gesture prevention ──
    function prevent(e) { e.preventDefault(); }

    // ── Pre-warm GPU layer once img loaded ──
    function preWarm() {
      if (destroyed) return;
      img.style.willChange = 'transform';
      img.style.transform = 'translate(0px,0px) scale(1) translateZ(0)';
      void img.offsetHeight;
      console.log('[Zoom] Pre-warmed, img size:', img.offsetWidth, '×', img.offsetHeight);
      setReady(true);
    }
    if (img.complete && img.naturalWidth > 0) {
      preWarm();
    } else {
      img.addEventListener('load', preWarm, { once: true });
    }

    // ── Attach listeners ──
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    img.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    img.addEventListener('dblclick', onDblClick);
    container.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('gesturestart', prevent, { passive: false });
    document.addEventListener('gesturechange', prevent, { passive: false });
    document.addEventListener('gestureend', prevent, { passive: false });

    return () => {
      destroyed = true;
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      img.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      img.removeEventListener('dblclick', onDblClick);
      container.removeEventListener('wheel', onWheel);
      document.removeEventListener('gesturestart', prevent);
      document.removeEventListener('gesturechange', prevent);
      document.removeEventListener('gestureend', prevent);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(wheelTimer);
    };
  }, [optimizedSrc, minScale, maxScale, onZoomChange]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        position: 'relative',
      }}
    >
      {optimizedSrc ? (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt=""
          draggable={false}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            willChange: 'transform',
            transformOrigin: 'center center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            cursor: 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto',
            opacity: ready ? 1 : 0,
            transition: 'opacity .15s',
          }}
        />
      ) : null}
      {!ready && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          color: '#888',
          fontSize: 14,
        }}>
          Loading...
        </div>
      )}
    </div>
  );
};

export default WebViewPinchZoom;
