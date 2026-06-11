import { useMemo, useState } from 'react'
import { dishName } from '../i18n'

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
      <div className="modal">
        <h3>{t('pick_recipe')}</h3>
        <div className="sub">{t('days')[day]}</div>
        <div className="searchbox">
          🔍<input placeholder={t('search_ph')} value={q} autoFocus autoComplete="off" onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="picker-list">
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
