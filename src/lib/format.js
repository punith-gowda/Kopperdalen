// Quantity formatting: sensible rounding, Swedish decimal comma in sv mode
export function fmtQty(q, lang) {
  if (q == null) return ''
  let v = Math.round(q * 100) / 100
  if (v >= 100) v = Math.round(v)
  else if (v >= 10) v = Math.round(v * 10) / 10
  let s = String(v)
  if (lang === 'sv') s = s.replace('.', ',')
  return s
}

export function parseQty(raw) {
  const t = String(raw).trim().replace(',', '.')
  if (t === '') return null
  const n = parseFloat(t)
  return isNaN(n) ? null : n
}
