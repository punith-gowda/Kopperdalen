import { useEffect, useMemo, useRef, useState } from 'react'
import RECIPES from './data/recipes.json'
import { T, dishName } from './i18n'
import { isoWeekKey } from './lib/week'
import { loadData, saveData, exportBackup, parseBackup } from './lib/storage'
import Catalog from './components/Catalog'
import RecipeDetail from './components/RecipeDetail'
import RecipeEditor from './components/RecipeEditor'
import Planner from './components/Planner'
import Shopping from './components/Shopping'
import AddToPlanModal from './components/AddToPlanModal'
import PickDishModal from './components/PickDishModal'
import Settings from './components/Settings'
import Toast from './components/Toast'

const NavIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{d}</svg>
)
const ICONS = {
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>
  ),
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
}

export default function App() {
  const initial = useMemo(() => loadData(), [])
  const [data, setData] = useState(initial.data)
  const [lang, setLang] = useState(initial.lang)
  const [tab, setTab] = useState('cat')
  const [detailId, setDetailId] = useState(null)
  const [editor, setEditor] = useState(null) // draft object or null
  const [editorReturn, setEditorReturn] = useState(null)
  const [modal, setModal] = useState(null) // {type:'add',recipeId} | {type:'pick',day,slot}
  const [weekKey, setWeekKey] = useState(isoWeekKey(new Date()))
  const [prevTab, setPrevTab] = useState('cat')
  const [toast, setToast] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const t = (k) => T[lang][k]
  const allRecipes = useMemo(() => [...RECIPES, ...data.customRecipes], [data.customRecipes])
  const byId = useMemo(() => {
    const m = {}
    allRecipes.forEach((r) => (m[r.id] = r))
    return m
  }, [allRecipes])

  // persist on every data/lang change (debounced inside saveData)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    saveData(data, lang, () => {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
    })
  }, [data, lang])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  // ---- mutations (single entry point keeps saving consistent) ----
  const update = (fn) => setData((d) => {
    const nd = structuredClone(d)
    fn(nd)
    return nd
  })

  const planFor = (d, key = weekKey) => d.plans[key] || (d.plans[key] = {})

  const dayFree = (day) => {
    const p = data.plans[weekKey] || {}
    for (let s = 0; s < 3; s++) {
      const e = p[day + '-' + s]
      if (!(e && byId[e.id])) return s
    }
    return -1
  }

  const addToPlan = (day, recipeId, servings) => {
    const sl = dayFree(day)
    if (sl < 0) { showToast(t('day_full')); return false }
    update((d) => { planFor(d)[day + '-' + sl] = { id: recipeId, servings } })
    showToast(t('added'))
    return true
  }

  const go = (next) => {
    setTab(next)
    setDetailId(null)
    setEditor(null)
    setModal(null)
    window.scrollTo(0, 0)
  }

  const openDetail = (id) => {
    setTab('cat')
    setEditor(null)
    setDetailId(id)
    window.scrollTo(0, 0)
  }

  const openEditor = (src, isEdit) => {
    setEditorReturn(detailId)
    setEditor({
      id: isEdit && src ? src.id : 'c' + Date.now(),
      isEdit: !!(isEdit && src),
      sv: src ? (isEdit ? src.sv : src.sv + ' (kopia)') : '',
      en: src ? src.en || '' : '',
      day: src ? src.day || 'Monday' : 'Monday',
      mark: src ? src.mark || '' : '',
      weeks: isEdit && src ? src.weeks || '' : '',
      ingredients: src
        ? src.ingredients.map((i) => ({ ...i }))
        : [{ sv: '', en: '', qty: null, unit: '', cat: 'Övrigt' }],
      steps: src ? src.steps.join('\n') : '',
    })
    setDetailId(null)
    setTab('cat')
    window.scrollTo(0, 0)
  }

  const saveRecipe = (rec) => {
    update((d) => {
      const idx = d.customRecipes.findIndex((r) => r.id === rec.id)
      if (idx >= 0) d.customRecipes[idx] = rec
      else d.customRecipes.push(rec)
    })
    setEditor(null)
    showToast(t('recipe_saved'))
    setDetailId(rec.id)
  }

  const importBackup = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = parseBackup(reader.result)
        if (!window.confirm(t('import_confirm'))) return
        setData(res.data)
        setLang(res.lang)
        showToast(t('import_done'))
      } catch {
        showToast(t('import_bad'))
      }
    }
    reader.readAsText(file)
  }

  const deleteRecipe = (id) => {
    if (!window.confirm(t('delete_confirm'))) return
    update((d) => {
      d.customRecipes = d.customRecipes.filter((r) => r.id !== id)
      delete d.favs[id]
      delete d.ratings[id]
    })
    setDetailId(null)
    showToast(t('recipe_deleted'))
  }

  // ---- view routing ----
  let view
  if (tab === 'cat') {
    if (editor) {
      view = (
        <RecipeEditor
          t={t} lang={lang} draft={editor}
          onCancel={() => { setEditor(null); setDetailId(editorReturn) }}
          onSave={saveRecipe} showToast={showToast}
        />
      )
    } else if (detailId && byId[detailId]) {
      view = (
        <RecipeDetail
          t={t} lang={lang} recipe={byId[detailId]} data={data}
          onBack={() => setDetailId(null)}
          onFav={(id) => update((d) => { d.favs[id] ? delete d.favs[id] : (d.favs[id] = true) })}
          onRate={(id, n) => update((d) => { d.ratings[id] = d.ratings[id] === n ? 0 : n })}
          onAddToPlan={(id) => setModal({ type: 'add', recipeId: id })}
          onEdit={(r) => openEditor(r, true)}
          onDuplicate={(r) => openEditor(r, false)}
          onDelete={deleteRecipe}
        />
      )
    } else {
      view = (
        <Catalog
          t={t} lang={lang} recipes={allRecipes} data={data}
          onOpen={openDetail} onNew={() => openEditor(null, false)}
        />
      )
    }
  } else if (tab === 'plan') {
    view = (
      <Planner
        t={t} lang={lang} data={data} byId={byId} weekKey={weekKey} setWeekKey={setWeekKey}
        onOpenRecipe={openDetail}
        onPick={(day, slot) => setModal({ type: 'pick', day, slot })}
        onSetServings={(day, slot, v) => update((d) => {
          const e = planFor(d)[day + '-' + slot]
          if (e) e.servings = Math.min(999, Math.max(1, v))
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
    )
  } else if (tab === 'set') {
    view = (
      <Settings
        t={t} onExport={() => exportBackup(data, lang)} onImport={importBackup}
        onBack={() => go(prevTab)}
      />
    )
  } else {
    view = (
      <Shopping
        t={t} lang={lang} data={data} byId={byId} weekKey={weekKey} setWeekKey={setWeekKey}
        onToggle={(key) => update((d) => {
          const c = d.checked[weekKey] || (d.checked[weekKey] = {})
          c[key] ? delete c[key] : (c[key] = true)
        })}
        onUncheckAll={() => update((d) => { d.checked[weekKey] = {} })}
        showToast={showToast}
      />
    )
  }

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
            className={`hbtn ${tab === 'set' ? 'on' : ''}`} aria-label={t('nav_settings')}
            onClick={() => { if (tab !== 'set') { setPrevTab(tab); go('set') } }}
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
        <div className="view" key={tab + ':' + (editor ? 'editor' : detailId || '')}>{view}</div>
      </main>

      <nav>
        <div className="wrap">
          <button className={tab === 'cat' ? 'on' : ''} onClick={() => go('cat')}>
            <span className="ic"><NavIcon d={ICONS.book} /></span><span>{t('nav_recipes')}</span>
          </button>
          <button className={tab === 'plan' ? 'on' : ''} onClick={() => go('plan')}>
            <span className="ic"><NavIcon d={ICONS.calendar} /></span><span>{t('nav_plan')}</span>
          </button>
          <button className={tab === 'shop' ? 'on' : ''} onClick={() => go('shop')}>
            <span className="ic"><NavIcon d={ICONS.cart} /></span><span>{t('nav_shop')}</span>
          </button>
        </div>
      </nav>

      {modal?.type === 'add' && byId[modal.recipeId] && (
        <AddToPlanModal
          t={t} lang={lang} recipe={byId[modal.recipeId]} weekKey={weekKey} dayFree={dayFree}
          onCancel={() => setModal(null)}
          onConfirm={(day, servings) => {
            if (addToPlan(day, modal.recipeId, servings)) {
              setModal(null); setDetailId(null); go('plan')
            }
          }}
        />
      )}
      {modal?.type === 'pick' && (
        <PickDishModal
          t={t} lang={lang} recipes={allRecipes} day={modal.day}
          onCancel={() => setModal(null)}
          onPick={(id) => {
            update((d) => { planFor(d)[modal.day + '-' + modal.slot] = { id, servings: 4 } })
            setModal(null); showToast(t('added'))
          }}
        />
      )}
      {toast && <Toast msg={toast} />}
    </>
  )
}
