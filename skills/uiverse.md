# Uiverse.io — Reference

Uiverse.io is a community catalog of copy-paste HTML/CSS (and some vanilla JS) UI elements: buttons, checkboxes, switches/toggles, loaders/spinners, cards, badges, input focus effects, tooltips. Everything is browsable by category directly at https://uiverse.io/.

## How to use it in this project

Uiverse snippets are plain HTML + CSS (occasionally with a few lines of vanilla JS for a toggle's checked state). They are **not** React components and **not** Tailwind-native — every snippet needs a conversion pass, never a raw copy-paste.

### Conversion checklist (do this every time)

1. **Convert the HTML into a JSX component** in `src/components/`. Class attributes become `className`; any inline `<style>` block becomes either Tailwind utility classes (preferred, if the effect is expressible that way) or a scoped CSS file / styled block if the effect relies on complex pseudo-elements, keyframes, or `:has()` selectors that Tailwind utilities can't cleanly express.
2. **Re-theme every color.** Uiverse demo colors are arbitrary (lots of purple/pink gradients by default). Replace:
   - Any color meant to read as "primary/brand" → the project's `primary` (Navy) token
   - Any accent/highlight color → `secondary` (Yellow)
   - Any light background → `base` (White)
   - Keep semantic colors (error red, success green) but desaturate them per the project's dark-mode/saturation rule if used on a dark surface.
3. **Match the radius hierarchy.** If the snippet has an 16px button radius sitting inside an 8px card, invert it — nested elements need a *smaller* radius than their container, not larger.
4. **Rewrite any bespoke shadow/glow to the project's existing shadow scale**, if one exists, rather than importing a new one-off `box-shadow` value per component.
5. **Give it a real accessible label.** Uiverse snippets are visual-first and often skip `aria-label`, focus-visible states, or semantic button/input elements. Add these back in — this is non-negotiable per the UI/UX checklist (real labels, not placeholder-only).
6. **Check the license badge on the specific snippet's page** before use (see licensing note in the main SKILL.md).

### Example: converting a Uiverse button to the project's primary CTA

Typical Uiverse output (illustrative shape, not a literal snippet):
```html
<button class="uiverse-btn">
  <span>Click me</span>
</button>
<style>
.uiverse-btn { background: linear-gradient(135deg, #7f5af0, #2cb67d); border-radius: 12px; ... }
</style>
```

Converted for this project (React + Tailwind, Navy/Yellow):
```jsx
// components/PrimaryButton.jsx
export function PrimaryButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded-lg bg-primary text-base font-semibold px-6 py-3
                 shadow-md transition-transform duration-200 ease-out
                 hover:scale-[1.02] active:scale-[0.98]
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
    >
      {children}
    </button>
  );
}
```
Note: the gradient became a flat Navy fill (brand consistency beats novelty), the radius dropped to something smaller than its typical parent card, and a focus-visible ring in Yellow was added since the original snippet had none.

### Where to use Uiverse in this app specifically

- Primary/secondary buttons (Add Student, Approve Attendance, Log In, Print QR)
- Checkboxes/toggles (e.g., a "remember me" checkbox, an active/inactive student status toggle)
- Loading spinners **only** in contexts where a skeleton isn't appropriate (e.g., a small inline "generating QR…" indicator inside an already-loaded form) — page/list loading should still be skeletons, not Uiverse spinners.
- Card hover flourishes on the student list rows or dashboard summary cards.

### Where NOT to use Uiverse

- The sidebar/navigation shell (use shadcn/ui — see `references/shadcn-sidebar.md`)
- The QR scan verification card's entrance/success sequence (use Anime.js — it's an event-triggered sequence, not a static decorative component)
