# Folio interaction and animation pass

## What will change

- Add a small shared motion kit inspired by Skiper UI and Unlumen UI, adapted to Folio’s Paper & Ink design rather than copied from their registries.
- Give navigation labels a Skiper-style rolling text hover and a spring-moving active indicator.
- Add Unlumen-style directional reveals and spring hover expansion to dashboard actions, settings choices, and connector cards.
- Upgrade chat with a smoothly resizing sidebar, staggered conversation entries, animated suggestion cards, and a composer that subtly lifts and expands when focused or when attachments appear.
- Add restrained scroll-linked depth to headings and section dividers so pages feel dimensional without introducing particles, spheres, or large decorative balls.

## Shared components

- `TextRoll` — staggered character roll for navigation and selected links.
- `MotionReveal` — reusable directional/staggered entrance using the existing Motion dependency.
- `SpringHighlight` — shared animated selection background for tabs and segmented controls.
- `HoverExpandCard` — content reveal for action and connector cards, with keyboard/focus support.

## Where they will be used

1. **Global navigation:** rolling labels, spring active state, restrained logo response.
2. **Dashboard:** staggered widget entrance, spring quick filters/depth controls, expanding quick-action cards.
3. **Chat:** animated rail, message sequencing, responsive suggestions, focus-reactive typing bar.
4. **Settings and connectors:** animated section entry, shared selection highlight, clearer hover/focus states.
5. **Homepage:** reuse the shared primitives where they replace duplicate reveal logic; keep its existing visual identity intact.

## Motion and accessibility

- Preserve the current Flat / Soft 3D / Deep 3D setting.
- Respect both the browser’s reduced-motion preference and Folio’s Reduce motion setting.
- Use transform and opacity animations only for smooth performance; no canvas, WebGL, particles, or new visual blobs.
- Keep touch interactions stable and ensure hover-only details are also available through focus or tap.

## Validation

- Check homepage, dashboard, chat, settings, and connectors at desktop and mobile widths.
- Verify keyboard focus, reduced motion, card expansion, navigation state, and composer behavior.
- Confirm no console errors and that all existing actions still work.