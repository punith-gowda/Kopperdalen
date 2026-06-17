import { useState } from 'react'
import { DAYS_EN, dishName } from '../../i18n'
import { weekDates, weekNumber } from '../../lib/week'
import type { Lang, Recipe, TFunc } from '../../types'

const PRESETS = [4, 8, 12, 20, 40, 60]

interface AddToPlanModalProps {
  t: TFunc
  lang: Lang
  recipe: Recipe
  weekKey: string
  dayFree: (day: number) => number
  defaultServ: number
  onCancel: () => void
  onConfirm: (day: number, servings: number) => void
}

export default function AddToPlanModal({ t, lang, recipe, weekKey, dayFree, defaultServ, onCancel, onConfirm }: AddToPlanModalProps) {
  // prefer the recipe's own day when it has room, else the first free day
  const ownDay = DAYS_EN.indexOf(recipe.day)
  const firstFree = (() => { for (let d = 0; d < 5; d++) if (dayFree(d) >= 0) return d; return 0 })()
  const [day, setDay] = useState(ownDay >= 0 && dayFree(ownDay) >= 0 ? ownDay : firstFree)
  const [serv, setServ] = useState(defaultServ || 4)

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h3>{dishName(recipe, lang)}</h3>
        <div className="sub">{t('week')} {weekNumber(weekKey)} · {weekDates(weekKey)}</div>

        <div className="lbl2">{t('pick_day')}</div>
        <div className="optgrid">
          {(t('days_s') as string[]).map((d, i) => (
            <button
              key={d} className={day === i ? 'on' : ''} disabled={dayFree(i) < 0}
              onClick={() => setDay(i)}
            >{d}</button>
          ))}
        </div>

        <div className="lbl2">{t('pick_serv')}</div>
        <div className="presetchips">
          {PRESETS.map((n) => (
            <button key={n} className={serv === n ? 'on' : ''} onClick={() => setServ(n)}>{n}</button>
          ))}
        </div>
        <div className="servpick">
          <button onClick={() => setServ(Math.max(1, serv - 1))}>−</button>
          <input
            className="srvin" style={{ width: 70, fontSize: '1.2rem' }} type="number" min="1" max="999"
            value={serv} onChange={(e) => setServ(Math.min(999, Math.max(1, parseInt(e.target.value) || 4)))}
          />
          <button onClick={() => setServ(Math.min(999, serv + 1))}>+</button>
        </div>

        <div className="modalrow">
          <button className="btn-ghost" onClick={onCancel}>{t('cancel')}</button>
          <button className="btn-primary" onClick={() => onConfirm(day, serv)}>{t('add')}</button>
        </div>
      </div>
    </div>
  )
}
