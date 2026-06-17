import { useEffect, useMemo, useRef, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { T } from './i18n'
import { isoWeekKey } from './lib/week'
import { emptyData, exportBackup, loadLang, parseBackup, saveLang } from './lib/storage'
import { isFirebaseConfigured } from './lib/firebase'
import {
  pushData,
  removeRecipe,
  signOutUser,
  subscribe,
  subscribeRecipes,
  upsertRecipe,
  watchAuth,
  type User,
} from './lib/cloud'
import { ICONS, NavIcon } from './components/icons/NavIcon'
import Toast from './components/Toast'
import LoginGate, { Splash } from './features/auth/LoginGate'
import Catalog from './features/catalog/Catalog'
import RecipeDetailPage from './features/recipe/RecipeDetailPage'
import RecipeEditorPage from './features/recipe/RecipeEditorPage'
import Planner from './features/planner/Planner'
import Shopping from './features/shopping/Shopping'
import Settings from './features/settings/Settings'
import AddToPlanModal from './features/planner/AddToPlanModal'
import PickDishModal from './features/planner/PickDishModal'
import type { AppData, Lang, Recipe, RecipeId, RecipeMap, TFunc } from './types'

type ModalState =
  | { type: 'add'; recipeId: RecipeId }
  | { type: 'pick'; day: number; slot: number }
  | null

export default function App() {
  return (
    <HashRouter>
      <Root />
    </HashRouter>
  )
}

/**
 * Owns auth + the two cloud subscriptions (the shared state document and the
 * recipes collection). Renders the login gate / splash until both are ready,
 * then hands fully-loaded data to Shell.
 */
function Root() {
  const [user, setUser] = useState<User | null | undefined>(isFirebaseConfigured ? undefined : null)
  const [data, setData] = useState<AppData | null>(null)
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [lang, setLangState] = useState<Lang>(loadLang())
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return watchAuth(setUser)
  }, [])

  useEffect(() => {
    if (!user) { setData(null); setRecipes(null); bootstrapped.current = false; return }
    bootstrapped.current = false
    const unsubData = subscribe((snap) => {
      if (!bootstrapped.current) {
        bootstrapped.current = true
        if (!snap.exists) { const seed = emptyData(); setData(seed); pushData(seed); return }
      }
      if (snap.fromServer) setData(snap.data)
    })
    const unsubRecipes = subscribeRecipes(setRecipes)
    return () => { unsubData(); unsubRecipes() }
  }, [user])

  const update = (fn: (d: AppData) => void) => setData((prev) => {
    if (!prev) return prev
    const nd = structuredClone(prev)
    fn(nd)
    pushData(nd)
    return nd
  })

  const replaceData = (d: AppData) => { setData(d); pushData(d) }

  // Recipe writes go to the recipes collection, with an optimistic local merge
  // so the just-saved recipe is navigable before the snapshot round-trips.
  const saveRecipe = (rec: Recipe) => {
    upsertRecipe(rec).catch(() => {})
    setRecipes((prev) => {
      const list = prev ? [...prev] : []
      const i = list.findIndex((r) => r.id === rec.id)
      if (i >= 0) list[i] = rec
      else list.push(rec)
      return list
    })
  }

  const deleteRecipe = (id: RecipeId) => {
    removeRecipe(id).catch(() => {})
    setRecipes((prev) => (prev ? prev.filter((r) => r.id !== id) : prev))
  }

  const setLang = (l: Lang) => { setLangState(l); saveLang(l) }

  if (user === undefined) return <Splash lang={lang} />
  if (!user) return <LoginGate lang={lang} setLang={setLang} />
  if (!data || !recipes) return <Splash lang={lang} connecting />

  return (
    <Shell
      data={data} recipes={recipes} lang={lang} setLang={setLang}
      update={update} replaceData={replaceData}
      saveRecipe={saveRecipe} deleteRecipe={deleteRecipe}
      onSignOut={signOutUser}
    />
  )
}

interface ShellProps {
  data: AppData
  recipes: Recipe[]
  lang: Lang
  setLang: (l: Lang) => void
  update: (fn: (d: AppData) => void) => void
  replaceData: (d: AppData) => void
  saveRecipe: (rec: Recipe) => void
  deleteRecipe: (id: RecipeId) => void
  onSignOut: () => void
}

