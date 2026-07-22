# Anime.js v4 — Reference

Anime.js v4 (https://animejs.com/) is a complete API rewrite from v3 — there is no more global `anime` object. Everything is imported as named, tree-shakeable functions. If any training-data memory suggests `anime({...})` or `anime.timeline({...})`, that is the old v3 API — do not use it here.

```bash
npm install animejs
```

## Core imports

```js
import { animate, createTimeline, stagger, createScope, createSpring, onScroll, createDraggable } from 'animejs';
```

## Basic animation

```js
animate('.card', {
  opacity: [0, 1],
  translateY: [12, 0],
  duration: 500,
  ease: 'outExpo', // eased, never linear — required by this project's motion rules
});
```

## Staggering a list (e.g., student list rows, attendance list rows)

```js
import { animate, stagger } from 'animejs';

animate('.student-row', {
  opacity: [0, 1],
  translateY: [10, 0],
  delay: stagger(60), // each row offset by 60ms — reads as layered, not simultaneous
  ease: 'outQuad',
});
```
`stagger()` also accepts units directly (`stagger('1rem')`) and a `reversed` option (renamed from v3's `direction`) — see docs if a reverse-stagger is needed for an exit animation.

## Timelines (orchestrated multi-step sequences)

Use `createTimeline()` for anything with more than one ordered step — e.g., the QR scan verification card: card scales in, then the photo fades in slightly after, then the approve button becomes active.

```js
import { createTimeline, stagger } from 'animejs';

const tl = createTimeline();
tl.add('.verification-card', { scale: [0.9, 1], opacity: [0, 1], duration: 400, ease: 'outExpo' })
  .add('.verification-photo', { opacity: [0, 1], duration: 300 }, '-=150') // overlaps previous step
  .add('.approve-button', { opacity: [0, 1], translateY: [8, 0], duration: 250 });
```

## SVG: the success checkmark on attendance approval

Anime.js v4 exposes SVG helpers via the `svg` module for path drawing:

```js
import { svg, createTimeline } from 'animejs';

const [ pathEl ] = svg.morphTo ? [] : []; // see docs for morphTo if morphing between two shapes
const drawable = svg.createDrawable('.checkmark-path');

createTimeline()
  .add(drawable, { draw: ['0 0', '0 1'], duration: 450, ease: 'outQuad' });
```
This draws an SVG checkmark stroke-on when a professor approves attendance — a clean, purposeful success micro-interaction (per the "motion should have a reason" rule: this confirms an action succeeded).

## Scroll-triggered reveals

```js
import { animate, onScroll } from 'animejs';

animate('.dashboard-summary-card', {
  opacity: [0, 1],
  translateY: [20, 0],
  autoplay: onScroll({ target: '.dashboard-summary-card', sync: true }),
});
```
Use sparingly — per the base UI/UX motion rules, scroll-linked motion is for narrative/dashboard moments, not every scroll interaction.

## React integration pattern (required shape — always clean up)

Anime.js animations targeting the DOM need a `ref` + `useEffect`, and a `createScope` so all animations created inside are automatically reverted on unmount (critical to avoid animating a removed/unmounted node, which throws or leaks):

```jsx
import { useRef, useEffect } from 'react';
import { animate, createScope, stagger } from 'animejs';

export function AttendanceList({ records }) {
  const rootRef = useRef(null);
  const scopeRef = useRef(null);

  useEffect(() => {
    scopeRef.current = createScope({ root: rootRef.current }).add(() => {
      animate('.student-row', {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: stagger(60),
        ease: 'outQuad',
      });
    });

    return () => scopeRef.current.revert(); // always revert on unmount
  }, [records]);

  return (
    <div ref={rootRef}>
      {records.map((r) => (
        <div className="student-row" key={r.id}>{r.name}</div>
      ))}
    </div>
  );
}
```

## Respecting `prefers-reduced-motion`

Always gate non-essential Anime.js sequences behind a media query check, falling back to an instant opacity swap:

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

animate('.verification-card', {
  opacity: [0, 1],
  translateY: prefersReducedMotion ? [0, 0] : [12, 0],
  duration: prefersReducedMotion ? 1 : 400,
});
```

## Where to use Anime.js in this app specifically

- QR scan verification card entrance (timeline)
- Attendance-approved success checkmark (SVG draw-on)
- Student/attendance list entrance (stagger)
- Dashboard summary card reveals (onScroll, used sparingly)

## Where NOT to use Anime.js

- Simple hover/focus states on buttons/inputs — that's a plain CSS transition or a Uiverse pattern, cheaper and simpler.
- The sidebar open/close animation — shadcn/ui's Sidebar already handles its own transition; don't duplicate it with a second animation system.
