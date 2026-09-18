# Todo

Homescreen:
[x] animate divider in with gsap or css animation
[x] animate html letters in with gsap or css animation
[ ] add responsiveness for mobile

[ ] Build horizontal scroll engine: unbounded-input-but-clamped virtualScroll accumulator, rAF loop easing renderedScroll toward it (per scrollSpec.md, minus the modulo wraparound)
[ ] Define fixed section order and baseX positions along the track: Impressum/Techstack/About <- Home -> Portfolio (project panels), compute trackWidth/bounds for clamping
[ ] Capture wheel + pointer drag input into virtualScroll (preventDefault on wheel, pointerdown/move/up for drag with optional momentum), clamp to track bounds
[ ] Apply transform: translate3d(x,0,0) per section each frame from renderedScroll; viewport is overflow:hidden, sections are position:absolute (per spec's CSS structure, no wrap logic needed)
[ ] Refactor Scene.tsx: make the R3F Canvas persistent/full-page, sync letters/shader position or camera to the same renderedScroll value so canvas content moves in lockstep with DOM sections
[ ] Wire physics pause/resume: reuse the per-frame computed x/visibility of the Home section (no separate IntersectionObserver needed) to sleep/wake the Rapier world
[ ] Build persistent "home" navigation menu: small always-visible UI that tweens virtualScroll/renderedScroll directly to Home's baseX from anywhere, regardless of current scroll direction
[ ] Add homepage content below the letters: divider line + "Creative Webdeveloper" tagline, positioned so it doesn't conflict with falling letters/physics cage
[ ] Build Portfolio panel(s): project list/grid or panel-per-project, plain HTML/CSS layout, populated with real content later
[ ] Build About Me panel: bio content, tech stack section, Impressum section (sub-sections within one panel or separate flat panels in the track)
[ ] Implement watercolor mouse-trail shader: ping-pong FBO (two render targets), each frame blend previous faded trail + new paint at mouse position, render as full-screen background plane
[ ] Tune shader fade/decay rate and brush size/color so the trail feels "watercolor" (soft edges, color bleed) rather than a hard sharp trail
[ ] Add navigation affordance (dots/labels) reflecting current position in the bounded track, clickable to jump between panels
[ ] Handle resize (recompute baseX/trackWidth/clamped bounds), keyboard accessibility (arrow keys nudge virtualScroll), and prefers-reduced-motion
[ ] Cross-browser/perf pass: test horizontal scroll + physics + shader together for frame drops, adjust (e.g. lower shader resolution, cap letter physics substeps) as needed
