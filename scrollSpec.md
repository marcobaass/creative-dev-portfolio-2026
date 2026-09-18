# Infinite looping horizontal scroll — technical spec

## Goal

A full-page horizontal experience where wheel/trackpad/touch/drag input drives movement
along an X axis, and scrolling far enough in either direction wraps back to the start
with no visible seam. Reference: patrickheng.com.

## Why this isn't native scroll

The browser's native `overflow-x: scroll` has a fixed scrollable range — there's no way
to make it infinite without periodically resetting `scrollLeft`, which is fragile and
requires duplicated content. This implementation avoids native scroll entirely:

- Nothing is inside an `overflow: scroll` container.
- Input (wheel/touch/drag) is captured and converted into a single, unbounded number:
  the **virtual scroll position**. It can grow or shrink forever — there is no min/max.
- Every frame, each section's on-screen position is _computed fresh_ from that number
  using modulo arithmetic, then applied via `transform: translate3d(x, 0, 0)`.
- Because position is recalculated from scratch every frame rather than incrementally
  moved, there's no seam to hide — wraparound is just a property of the modulo math,
  not an event that happens at a specific moment.

This also means only ONE copy of each section's DOM node is needed — no tripling/
duplicating content.

## Core algorithm

```js
// === State ===
let virtualScroll = 0 // unbounded accumulator, can go +/- forever
let renderedScroll = 0 // eased/lerped version actually used for rendering
const EASE = 0.08 // lerp factor for inertia; 1 = no easing

// === Track layout ===
// Each section has a fixed base position along an imaginary infinite track.
// trackWidth = total width of one full loop (sum of all section widths + gaps).
const sections = [...document.querySelectorAll('.section')].map((el, i) => ({
  el,
  baseX: computedBaseXFor(i), // cumulative offset within one loop
  width: el.offsetWidth,
}))
const trackWidth = sections.reduce((sum, s) => sum + s.width + GAP, 0)

// === Input capture ===
window.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    virtualScroll += e.deltaY // or deltaX depending on desired mapping
  },
  { passive: false },
)

// touch/pointer drag: on pointerdown, record startX; on pointermove,
// virtualScroll -= (currentX - lastX); on pointerup, optionally keep momentum.

// === Per-frame render loop ===
function tick() {
  renderedScroll += (virtualScroll - renderedScroll) * EASE // inertia/smoothing

  for (const s of sections) {
    // Position relative to current scroll, wrapped into [-trackWidth/2, trackWidth/2)
    // or [0, trackWidth) depending on convention — key part is the modulo:
    let x = (s.baseX - renderedScroll) % trackWidth
    if (x < -s.width) x += trackWidth // wrap forward
    if (x > window.innerWidth) x -= trackWidth // wrap backward
    s.el.style.transform = `translate3d(${x}px, 0, 0)`
  }

  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
```

### Key points for the modulo wrap

- `((baseX - scroll) % trackWidth + trackWidth) % trackWidth` is the safe form if you
  want a strictly non-negative result (JS `%` can return negative values). Then shift
  into a centered range as needed for your layout.
- `trackWidth` must be large enough that consecutive sections don't overlap, and should
  include enough buffer that when a section wraps from one edge to the other, it's fully
  off-screen at the moment it jumps — otherwise the wrap is visible.
- If sections have varying widths, precompute `baseX` as a running cumulative sum, not
  a fixed `i * itemWidth`.

## Structure

```
<body>
  <div class="viewport">           <!-- fixed size, overflow: hidden, NOT scrollable -->
    <div class="section" data-index="0">...</div>
    <div class="section" data-index="1">...</div>
    ...
  </div>
</body>
```

```css
.viewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.section {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}
```

- `overflow: hidden` on the viewport clips anything that wraps off-screen.
- `position: absolute` + `transform` on each section — never `left`/`margin`, for GPU-
  accelerated positioning and to avoid layout thrashing.
- `will-change: transform` hints the browser to promote each section to its own layer.

## Input handling details

- **Wheel**: `e.preventDefault()` is required or the page will also try to scroll
  natively. Map `deltaY` (most trackpads/mice) to horizontal movement.
- **Touch/drag**: use Pointer Events (`pointerdown/move/up`) rather than mouse+touch
  separately. Track `movementX` or delta between frames; on release, optionally apply
  decaying momentum (multiply remaining velocity by ~0.95 each frame until near zero).
- **Keyboard** (accessibility): consider arrow keys nudging `virtualScroll` by a fixed
  step, and respect `prefers-reduced-motion` by disabling easing/momentum.

## Optional: inertia/smoothing library

Rather than hand-rolling the lerp in `tick()`, libraries like **Lenis** (virtual smooth
scroll) can supply `renderedScroll`, or **GSAP** can drive the rAF loop and tween values.
The wrap-via-modulo logic is independent of whichever easing approach is used — it only
needs a single continuously-updating scroll number as input.

## Optional: WebGL/canvas layer

Sites like patrickheng.com layer a `<canvas>` (Three.js/OGL/raw WebGL) on top for
particle/rope/typography effects, synced to the same `virtualScroll` or `renderedScroll`
value so canvas-rendered elements move in lockstep with the DOM sections. This is a
separate, additive concern — the looping mechanism above works fully with plain DOM/CSS
and no canvas at all.

## Resize handling

Recompute `trackWidth`, each section's `width`, and `baseX` on window resize (debounced),
since these depend on viewport width and content layout.

## Minimal implementation checklist

1. Build viewport + absolutely-positioned sections, no native overflow-scroll.
2. Compute `baseX` per section and total `trackWidth`.
3. Capture wheel/pointer input into an unbounded `virtualScroll` value.
4. Run a `requestAnimationFrame` loop that eases `renderedScroll` toward `virtualScroll`.
5. Each frame, compute each section's wrapped `x` via modulo and apply
   `translate3d(x, 0, 0)`.
6. Handle resize, momentum/inertia, and reduced-motion as polish.
