import { DAYS_EN, dishName } from '../i18n'
import { shiftWeek, weekDates, weekNumber, weekYear } from '../lib/week'
import Chevron from './Chevron'

export default function Planner({
  t, lang, data, byId, weekKey, setWeekKey,
  onOpenRecipe, onPick, onSetServings, onRemove, onCopyPrev, onClear,
}) {
  const plan = data.plans[weekKey] || {}
  let total = 0

  const dayBlocks = t('days').map((dn, d) => {
    let count = 0
    const rows = [0, 1, 2].map((sl) => {
      const e = plan[d + '-' + sl]
      if (!(e && byId[e.id])) return null
      total += e.servings
      count++
      return (
        <div key={sl} className="slot filled">
          <div className="toprow" onClick={() => onOpenRecipe(e.id)}>
            <span className="sn">{count}</span>
            <div className="nm">{dishName(byId[e.id], lang)}</div>
          </div>
          <div className="ctrlrow">
            <span className="srvlbl">{t('servings')}</span>
            <div className="srv">
              <button aria-label="Fewer" onClick={() => onSetServings(d, sl, e.servings - 1)}>−</button>
              <input
                className="srvin" type="number" min="1" max="999" value={e.servings}
                onChange={(ev) => onSetServings(d, sl, parseInt(ev.target.value) || 1)}
              />
              <button aria-label="More" onClick={() => onSetServings(d, sl, e.servings + 1)}>+</button>
            </div>
            <button className="rm" onClick={() => onRemove(d, sl)}>{t('remove')}</button>
          </div>
        </div>
      )
    })
    const freeSlot = [0, 1, 2].find((sl) => { const e = plan[d + '-' + sl]; return !(e && byId[e.id]) })
    return (
      <div key={d} className="dayblock">
        <div className="dh">
          <h3>{dn}</h3>
          {count > 0 && <small>{count} / 3</small>}
        </div>
        {rows}
        {freeSlot !== undefined && (
          <button className="addday" onClick={() => onPick(d, freeSlot)}>{t('add_dish')}</button>
        )}
      </div>
    )
  })

  return (
    <>
      <div className="pagehead"><h2>{t('plan_title')}</h2><p>{t('plan_sub')}</p></div>
      <div className="weeknav">
        <button aria-label="Previous week" onClick={() => setWeekKey(shiftWeek(weekKey, -1))}><Chevron dir="left" /></button>
        <div className="wk">
          <b>{t('week')} {weekNumber(weekKey)}</b>
          <small>{weekDates(weekKey)} · {weekYear(weekKey)}</small>
        </div>
        <button aria-label="Next week" onClick={() => setWeekKey(shiftWeek(weekKey, 1))}><Chevron dir="right" /></button>
      </div>
      {dayBlocks}
      <div className="plannerfoot">
        <button className="ghostbtn" onClick={() => onCopyPrev(shiftWeek(weekKey, -1))}>{t('copy_prev')}</button>
        <button className="ghostbtn" onClick={onClear}>{t('clear_week')}</button>
      </div>
      <div className="totline">{t('tot_servings').replace('%n', total)}</div>
    </>
  )
}
