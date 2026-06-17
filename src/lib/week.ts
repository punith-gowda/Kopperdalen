// ISO week helpers — week keys look like "2026-W24"
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const y = d.getUTCFullYear()
  const wk = Math.ceil(((d.getTime() - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7)
  return y + '-W' + String(wk).padStart(2, '0')
}

export function shiftWeek(key: string, n: number): string {
  const [y, w] = key.split('-W').map(Number)
  const d = new Date(Date.UTC(y, 0, 4))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1 + (w - 1 + n) * 7)
  return isoWeekKey(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function weekDates(key: string): string {
  const [y, w] = key.split('-W').map(Number)
  const d = new Date(Date.UTC(y, 0, 4))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1 + (w - 1) * 7)
  const mon = new Date(d)
  const fri = new Date(d)
  fri.setUTCDate(fri.getUTCDate() + 4)
  const f = (x: Date) => x.getUTCDate() + '/' + (x.getUTCMonth() + 1)
  return f(mon) + ' – ' + f(fri)
}

export const weekNumber = (key: string): number => parseInt(key.split('-W')[1])
export const weekYear = (key: string): string => key.split('-')[0]
