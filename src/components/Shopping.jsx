import { useMemo } from 'react'
import { CAT_ORDER, ingName } from '../i18n'
import { fmtQty } from '../lib/format'
import { shiftWeek, weekDates, weekNumber } from '../lib/week'
import Chevron from './Chevron'

function buildItems(data, byId, weekKey) {
  const agg = {}
  const plan = data.plans[weekKey] || {}
  for (const e of Object.values(plan)) {
    if (!e || !byId[e.id]) continue
    const r = byId[e.id]
    const f = e.servings / 4
    for (const i of r.ingredients) {
      const key = i.sv + '|' + i.unit
      if (!agg[key]) agg[key] = { key, sv: i.sv, en: i.en, unit: i.unit, cat: i.cat, qty: 0, toTaste: false }
      if (i.qty == null) agg[key].toTaste = true
      else agg[key].qty += i.qty * f
    }
  }
  return Object.values(agg)
}

export default function Shopping({ t, lang, data, byId, weekKey, setWeekKey, onToggle, onUncheckAll, showToast }) {
  const items = useMemo(() => buildItems(data, byId, weekKey), [data.plans, byId, weekKey])
  const checked = data.checked[weekKey] || {}
  const done = items.filter((i) => checked[i.key]).length

  const weekNav = (
    <div className="weeknav">
      <button aria-label="Previous week" onClick={() => setWeekKey(shiftWeek(weekKey, -1))}><Chevron dir="left" /></button>
      <div className="wk"><b>{t('week')} {weekNumber(weekKey)}</b><small>{weekDates(weekKey)}</small></div>
      <button aria-label="Next week" onClick={() => setWeekKey(shiftWeek(weekKey, 1))}><Chevron dir="right" /></button>
    </div>
  )

  if (!items.length) {
    return (
      <>
        <div className="pagehead"><h2>{t('shop_title')}</h2><p>{t('shop_sub')}</p></div>
        {weekNav}
        <div className="empty">{t('nothing_planned')}</div>
      </>
    )
  }

  const groups = {}
  items.forEach((i) => (groups[i.cat] = groups[i.cat] || []).push(i))

  const copyList = () => {
    let txt = t('shop_title') + ' — ' + t('week') + ' ' + weekNumber(weekKey) + ' (' + weekDates(weekKey) + ')\n'
    CAT_ORDER.filter((c) => groups[c]).forEach((c) => {
      txt += '\n' + (t('cats')[c] || c).toUpperCase() + '\n'
      groups[c]
        .slice().sort((a, b) => ingName(a, lang).localeCompare(ingName(b, lang)))
        .forEach((i) => {
          txt += '• ' + ingName(i, lang) + ' — ' + (i.qty > 0 ? fmtQty(i.qty, lang) + ' ' + i.unit : t('to_taste')) + '\n'
        })
    })
    navigator.clipboard?.writeText(txt).then(() => showToast(t('copied'))).catch(() => {})
  }

  return (
    <>
      <div className="pagehead"><h2>{t('shop_title')}</h2><p>{t('shop_sub')}</p></div>
      {weekNav}
      <div className="totline" style={{ marginTop: 10 }}>
        {t('items_done').replace('%a', done).replace('%b', items.length)}
      </div>
      <div className="progress"><div style={{ width: (100 * done) / items.length + '%' }} /></div>
      <div className="shopactions">
        <button className="ghostbtn" onClick={copyList}>{t('copy_list')}</button>
        <button className="ghostbtn" onClick={onUncheckAll}>{t('uncheck_all')}</button>
      </div>
      {CAT_ORDER.filter((c) => groups[c]).map((c) => (
        <div key={c} className="catblock">
          <h3>{t('cats')[c] || c}</h3>
          {groups[c]
            .slice().sort((a, b) => ingName(a, lang).localeCompare(ingName(b, lang), lang))
            .map((i) => (
              <div key={i.key} className={`shopitem ${checked[i.key] ? 'done' : ''}`} onClick={() => onToggle(i.key)}>
                <span className="cb">{checked[i.key] ? '✓' : ''}</span>
                <span className="nm">{ingName(i, lang)}</span>
                <span className="q">{i.qty > 0 ? fmtQty(i.qty, lang) + ' ' + i.unit : t('to_taste')}</span>
              </div>
            ))}
        </div>
      ))}
    </>
  )
}
