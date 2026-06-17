import { useState } from 'react'
import { CAT_ORDER, DAYS_EN, UNITS } from '../../i18n'
import { fmtQty, parseQty } from '../../lib/format'
import type { Ingredient, Lang, Recipe, RecipeId, TFunc } from '../../types'

/** Draft passed into the editor (steps as a newline string for the textarea). */
export interface EditorDraft {
  id: RecipeId
  isEdit: boolean
  sv: string
  en: string
  day: string
  mark: string
  weeks: string
  ingredients: Ingredient[]
  steps: string
}

/** Ingredient row while editing — keeps a free-text quantity field. */
type IngRow = {
  sv: string
  en: string | null
  qty?: number | null
  unit: string
  cat: string
  qtyText: string
}

type IngField = 'sv' | 'en' | 'qtyText' | 'unit' | 'cat'

interface RecipeEditorProps {
  t: TFunc
  lang: Lang
  draft: EditorDraft
  onCancel: () => void
  onSave: (rec: Recipe) => void
  showToast: (msg: string) => void
}

export default function RecipeEditor({ t, lang, draft, onCancel, onSave, showToast }: RecipeEditorProps) {
  const [sv, setSv] = useState(draft.sv)
  const [en, setEn] = useState(draft.en)
  const [day, setDay] = useState(draft.day)
  const [mark, setMark] = useState(draft.mark)
  const [steps, setSteps] = useState(draft.steps)
  const [ings, setIngs] = useState<IngRow[]>(
    draft.ingredients.map((i) => ({ ...i, qtyText: i.qty == null ? '' : fmtQty(i.qty, lang) }))
  )

  const setIng = (idx: number, field: IngField, value: string) =>
    setIngs((list) => list.map((i, n) => (n === idx ? { ...i, [field]: value } : i)))
  const addRow = () => setIngs((l) => [...l, { sv: '', en: '', qtyText: '', unit: '', cat: 'Övrigt' }])
  const rmRow = (idx: number) => setIngs((l) => {
    const next = l.filter((_, n) => n !== idx)
    return next.length ? next : [{ sv: '', en: '', qtyText: '', unit: '', cat: 'Övrigt' }]
  })

  const save = () => {
    const ingredients: Ingredient[] = ings
      .filter((i) => i.sv.trim())
      .map((i) => ({ sv: i.sv.trim(), en: i.en || '', qty: parseQty(i.qtyText), unit: i.unit.trim(), cat: i.cat }))
    if (!sv.trim() || !ingredients.length) { showToast(t('need_name')); return }
    onSave({
      id: draft.id,
      sv: sv.trim(),
      en: en.trim() || null,
      day, mark,
      weeks: draft.weeks || '',
      ingredients,
      steps: steps.split('\n').map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean),
    })
  }

  return (
    <div className="detail">
      <button className="backbtn" onClick={onCancel}>← {t('back')}</button>
      <div className="pagehead"><h2>{draft.isEdit ? t('form_edit') : t('form_new')}</h2></div>
      <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>

      <div className="frm">
        <div className="lbl2">{t('f_sv')}</div>
        <input type="text" value={sv} onChange={(e) => setSv(e.target.value)} />
        <div className="lbl2">{t('f_en')}</div>
        <input type="text" value={en} onChange={(e) => setEn(e.target.value)} />

        <div className="two">
          <div>
            <div className="lbl2">{t('f_day')}</div>
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS_EN.map((d, i) => <option key={d} value={d}>{t('days')[i]}</option>)}
            </select>
          </div>
          <div>
            <div className="lbl2">{t('f_mark')}</div>
            <select value={mark} onChange={(e) => setMark(e.target.value)}>
              <option value="">{t('f_none')}</option>
              <option value="⭐">⭐</option>
              <option value="🔁">🔁</option>
              <option value="🇸🇪">🇸🇪</option>
            </select>
          </div>
        </div>

        <div className="lbl2">{t('ingredients')}</div>
        <div className="hint">{t('f_ing_hint')}</div>
        {ings.map((i, idx) => (
          <div key={idx} className="ingcard">
            <div className="ichead">
              <b>{t('ing_ph')} {idx + 1}</b>
              <button className="icrm" onClick={() => rmRow(idx)}>{t('remove')}</button>
            </div>
            <input type="text" placeholder={t('ing_ph')} value={i.sv} onChange={(e) => setIng(idx, 'sv', e.target.value)} />
            <div className="qtyrow">
              <div>
                <div className="flbl">{t('qty_ph')}</div>
                <input type="text" inputMode="decimal" placeholder={t('to_taste')} value={i.qtyText} onChange={(e) => setIng(idx, 'qtyText', e.target.value)} />
              </div>
              <div>
                <div className="flbl">{t('unit_ph')}</div>
                <input type="text" list="units" value={i.unit} onChange={(e) => setIng(idx, 'unit', e.target.value)} />
              </div>
            </div>
            <div className="flbl">{t('f_cat')}</div>
            <select value={i.cat} onChange={(e) => setIng(idx, 'cat', e.target.value)}>
              {CAT_ORDER.map((c) => <option key={c} value={c}>{t('cats')[c] || c}</option>)}
            </select>
          </div>
        ))}
        <button className="addingbtn" onClick={addRow}>{t('f_add_ing')}</button>

        <div className="lbl2">{t('f_steps')}</div>
        <textarea placeholder={t('steps_ph')} value={steps} onChange={(e) => setSteps(e.target.value)} />

        <div className="modalrow">
          <button className="btn-ghost" onClick={onCancel}>{t('cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('save_recipe')}</button>
        </div>
      </div>
    </div>
  )
}
