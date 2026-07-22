---
name: premium-ui-enhancements
description: Upgrades a React + Tailwind front-end to a premium, polished look by pulling from three specific sources — Uiverse.io (copy-paste micro-components: buttons, cards, loaders, toggles, checkboxes), Anime.js v4 (layout transitions, SVG animation, event-triggered motion), and shadcn/ui (accessible structural components, especially sidebars/navigation that auto-adapt to mobile). Use this skill whenever the user asks to make a UI "look premium," "more polished," "less generic," wants a nicer sidebar/navigation, wants smoother transitions or micro-interactions, or explicitly mentions Uiverse, Anime.js, or shadcn/ui. This is tailored for the JBLCF-B QR Attendance System (Navy Blue / Yellow / White palette, React + Tailwind front-end, Superadmin + Professor dashboards) but the underlying library guidance applies to any React/Tailwind project. Always re-theme anything pulled from these sources to match the project's existing palette and spacing system rather than dropping it in with its original demo colors.
---

# Premium UI Enhancements (Uiverse + Anime.js + shadcn/ui)

This skill layers three "premium" sources on top of a base Tailwind build (like the one produced by the `mobile-design-library` skill). Each source has a distinct job — don't reach for all three on every component. Pick the right tool, then **always re-skin it to the project's palette** before calling it done. A gorgeous component in the wrong navy/yellow/white theme looks like a bug, not a feature.

## The three sources, and when each one wins

| Source | Best for | Not for |
|---|---|---|
| **Uiverse.io** | Small, self-contained decorative components: buttons, checkboxes, toggles/switches, loaders/spinners, badges, input focus effects, cards with hover flourishes | Structural layout (sidebars, page shells), complex multi-step animation sequences |
| **Anime.js v4** | Motion that HyperUI/Animista's plain CSS can't express cleanly: orchestrated multi-element timelines, SVG path drawing/morphing, scroll-triggered reveals, drag interactions, anything triggered by a JS event (scan success, form submit) rather than a CSS state (`:hover`) | One-off hover/focus effects (plain CSS or Uiverse handles those fine and cheaper) |
| **shadcn/ui** | Structural, accessible components — sidebar navigation, mobile sheet/drawer menus, comboboxes, dialogs — anywhere correctness (focus trapping, ARIA, keyboard nav) matters more than visual flourish | Small decorative flourishes (that's Uiverse's job — don't hand-roll a shadcn variant for a like/heart button) |

If a task could go two ways, default to the **most structural** tool: shadcn/ui for anything involving navigation state or accessibility, Anime.js for anything involving a sequence or a trigger, Uiverse for everything else decorative.

## How this fits with the existing design system

This project already has (from the `mobile-design-library` + `ui-ux-best-practices` skills): a mobile-first Tailwind setup, a Navy/Yellow/White token system, a fixed spacing scale, and a corner-radius hierarchy (containers > nested elements). Nothing below overrides that — it extends it.

Before dropping in *any* component from these three sources:
1. **Strip the source's demo colors.** Uiverse snippets and shadcn examples almost always ship with their own arbitrary blues/purples/grays. Replace every color value with the project's Tailwind tokens (`primary` = Navy, `secondary` = Yellow, `base` = White), not a new ad-hoc hex code.
2. **Match the existing radius hierarchy.** If the app's cards use an 8px radius, a Uiverse button dropped inside one should use something smaller (e.g. 4px), not whatever the original demo used.
3. **Respect one-primary-CTA-per-screen.** A flashy Uiverse button is tempting to use everywhere; it should still only be the *styling* of the single primary action per screen, per the UI/UX checklist.
4. **Respect `prefers-reduced-motion`.** Every Anime.js sequence and Uiverse CSS animation needs a reduced-motion fallback — see `references/animejs.md` for the pattern.

## Workflow

1. Identify which screen/component is being upgraded and why (e.g., "the QR scan verification card feels flat," "the dashboard nav is a plain unstyled `<ul>`").
2. Pick the right source using the table above.
3. Read the matching reference file **before** writing code — each has copyable patterns already adapted to a React + Tailwind + Navy/Yellow/White context, so you aren't reinventing the conversion step each time:
   - `references/uiverse.md`
   - `references/animejs.md`
   - `references/shadcn-sidebar.md`
4. Re-skin per the rules above, wire it into the existing `components/` (shared) or `views/` structure — decorative Uiverse components go in `components/`, shadcn structural pieces typically live in `components/ui/` (shadcn's own convention), Anime.js logic lives in the relevant `controllers/` hook or a small `hooks/useXAnimation.js`.
5. Test at 375px, 768px, 1280px, and with `prefers-reduced-motion: reduce` toggled on.

## Applied to this specific app (JBLCF-B QR Attendance System)

Concrete mapping, so the choice isn't made from scratch each time:

- **Superadmin & Professor dashboard navigation** → shadcn/ui `Sidebar` (see `references/shadcn-sidebar.md`). It already auto-converts to a mobile Sheet/drawer below the mobile breakpoint, which directly satisfies the PRD's mobile-responsive requirement for professors scanning from a phone — no custom breakpoint CSS needed.
- **QR scan verification card** (photo/name/course appearing after a scan) → Anime.js entrance animation (scale + fade, `ease: 'outExpo'`) plus a success checkmark draw-on when approved (SVG stroke animation) — this is an event-triggered sequence, not a hover state, so it's Anime.js's job, not Uiverse's.
- **Primary action buttons** (Add Student, Approve Attendance, Log In) → a Uiverse button base, re-skinned to Navy/Yellow, kept as the *only* primary-styled button per screen.
- **Form inputs / toggles** (e.g., a status filter) → Uiverse checkbox/toggle/switch patterns, re-skinned, still following the "boxed inputs with real labels" rule from `ui-ux-best-practices`.
- **Student list / attendance list row entrances** → Anime.js `stagger()` on load instead of a CSS-only stagger, since these lists are dynamically populated from an API response (a JS-triggered event) rather than present at initial paint.
- **Loading states** → keep using skeletons per `ui-ux-best-practices` (unchanged) — none of these three sources should replace skeleton loading with a spinner.

## Licensing note

Uiverse components are individually submitted and can carry different licenses (most are MIT or CC0, but check the badge on the specific component page before using it in a school-branded, potentially commercial system). Anime.js and shadcn/ui are both MIT-licensed in full. When in doubt about a specific Uiverse snippet, prefer skipping it over assuming it's free to use.
