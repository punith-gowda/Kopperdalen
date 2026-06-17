# CLAUDE.md

## Project

Recipe catalogue + weekly meal planner + shopping list webapp for a Swedish
lunch restaurant (Restaurang Kopperdalen). React 18 + Vite + **TypeScript**,
no backend, no CSS framework. Routing via `react-router-dom` (HashRouter, so
it works on static hosts with no server rewrites). Plain global CSS split by
concern under `src/styles/` (imported through `src/styles/index.css`).

## Structure

- `src/App.tsx` — `App` wraps `HashRouter`; the inner `Shell` owns all state,
  mutations, the route table, header, bottom nav, and the two overlay modals.
- `src/features/<area>/` — view components (`catalog`, `recipe`, `planner`,
  `shopping`, `settings`). Recipe routes use thin `*Page.tsx` wrappers that
  read `useParams` and call `navigate`; the leaf views stay props-driven.
- `src/components/` — shared UI (`Toast`, `icons/`).
- `src/lib/` — `storage.ts`, `format.ts`, `week.ts` (+ `firebase.js`, a
  not-yet-wired stub; stays `.js` until the `firebase` dep is installed).
- `src/types.ts` — shared domain types (`Recipe`, `AppData`, `Lang`, …).
- Routes: `/recipes`, `/recipes/:id`, `/recipes/new`, `/recipes/:id/edit`,
  `/recipes/:id/duplicate`, `/plan`, `/shop`, `/settings`.

## Commands

- `npm run dev` — dev server
- `npm run build` — type-check (`tsc --noEmit`) + production build
- `npm run typecheck` — type-check only (fast feedback while editing)
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
- All user data goes through `src/lib/storage.ts` (single localStorage key
  `kopperdalen-recipe-app-v1`). If you change the stored shape, keep
  backwards compatibility in `loadData()` — users have live data.
- Quantities in recipes are per 4 servings. `qty: null` = "to taste".
- Every UI string must exist in both `sv` and `en` in `src/i18n.ts`.
  Swedish is the default and primary language.
- Don't add dependencies unless genuinely needed; runtime deps are
  deliberately limited to react / react-dom / react-router-dom.
- Numbers shown in Swedish mode use decimal comma (see `lib/format.ts`).
- Recipe `id` is a number for base catalogue items and a string (`'c'+ts`)
  for in-app recipes — keep `RecipeId = number | string`.

## State conventions

- `Shell` in `App.tsx` owns all persistent state and mutations; views are
  props-driven.
- Mutations go through `update(fn)` in `App.tsx` which clones state — never
  mutate `data` directly in components.
- Plan storage: `data.plans[weekKey]["{day}-{slot}"] = { id, servings }`,
  day 0–4 (Mon–Fri), slot 0–2, weekKey like `"2026-W24"` (ISO week).
- `data.servPrefs[recipeId]` = last-used servings for that recipe; written
  on every add-to-plan and servings change, used as the default everywhere
  servings are picked.

## Testing changes

After non-trivial UI changes, build and verify the planner flow end to end:
add a dish to a day → change servings → check the shopping list aggregates
correctly (e.g. 500 g at 8 servings shows 1000 g, grouped by category).
