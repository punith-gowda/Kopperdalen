// Shared data helpers, per-device language preference, and backup import/export.
// The recipe catalogue and user state now live in Firestore (see lib/cloud.ts);
// app state is no longer persisted to localStorage.
import type { AppData, Lang } from '../types'

const LANG_KEY = 'kopperdalen-lang-v1'

export interface LoadResult {
  data: AppData
  lang: Lang
}

export const emptyData = (): AppData => ({
  plans: {}, // { "2026-W24": { "0-0": { id, servings } } }  day 0-4, slot 0-2
  favs: {}, // { [recipeId]: true }
  ratings: {}, // { [recipeId]: 1..5 }
  checked: {}, // { [weekKey]: { [ingKey]: true } }
  servPrefs: {}, // { [recipeId]: last-used servings } — defaults for planning
})

// Fills in any missing top-level keys — used for the Firestore document and to
// stay backwards-compatible with older / imported data.
export const normalizeData = (d: Partial<AppData>): AppData => ({
  plans: d.plans || {},
  favs: d.favs || {},
  ratings: d.ratings || {},
  checked: d.checked || {},
  servPrefs: d.servPrefs || {},
})

const readLang = (raw: unknown): Lang => (raw === 'en' ? 'en' : 'sv')

// Language is a per-device preference (not part of the shared dataset).
export function loadLang(): Lang {
  try {
    return readLang(localStorage.getItem(LANG_KEY))
  } catch {
    return 'sv'
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}

// Throws if the text is not a backup produced by exportBackup.
export function parseBackup(text: string): LoadResult {
  const d = JSON.parse(text)
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('not a backup')
  if (!('plans' in d) && !('favs' in d) && !('servPrefs' in d)) throw new Error('not a backup')
  return { data: normalizeData(d), lang: readLang(d.lang) }
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
