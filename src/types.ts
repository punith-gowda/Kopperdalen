// Shared domain types for the whole app.
//
// Data shape mirrors src/data/recipes.json and src/lib/storage.js exactly —
// do not change these without a localStorage migration plan (see CLAUDE.md).

export type Lang = 'sv' | 'en'

// Base catalogue recipes use numeric ids (recipes.json); in-app recipes use
// string ids ('c' + timestamp). Both end up as object keys (coerced to string).
export type RecipeId = number | string

export interface Ingredient {
  sv: string
  en: string | null
  qty: number | null // null = "to taste". Quantities are per 4 servings.
  unit: string
  cat: string
}

export interface Recipe {
  id: RecipeId
  sv: string
  en: string | null
  day: string // English weekday, or other label (e.g. "Dipsås"), or ''
  mark: string
  weeks: string
  custom?: boolean
  ingredients: Ingredient[]
  steps: string[]
}

/** One planned dish: plans[weekKey]["{day}-{slot}"] = { id, servings } */
export interface PlanEntry {
  id: RecipeId
  servings: number
}

export interface AppData {
  plans: Record<string, Record<string, PlanEntry>>
  favs: Record<string, true>
  ratings: Record<string, number>
  checked: Record<string, Record<string, true>>
  customRecipes: Recipe[]
  servPrefs: Record<string, number>
}

/** Recipes indexed by id for O(1) lookup (keys are stringified ids). */
export type RecipeMap = Record<string, Recipe>

// i18n accessor. Most values are strings, but some keys return arrays
// (e.g. 'days') or nested objects (e.g. 'cats'), so callers index the
// result structurally — hence the loose return type.
export type TFunc = (key: string) => any