function Shell({
  data, recipes, lang, setLang,
  update: pushUpdate, replaceData: pushReplace, saveRecipe: pushSaveRecipe, deleteRecipe: pushDeleteRecipe,
  onSignOut,
}: ShellProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const [weekKey, setWeekKey] = useState(isoWeekKey(new Date()))
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const t: TFunc = (k) => T[lang][k]
  const byId = useMemo<RecipeMap>(() => {
    const m: RecipeMap = {}
    recipes.forEach((r) => (m[r.id] = r))
    return m
  }, [recipes])

  const flash = () => {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }
  const update = (fn: (d: AppData) => void) => { pushUpdate(fn); flash() }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const planFor = (d: AppData, key = weekKey) => d.plans[key] || (d.plans[key] = {})

  const dayFree = (day: number) => {
    const p = data.plans[weekKey] || {}
    for (let s = 0; s < 3; s++) {
      const e = p[day + '-' + s]
      if (!(e && byId[e.id])) return s
    }
    return -1
  }

  const addToPlan = (day: number, recipeId: RecipeId, servings: number) => {
    const sl = dayFree(day)
    if (sl < 0) { showToast(t('day_full')); return false }
    update((d) => {
      planFor(d)[day + '-' + sl] = { id: recipeId, servings }
      d.servPrefs[recipeId] = servings
    })
    showToast(t('added'))
    return true
  }

  const navTo = (path: string) => {
    setModal(null)
    navigate(path)
    window.scrollTo(0, 0)
  }

  const saveRecipe = (rec: Recipe) => {
    pushSaveRecipe(rec)
    flash()
    showToast(t('recipe_saved'))
    navTo('/recipes/' + rec.id)
  }

  const deleteRecipe = (id: RecipeId) => {
    if (!window.confirm(t('delete_confirm'))) return
    pushDeleteRecipe(id)
    update((d) => { delete d.favs[id]; delete d.ratings[id]; delete d.servPrefs[id] })
    showToast(t('recipe_deleted'))
    navTo('/recipes')
  }

  const importBackup = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = parseBackup(String(reader.result))
        if (!window.confirm(t('import_confirm'))) return
        pushReplace(res.data)
        setLang(res.lang)
        flash()
        showToast(t('import_done'))
      } catch {
        showToast(t('import_bad'))
      }
    }
    reader.readAsText(file)
  }

  const path = location.pathname
  const isRecipes = path === '/' || path.startsWith('/recipes')
  const isPlan = path.startsWith('/plan')
  const isShop = path.startsWith('/shop')
  const isSet = path.startsWith('/settings')

  return (
    <>
      <header>
        <div className="wrap">
          <div className="brand">
            <small>Kopperdalen Kök</small>
            <h1>Recept · Planera · Handla</h1>
          </div>
          <span className="savebadge">{savedFlash ? '✓ ' + t('saved') : ''}</span>
          <button
            className={`hbtn ${isSet ? 'on' : ''}`} aria-label={t('nav_settings')}
            onClick={() => !isSet && navTo('/settings')}
          >
            <NavIcon d={ICONS.sliders} />
          </button>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button className={lang === 'sv' ? 'on' : ''} onClick={() => setLang('sv')}>SV</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </header>

      <main className="wrap">
        <div className="view" key={path}>
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route
              path="/recipes"
              element={
                <Catalog
                  t={t} lang={lang} recipes={recipes} data={data}
                  onOpen={(id) => navTo('/recipes/' + id)}
                  onNew={() => navTo('/recipes/new')}
                />
              }
            />
            <Route
              path="/recipes/new"
              element={<RecipeEditorPage t={t} lang={lang} byId={byId} mode="new" onSave={saveRecipe} showToast={showToast} />}
            />
            <Route
              path="/recipes/:id/edit"
              element={<RecipeEditorPage t={t} lang={lang} byId={byId} mode="edit" onSave={saveRecipe} showToast={showToast} />}
            />
            <Route
              path="/recipes/:id/duplicate"
              element={<RecipeEditorPage t={t} lang={lang} byId={byId} mode="duplicate" onSave={saveRecipe} showToast={showToast} />}
            />
            <Route
              path="/recipes/:id"
              element={
                <RecipeDetailPage
                  t={t} lang={lang} data={data} byId={byId}
                  onFav={(id) => update((d) => { d.favs[id] ? delete d.favs[id] : (d.favs[id] = true) })}
                  onRate={(id, n) => update((d) => { d.ratings[id] = d.ratings[id] === n ? 0 : n })}
                  onAddToPlan={(id) => setModal({ type: 'add', recipeId: id })}
                  onEdit={(r) => navTo('/recipes/' + r.id + '/edit')}
                  onDuplicate={(r) => navTo('/recipes/' + r.id + '/duplicate')}
                  onDelete={deleteRecipe}
                />
              }
            />
            <Route
              path="/plan"
              element={
                <Planner
                  t={t} lang={lang} data={data} byId={byId} weekKey={weekKey} setWeekKey={setWeekKey}
                  onOpenRecipe={(id) => navTo('/recipes/' + id)}
                  onPick={(day, slot) => setModal({ type: 'pick', day, slot })}
                  onSetServings={(day, slot, v) => update((d) => {
                    const e = planFor(d)[day + '-' + slot]
                    if (e) { e.servings = Math.min(999, Math.max(1, v)); d.servPrefs[e.id] = e.servings }
                  })}
                  onRemove={(day, slot) => { update((d) => { delete planFor(d)[day + '-' + slot] }); showToast(t('removed')) }}
                  onCopyPrev={(prevKey) => {
                    const prev = data.plans[prevKey]
                    if (!prev || !Object.keys(prev).length) { showToast(t('nothing_to_copy')); return }
                    update((d) => { d.plans[weekKey] = structuredClone(prev) })
                    showToast(t('week_copied'))
                  }}
                  onClear={() => update((d) => { d.plans[weekKey] = {}; d.checked[weekKey] = {} })}
                />
              }
            />
            <Route
              path="/shop"
              element={
                <Shopping
                  t={t} lang={lang} data={data} byId={byId} weekKey={weekKey} setWeekKey={setWeekKey}
                  onToggle={(key) => update((d) => {
                    const c = d.checked[weekKey] || (d.checked[weekKey] = {})
                    c[key] ? delete c[key] : (c[key] = true)
                  })}
                  onUncheckAll={() => update((d) => { d.checked[weekKey] = {} })}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/settings"
              element={<Settings t={t} onExport={() => exportBackup(data, lang)} onImport={importBackup} onBack={() => navigate(-1)} onSignOut={onSignOut} />}
            />
            <Route path="*" element={<Navigate to="/recipes" replace />} />
          </Routes>
        </div>
      </main>

      <nav>
        <div className="wrap">
          <button className={isRecipes ? 'on' : ''} onClick={() => navTo('/recipes')}>
            <span className="ic"><NavIcon d={ICONS.book} /></span><span>{t('nav_recipes')}</span>
          </button>
          <button className={isPlan ? 'on' : ''} onClick={() => navTo('/plan')}>
            <span className="ic"><NavIcon d={ICONS.calendar} /></span><span>{t('nav_plan')}</span>
          </button>
          <button className={isShop ? 'on' : ''} onClick={() => navTo('/shop')}>
            <span className="ic"><NavIcon d={ICONS.cart} /></span><span>{t('nav_shop')}</span>
          </button>
        </div>
      </nav>

      {modal?.type === 'add' && byId[modal.recipeId] && (
        <AddToPlanModal
          t={t} lang={lang} recipe={byId[modal.recipeId]} weekKey={weekKey} dayFree={dayFree}
          defaultServ={data.servPrefs[modal.recipeId] || 4}
          onCancel={() => setModal(null)}
          onConfirm={(day, servings) => {
            if (addToPlan(day, modal.recipeId, servings)) navTo('/plan')
          }}
        />
      )}
      {modal?.type === 'pick' && (
        <PickDishModal
          t={t} lang={lang} recipes={recipes} day={modal.day}
          onCancel={() => setModal(null)}
          onPick={(id) => {
            update((d) => {
              const servings = d.servPrefs[id] || 4
              planFor(d)[modal.day + '-' + modal.slot] = { id, servings }
            })
            setModal(null); showToast(t('added'))
          }}
        />
      )}
      {toast && <Toast msg={toast} />}
    </>
  )
}
