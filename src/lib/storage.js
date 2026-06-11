// All user data lives under one localStorage key, saved with a debounce.
// Base recipes are bundled (src/data/recipes.json) and never stored here.
const KEY = 'kopperdalen-recipe-app-v1'

export const emptyData = () => ({
  plans: {},          // { "2026-W24": { "0-0": { id, servings } } }  day 0-4, slot 0-2
  favs: {},           // { [recipeId]: true }
  ratings: {},        // { [recipeId]: 1..5 }
  checked: {},        // { [weekKey]: { [ingKey]: true } }
  customRecipes: [],  // recipes created in-app, shape matches recipes.json + custom:true
})

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { data: emptyData(), lang: 'sv' }
    const d = JSON.parse(raw)
    return {
      data: {
        plans: d.plans || {},
        favs: d.favs || {},
        ratings: d.ratings || {},
        checked: d.checked || {},
        customRecipes: d.customRecipes || [],
      },
      lang: d.lang || 'sv',
    }
  } catch {
    return { data: emptyData(), lang: 'sv' }
  }
}

let timer = null
export function saveData(data, lang, onSaved) {
  clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, lang }))
      onSaved && onSaved()
    } catch {
      /* private mode / quota — data stays in memory for the session */
    }
  }, 400)
}

export function exportBackup(data, lang) {
  const blob = new Blob([JSON.stringify({ ...data, lang }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kopperdalen-backup-' + new Date().toISOString().slice(0, 10) + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
