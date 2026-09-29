# Mayker dashboard

A single-page dashboard built from the Figma file *PATH* (frames “Desktop - 3” and “Upload modal”).
React 19 + TypeScript + Vite + Tailwind CSS v4.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Log in with any email and a password of 8+ characters (demo auth, nothing leaves the browser).

## How it's put together

- **Single page.** The app loads once; screens swap in place. A tiny hash router (`src/lib/router.tsx`)
  keeps the address bar in sync so Back/Forward, refresh and deep links work.
- **Data.** One Zustand store (`src/lib/store.ts`) seeded with demo data and persisted to `localStorage`.
- **Design tokens.** `src/index.css` defines light and dark values as CSS variables, exposed to Tailwind
  (`bg-surface`, `text-fg-2`, `border-line-control`, …).
- **UI kit.** `src/components/ui/` — buttons, fields, tabs, switch, modal, menus, sheet, empty/error states.
  Dialogs, menus, tabs and tooltips use Radix primitives for focus and keyboard handling.
- **Icons.** Figma exports live in `src/assets/icons` (Hugeicons stroke set); extra icons come from
  `@hugeicons/react`. All icons follow the current text colour.

```
src/
  components/shell/   Sidebar, page header, info panel, command palette, notifications, toasts, modals
  features/           home · projects · notes · reports · emails · automation · settings · auth
  lib/                store, router, hooks, formatting
```

## Reviewing states

- Add `?state=loading`, `?state=empty` or `?state=error` to any screen, e.g. `#/notes?state=empty`.
- Settings → Workspace → **Delete all data** shows real first-run empty states; **Reset demo data** restores.
- Theme: Settings → Appearance (System / Light / Dark), or ⌘K / Ctrl K → “Switch to dark theme”.

## Accessibility

Targets WCAG 2.2 AA and Material accessibility guidance; axe-core reports no violations on any screen,
modal or panel in either theme.

- Text contrast ≥ 4.5:1, form control borders and focus rings ≥ 3:1, in both themes.
- Visible focus everywhere; skip link; focus moves to the page heading after navigation.
- Every control reachable by keyboard; arrow keys move across the folder grid; Esc closes overlays.
- Minimum 24px targets (44px on touch screens); toasts pause on hover/focus; motion respects
  `prefers-reduced-motion`; charts have text summaries and a table view.

Where the Figma values failed these checks they were adjusted — see comments in `src/index.css`.
