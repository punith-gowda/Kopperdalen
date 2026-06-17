import { useRef } from 'react'
import type { TFunc } from '../../types'

interface SettingsProps {
  t: TFunc
  onExport: () => void
  onImport: (file: File) => void
  onBack: () => void
  onSignOut?: () => void
}

export default function Settings({ t, onExport, onImport, onBack, onSignOut }: SettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <button className="backbtn" onClick={onBack}>← {t('back')}</button>
      <div className="pagehead"><h2>{t('settings_title')}</h2></div>
      <div className="section backup">
        <h3>{t('backup_title')}</h3>
        <p>{t('backup_hint')}</p>
        <div className="backuprow">
          <button className="ghostbtn" onClick={onExport}>{t('export_btn')}</button>
          <button className="ghostbtn" onClick={() => fileRef.current?.click()}>{t('import_btn')}</button>
          <input
            ref={fileRef} type="file" accept=".json,application/json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = '' }}
          />
        </div>
      </div>
      {onSignOut && (
        <div className="section account">
          <h3>{t('account_title')}</h3>
          <button
            className="dangerbtn signoutbtn"
            onClick={() => { if (window.confirm(t('sign_out_confirm'))) onSignOut() }}
          >
            {t('sign_out')}
          </button>
        </div>
      )}
    </>
  )
}
