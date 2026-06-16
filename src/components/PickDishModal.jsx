import { useMemo, useState } from 'react'
import { DAYS_EN, dishName } from '../i18n'
import SearchIcon from './SearchIcon'

export default function PickDishModal({ t, lang, recipes, day, onCancel, onPick }) {
  const [q, setQ] = useState('')
  // dishes that belong to the chosen weekday are listed first
  const { match, rest } = useMemo(() => {
    const s = q.toLowerCase()
    const list = recipes
      .filter((r) => !s || r.sv.toLowerCase().includes(s) || (r.en || '').toLowerCase().includes(s))
      .sort((a, b) => dishName(a, lang).localeCompare(dishName(b, lang), lang))
      .slice(0, 60)
    const dayEn = DAYS_EN[day]
    return {
      match: list.filter((r) => r.day === dayEn),
      rest: list.filter((r) => r.day !== dayEn),
    }
  }, [recipes, q, lang, day])

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal pickmodal">
        <div className="modalhead">
          <div>
            <h3>{t('pick_recipe')}</h3>
            <div className="sub">{t('days')[day]}</div>
          </div>
          <button className="closebtn" onClick={onCancel}>{t('cancel')}</button>
        </div>
        <div className="searchwrap">
          <div className="searchbox">
            <SearchIcon />
            <input placeholder={t('search_ph')} value={q} autoFocus autoComplete="off" onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="picker-list">
          {match.length === 0 && rest.length === 0 && <div className="empty">{t('no_results')}</div>}
          {match.length > 0 && <div className="pkgroup">{t('pick_day_match').replace('%d', t('days')[day])}</div>}
          {match.map((r) => (
            <button key={r.id} className="pk" onClick={() => onPick(r.id)}>
              {r.mark ? r.mark + ' ' : ''}{dishName(r, lang)}
            </button>
          ))}
          {match.length > 0 && rest.length > 0 && <div className="pkgroup">{t('pick_all')}</div>}
          {rest.map((r) => (
            <button key={r.id} className="pk" onClick={() => onPick(r.id)}>
              {r.mark ? r.mark + ' ' : ''}{dishName(r, lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
