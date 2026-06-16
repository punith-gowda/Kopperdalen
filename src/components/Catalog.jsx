import { useMemo, useState } from 'react'
import { DAYS_EN, dishName, dishAlt } from '../i18n'
import SearchIcon from './SearchIcon'

export default function Catalog({ t, lang, recipes, data, onOpen, onNew }) {
  const [query, setQuery] = useState('')
  const [fDay, setFDay] = useState('')
  const [fFav, setFFav] = useState(false)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes
      .filter((r) => {
        if (fDay && r.day !== fDay) return false
        if (fFav && !data.favs[r.id]) return false
        if (!q) return true
        if (r.sv.toLowerCase().includes(q) || (r.en || '').toLowerCase().includes(q)) return true
        return r.ingredients.some(
          (i) => i.sv.toLowerCase().includes(q) || (i.en || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => dishName(a, lang).localeCompare(dishName(b, lang), lang))
  }, [recipes, query, fDay, fFav, data.favs, lang])

  const chip = (label, on, onClick, cls = '') => (
    <button key={label} className={`chip ${cls} ${on ? 'on' : ''}`} onClick={onClick}>{label}</button>
  )

  return (
    <>
      <div className="pagehead rowed">
        <h2>{t('cat_title')}</h2>
        <button className="newbtn" onClick={onNew}>{t('new_recipe')}</button>
      </div>

      <div className="searchrow">
        <div className="searchbox">
          <SearchIcon />
          <input
            placeholder={t('search_ph')} value={query} autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="clear" aria-label="Clear" onClick={() => setQuery('')}>✕</button>
          )}
        </div>
        <div className="chips">
          {chip(t('all'), !fDay && !fFav, () => { setFDay(''); setFFav(false) })}
          {chip(t('favs'), fFav, () => setFFav(!fFav), 'falu')}
          {DAYS_EN.map((d, i) => chip(t('days_s')[i], fDay === d, () => setFDay(fDay === d ? '' : d)))}
        </div>
        <div className="resultcount">{t('results').replace('%n', list.length)}</div>
      </div>

      <div className="cards">
        {list.length === 0 && <div className="empty">{t('no_results')}</div>}
        {list.map((r) => {
          const rt = data.ratings[r.id] || 0
          const di = DAYS_EN.indexOf(r.day)
          return (
            <div key={r.id} className="rcard" onClick={() => onOpen(r.id)}>
              {(di >= 0 || data.favs[r.id]) && (
                <div className="topline">
                  {di >= 0 && <span className="daylbl">{t('days')[di]}</span>}
                  {data.favs[r.id] && <span className="fav-ind">♥</span>}
                </div>
              )}
              <h3>
                {r.mark ? <span className="mark">{r.mark} </span> : null}
                {dishName(r, lang)}
              </h3>
              <div className="sub">{dishAlt(r, lang)}</div>
              <div className="meta">
                {r.custom && <span className="tag own">{t('own')}</span>}
                {rt > 0 && <span className="stars-mini">{'★'.repeat(rt)}{'☆'.repeat(5 - rt)}</span>}
                <span>{r.ingredients.length} {t('ingredients').toLowerCase()}</span>
                {r.weeks && <span>· {r.weeks}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
