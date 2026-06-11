# Kopperdalen Kök — Recept · Planera · Handla

Recipe catalogue, weekly meal planner and auto-generated shopping list for
Restaurang Kopperdalen. Mobile-first, Swedish/English, no backend — all user
data is stored in the browser (localStorage).

The 163 base recipes (imported from the original Excel catalogue) live in
`src/data/recipes.json` and are bundled into the app. Plans, favorites,
ratings, shopping check-offs and user-created recipes are stored on the
device under the localStorage key `kopperdalen-recipe-app-v1`.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
```

## Deploy

The build output (`dist/`) is fully static.

- **Netlify**: connect the repo, build command `npm run build`, publish dir `dist`
- **Vercel**: framework preset "Vite", zero config
- **GitHub Pages**: `npm run build`, publish `dist/` (the Vite `base: './'` setting makes subpath hosting work)

## Working on this repo with Claude Code

```bash
cd kopperdalen-app
claude
```

See `CLAUDE.md` for project conventions Claude Code will follow.

## Architecture

```
src/
  data/recipes.json      # 163 base recipes (immutable source data)
  i18n.js                # all UI strings (sv/en), category order, name helpers
  lib/week.js            # ISO week key math ("2026-W24")
  lib/format.js          # quantity formatting/parsing (Swedish decimal comma)
  lib/storage.js         # localStorage persistence, single key, debounced
  App.jsx                # state owner, routing between views, all mutations
  components/
    Catalog.jsx          # searchable/filterable recipe list
    RecipeDetail.jsx     # ingredients with servings scaling, tappable steps
    RecipeEditor.jsx     # create/edit/duplicate custom recipes
    Planner.jsx          # Mon-Fri week view, 3 dishes/day
    Shopping.jsx         # aggregated list grouped by category
    AddToPlanModal.jsx   # day + servings picker (slot auto-assigned)
    PickDishModal.jsx    # dish search picker for a day
    Toast.jsx
```

Recipe shape (both base and custom):

```json
{
  "id": 1,
  "sv": "Janssons frestelse", "en": "Jansson's Temptation",
  "day": "Monday", "mark": "🇸🇪", "weeks": "v.19",
  "custom": true,
  "ingredients": [{ "sv": "Fast potatis", "en": "Firm potatoes", "qty": 800, "unit": "g", "cat": "Grönsaker" }],
  "steps": ["Skala potatisen.", "..."]
}
```

Quantities are always per **4 servings**; scaling multiplies by `servings / 4`.
`qty: null` means "to taste" and is excluded from quantity sums.
