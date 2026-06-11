# CLAUDE.md

## Project

Recipe catalogue + weekly meal planner + shopping list webapp for a Swedish
lunch restaurant (Restaurang Kopperdalen). React 18 + Vite, no backend, no
router, no CSS framework — plain CSS in `src/styles.css`.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (run this to type/syntax-check changes)
- `npm run preview` — serve dist/

## Hard rules

- **The primary user is 50+ years old.** Keep the UI simple: big touch
  targets (min 44px), large readable text, text labels over icon-only
  buttons, one obvious action per screen, no hidden gestures.
- **Mobile-first.** Test layouts at 390px width. Desktop is a centered
  780px column.
- `src/data/recipes.json` is the imported base catalogue — never edit
  recipe content in it, and never change the recipe shape without a
  migration plan for localStorage data.
- All user data goes through `src/lib/storage.js` (single localStorage key
  `kopperdalen-recipe-app-v1`). If you change the stored shape, keep
  backwards compatibility in `loadData()` — users have live data.
- Quantities in recipes are per 4 servings. `qty: null` = "to taste".
- Every UI string must exist in both `sv` and `en` in `src/i18n.js`.
  Swedish is the default and primary language.
- Don't add dependencies unless genuinely needed; this app deliberately has
  only react/react-dom.
- Numbers shown in Swedish mode use decimal comma (see `lib/format.js`).

## State conventions

- `App.jsx` owns all persistent state and mutations; views are props-driven.
- Mutations go through `update(fn)` in App.jsx which clones state — never
  mutate `data` directly in components.
- Plan storage: `data.plans[weekKey]["{day}-{slot}"] = { id, servings }`,
  day 0–4 (Mon–Fri), slot 0–2, weekKey like `"2026-W24"` (ISO week).

## Testing changes

After non-trivial UI changes, build and verify the planner flow end to end:
add a dish to a day → change servings → check the shopping list aggregates
correctly (e.g. 500 g at 8 servings shows 1000 g, grouped by category).
