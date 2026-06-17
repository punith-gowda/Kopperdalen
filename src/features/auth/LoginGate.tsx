import { useState, type FormEvent } from 'react'
import { T } from '../../i18n'
import { signIn } from '../../lib/cloud'
import type { Lang } from '../../types'

interface LoginGateProps {
  lang: Lang
  setLang: (lang: Lang) => void
}

export default function LoginGate({ lang, setLang }: LoginGateProps) {
  const t = (k: string) => T[lang][k]
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      await signIn(email, pass)
      // success unmounts this screen via the auth listener in Root
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  return (
    <div className="authscreen">
      <div className="authcard">
        <div className="lang-toggle authlang" role="group" aria-label="Language">
          <button type="button" className={lang === 'sv' ? 'on' : ''} onClick={() => setLang('sv')}>SV</button>
          <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        <div className="authbrand">
          <small>Kopperdalen Kök</small>
          <h1>Recept · Planera · Handla</h1>
        </div>
        <p className="authhint">{t('login_hint')}</p>
        <form onSubmit={submit}>
          <label className="lbl2" htmlFor="email">{t('login_email')}</label>
          <input
            id="email" type="email" autoComplete="username" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
          <label className="lbl2" htmlFor="pass">{t('login_pass')}</label>
          <input
            id="pass" type="password" autoComplete="current-password"
            value={pass} onChange={(e) => setPass(e.target.value)} required
          />
          {failed && <div className="autherr" role="alert">{t('login_failed')}</div>}
          <button className="btn-primary authsubmit" type="submit" disabled={busy}>
            {busy ? t('login_busy') : t('login_submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

/** Full-screen placeholder shown while checking auth / connecting to the cloud. */
export function Splash({ lang, connecting = false }: { lang: Lang; connecting?: boolean }) {
  const t = (k: string) => T[lang][k]
  return (
    <div className="authscreen">
      <div className="splash">
        <small>Kopperdalen Kök</small>
        <div className="spinner" aria-hidden="true" />
        {connecting && <p>{t('connecting')}</p>}
      </div>
    </div>
  )
}
