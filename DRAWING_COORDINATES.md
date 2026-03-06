## Drawing system: consistent coordinates across tablet and TV

This document explains how the drawing system keeps annotations in **exactly the same logical place** regardless of:

- Screen size or resolution
- Whether the content is shown in the **tablet app** or on the **TV (WebView)** 
- Image zooming / panning within viewers

At a high level:

- **All drawing points are stored in normalized (0–1) coordinates**, not pixels.
- Each screen defines a **drawing bounds rectangle** that describes where the visual content is on that screen.
- When rendering, normalized points are converted back to pixels using the **current drawing bounds** for that device.
- Paths are synced over the network using only these **normalized points**, so any device can re-render them in the right place.

---

### 1. Normalized coordinate system (`DrawingCanvas`)

The core implementation is in `DrawingCanvas.tsx`.

- Each point in a path is a **normalized point**:

  ```ts
  interface NormalizedPoint {
    x: number; // 0–1 across the drawing bounds width
    y: number; // 0–1 across the drawing bounds height
  }
  ```

- When the user draws, gesture coordinates (in screen pixels) are **normalized into 0–1 space** relative to `drawingBounds`:

  \[
  x_\text{norm} = \text{clamp}\left(\frac{\text{gestureX} - \text{bounds.x}}{\text{bounds.width}}, 0, 1\right)
  \]
  \[
  y_\text{norm} = \text{clamp}\left(\frac{\text{gestureY} - \text{bounds.y}}{\text{bounds.height}}, 0, 1\right)
  \]

- A `DrawingPath` stores only:

  - **Normalized points** (0–1) and
  - A **normalized stroke width** (relative to a base dimension)

This means a path is **independent of actual pixel size** of the container or device.

---

### 2. Converting normalized paths back to pixels

When rendering, `DrawingCanvas` converts normalized points back into pixel coordinates using the **current drawing bounds**:

\[
 x_\text{px} = \text{bounds.x} + x_\text{norm} \times \text{bounds.width}
\]
\[
 y_\text{px} = \text{bounds.y} + y_\text{norm} \times \text{bounds.height}
\]

- This happens inside the `pointsToPath` function, which builds an SVG path (`d` attribute) from normalized points.
- Stroke width is also scaled from **normalized** to **absolute** using a `baseDimension` derived from the bounds:

  - Narrower / smaller bounds → smaller pixel stroke.
  - Larger bounds → proportionally thicker stroke.

Because **both normalization (on input)** and **denormalization (on render)** use the same `drawingBounds`, drawings stay aligned with the visual content even if:

- The container size changes (different tablets, rotations).
- The content is letterboxed / centered.

---

### 3. Drawing bounds (`DrawingBounds`)

`DrawingBounds` describes where drawing should happen inside the overall container:

```ts
interface DrawingBounds {
  x: number;      // left offset in container pixels
  y: number;      // top offset in container pixels
  width: number;  // drawable width in pixels
  height: number; // drawable height in pixels
}
```

- If a valid `drawingBounds` is passed in, the canvas **restricts drawing to that rect**.
- Otherwise, it falls back to using the **full container**.

This is the key to keeping drawings synced between:

- The **tablet viewer** (`ImageViewer.tsx`) and
- The **TV viewer** (`WebViewZoomImageViewer.tsx`)

Both viewers compute a **content rectangle** that represents where the image actually appears in their layout, and pass that as `drawingBounds` into `DrawingOverlay` → `DrawingCanvas`.

---

### 4. Tablet image viewer (`ImageViewer.tsx`)

On tablet, we use `react-native-image-zoom-viewer` to show images. The drawing layer is `DrawingOverlay`, which renders `DrawingCanvas` on top of the image.

`ImageViewer` keeps drawings aligned by:

- Tracking the **viewer container size** (`viewerLayout`).
- Estimating an initial image viewport using `calculateViewerViewport` (fit image-to-container, center, no upscaling).
- Measuring the **actual rendered image rect** using `measureInWindow`:

  - Measure container position.
  - Measure active image position.
  - Subtract to compute the image’s `(x, y, width, height)` **inside the container**.

- Storing this rect as `drawingBounds` and passing it into `DrawingOverlay`.

Result:

- When you draw on the tablet, your strokes are **normalized against the real image rect**, not the whole screen.
- Resizing, rotating, or different tablet sizes still show drawings in the **same logical place on the image**.

---

### 5. TV WebView image viewer (`WebViewZoomImageViewer.tsx`)

On TV, images are displayed inside a `WebView`, but we still use the same drawing system.

Key points:

- `WebViewZoomImageViewer` keeps track of the **image viewport inside the WebView**.
- It uses a 16:9 **drawing content rect** (`ASPECT_RATIO_16_9`) so that:

  - The tablet and TV both assume a **consistent 16:9 logical area** for drawings.
  - Even if the physical screens differ, the **relative drawing area** is the same.

- Whenever the image zoom or pan changes inside the WebView, the JS side posts a message with the updated viewport. React Native:

  - Calls `queueViewportBoundsUpdate`.
  - Updates `drawingBounds` for the TV screen.

- `DrawingOverlay` on TV receives the same kind of `drawingBounds` as on tablet and renders `DrawingCanvas` with the same normalized paths.

Result:

- A path drawn on the tablet at normalized point `(0.25, 0.4)` over the 16:9 content rect will render at the **same relative location** on the TV’s 16:9 content rect.
- Differences in TV resolution, bezel, or WebView layout **do not affect** where the path appears.

---

### 6. Cross-device syncing of paths

Paths are shared between devices using normalized coordinates only.

- `syncUtils.ts` converts local `DrawingPath` to a `SyncedDrawingPath`:

  - All points are clamped to \[0, 1\].
  - Stroke width and timestamp are preserved.

- When a device receives a path:

  - `sanitizeIncomingDrawingPath` validates and clamps points back into \[0, 1\].
  - The path is stored in Redux and passed to `DrawingCanvas` along with the **current device’s `drawingBounds`**.

Because each device:

1. Uses the **same normalized points**, and  
2. Applies them to its own **drawing bounds** that represent the visible image,

every device renders the path in the **same logical place** on the image, regardless of:

- Tablet vs TV
- Screen size / resolution
- Zoom / pan state (as long as the viewport is kept in sync)

---

### 7. Notepad (`NotePad.tsx`)

The notepad uses the same principles:

- Drawing paths are captured via `DrawingCanvas` with normalized coordinates.
- For exporting to images / JSON, paths are converted to an **export canvas size** (e.g. 1200×1800).

This again means notes can be **saved and rendered at different resolutions** while keeping strokes aligned and proportional.

---

### 8. Summary

- **Normalize first**: all drawing input is converted into normalized 0–1 coordinates within a well-defined `drawingBounds` rectangle.
- **Render later**: each device converts normalized paths back to pixels using its own `drawingBounds` that matches how the image is shown.
- **Sync normalized data only**: paths synced between tablet and TV are device-independent.

That combination is what keeps drawings in **exactly the same place** across different screens and devices.

