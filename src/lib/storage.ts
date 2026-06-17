// All user data lives under one localStorage key, saved with a debounce.
// Base recipes are bundled (src/data/recipes.json) and never stored here.
import type { AppData, Lang } from '../types'

const KEY = 'kopperdalen-recipe-app-v1'

export interface LoadResult {
  data: AppData
  lang: Lang
}

export const emptyData = (): AppData => ({
  plans: {}, // { "2026-W24": { "0-0": { id, servings } } }  day 0-4, slot 0-2
  favs: {}, // { [recipeId]: true }
  ratings: {}, // { [recipeId]: 1..5 }
  checked: {}, // { [weekKey]: { [ingKey]: true } }
  customRecipes: [], // recipes created in-app, shape matches recipes.json + custom:true
  servPrefs: {}, // { [recipeId]: last-used servings } — defaults for planning
})

const normalize = (d: Partial<AppData>): AppData => ({
  plans: d.plans || {},
  favs: d.favs || {},
  ratings: d.ratings || {},
  checked: d.checked || {},
  customRecipes: d.customRecipes || [],
  servPrefs: d.servPrefs || {},
})

const readLang = (raw: unknown): Lang => (raw === 'en' ? 'en' : 'sv')

export function loadData(): LoadResult {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { data: emptyData(), lang: 'sv' }
    const d = JSON.parse(raw)
    return { data: normalize(d), lang: readLang(d.lang) }
  } catch {
    return { data: emptyData(), lang: 'sv' }
  }
}

// Throws if the text is not a backup produced by exportBackup.
export function parseBackup(text: string): LoadResult {
  const d = JSON.parse(text)
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('not a backup')
  if (!('plans' in d) && !('customRecipes' in d) && !('favs' in d)) throw new Error('not a backup')
  return { data: normalize(d), lang: readLang(d.lang) }
}

let timer: ReturnType<typeof setTimeout> | null = null
export function saveData(data: AppData, lang: Lang, onSaved?: () => void): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, lang }))
      onSaved && onSaved()
    } catch {
      /* private mode / quota — data stays in memory for the session */
    }
  }, 400)
}

export function exportBackup(data: AppData, lang: Lang): void {
  const blob = new Blob([JSON.stringify({ ...data, lang }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kopperdalen-backup-' + new Date().toISOString().slice(0, 10) + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
