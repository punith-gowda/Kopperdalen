import { useState } from 'react'
import { DAYS_EN, dishName, dishAlt, ingName } from '../i18n'
import { fmtQty } from '../lib/format'

export default function RecipeDetail({
  t, lang, recipe: r, data,
  onBack, onFav, onRate, onAddToPlan, onEdit, onDuplicate, onDelete,
}) {
  const [servings, setServings] = useState(4)
  const [doneSteps, setDoneSteps] = useState({})
  const f = servings / 4
  const rt = data.ratings[r.id] || 0
  const di = DAYS_EN.indexOf(r.day)
  const fav = !!data.favs[r.id]

  const setServ = (v) => setServings(Math.min(999, Math.max(1, v || 4)))

  return (
    <div className="detail">
      <button className="backbtn" onClick={onBack}>← {t('back')}</button>

      <div className="dhead">
        <h2>{r.mark ? r.mark + ' ' : ''}{dishName(r, lang)}</h2>
        <div className="sub">{dishAlt(r, lang)}</div>
        <div className="row">
          {di >= 0 && <span className="tag">{t('days')[di]}</span>}
          {r.custom && <span className="tag own">{t('own')}</span>}
          {r.weeks && <span className="tag">{t('weeks_on_menu')}: {r.weeks}</span>}
          <button className={`favbtn ${fav ? 'on' : ''}`} onClick={() => onFav(r.id)}>
            <span className="h">{fav ? '♥' : '♡'}</span> {t('fav')}
          </button>
        </div>
        <div className="ratingrow">
          <span className="lbl">{t('rate')}:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={`star ${rt >= n ? 'on' : ''}`} onClick={() => onRate(r.id, n)}>★</button>
          ))}
        </div>
        <div className="detailactions">
          <button className="ghostbtn" onClick={() => onDuplicate(r)}>{t('duplicate')}</button>
          {r.custom && (
            <>
              <button className="ghostbtn" onClick={() => onEdit(r)}>{t('edit')}</button>
              <button className="dangerbtn" onClick={() => onDelete(r.id)}>{t('del')}</button>
            </>
          )}
        </div>
      </div>

      <div className="servbar">
        <span className="lbl">{t('servings')}</span>
        <div className="stepper">
          <button onClick={() => setServ(servings - 1)}>−</button>
          <input
            className="srvin" type="number" min="1" max="999" value={servings}
            onChange={(e) => setServ(parseInt(e.target.value))}
          />
          <button onClick={() => setServ(servings + 1)}>+</button>
        </div>
      </div>

      <div className="section">
        <h3>{t('ingredients')}</h3>
        {r.ingredients.map((i, idx) => (
          <div key={idx} className="ingline">
            <span>{ingName(i, lang)}</span>
            <span className="q">
              {i.qty == null ? t('to_taste') : fmtQty(i.qty * f, lang) + ' ' + i.unit}
            </span>
          </div>
        ))}
      </div>

      <div className="section">
        <h3>{t('preparation')}</h3>
        <div className="hintline">{t('tap_step')}</div>
        <ol className="steps">
          {r.steps.map((st, idx) => (
            <li
              key={idx} className={doneSteps[idx] ? 'done' : ''}
              onClick={() => setDoneSteps((d) => ({ ...d, [idx]: !d[idx] }))}
            >
              <span>{st}</span>
            </li>
          ))}
        </ol>
      </div>

      <button className="addplanbtn" onClick={() => onAddToPlan(r.id)}>{t('add_to_plan')}</button>
    </div>
  )
}
