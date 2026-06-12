import { useRef } from 'react'

export default function Settings({ t, onExport, onImport, onBack }) {
  const fileRef = useRef(null)
  return (
    <>
      <button className="backbtn" onClick={onBack}>← {t('back')}</button>
      <div className="pagehead"><h2>{t('settings_title')}</h2></div>
      <div className="section backup">
        <h3>{t('backup_title')}</h3>
        <p>{t('backup_hint')}</p>
        <div className="backuprow">
          <button className="ghostbtn" onClick={onExport}>{t('export_btn')}</button>
          <button className="ghostbtn" onClick={() => fileRef.current.click()}>{t('import_btn')}</button>
          <input
            ref={fileRef} type="file" accept=".json,application/json" hidden
            onChange={(e) => { const f = e.target.files[0]; if (f) onImport(f); e.target.value = '' }}
          />
        </div>
      </div>
    </>
  )
}
