import { useMemo, useState } from 'react'
import { dishName } from '../i18n'
import SearchIcon from './SearchIcon'

export default function PickDishModal({ t, lang, recipes, day, onCancel, onPick }) {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const s = q.toLowerCase()
    return recipes
      .filter((r) => !s || r.sv.toLowerCase().includes(s) || (r.en || '').toLowerCase().includes(s))
      .sort((a, b) => dishName(a, lang).localeCompare(dishName(b, lang), lang))
      .slice(0, 60)
  }, [recipes, q, lang])

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
          {list.length === 0 && <div className="empty">{t('no_results')}</div>}
          {list.map((r) => (
            <button key={r.id} className="pk" onClick={() => onPick(r.id)}>
              {r.mark ? r.mark + ' ' : ''}{dishName(r, lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
