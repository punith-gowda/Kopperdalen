// Shared domain types for the whole app.
//
// Domain types for the app. Recipes live in the Firestore `recipes` collection
// (seeded once from src/data/recipes.json); user state lives in the shared
// `restaurant/kopperdalen` document. See lib/cloud.ts.

export type Lang = 'sv' | 'en'

// All recipes live in the Firestore `recipes` collection; the id is the
// Firestore document id. Seeded recipes use their original number stringified
// ("1".."168"); recipes created in-app use 'c' + timestamp.
export type RecipeId = string

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
  ingredients: Ingredient[]
  steps: string[]
}

/** Recipe fields stored in Firestore (the id is the document id, not a field). */
export type RecipeDoc = Omit<Recipe, 'id'>

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
  servPrefs: Record<string, number>
}

/** Recipes indexed by id for O(1) lookup (keys are stringified ids). */
export type RecipeMap = Record<string, Recipe>

// i18n accessor. Most values are strings, but some keys return arrays
// (e.g. 'days') or nested objects (e.g. 'cats'), so callers index the
// result structurally — hence the loose return type.
export type TFunc = (key: string) => any
