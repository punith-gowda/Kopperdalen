import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import RecipeEditor from './RecipeEditor'
import { makeDraft, type EditorMode } from './draft'
import type { Lang, Recipe, RecipeMap, TFunc } from '../../types'

interface RecipeEditorPageProps {
  t: TFunc
  lang: Lang
  byId: RecipeMap
  mode: EditorMode
  onSave: (rec: Recipe) => void
  showToast: (msg: string) => void
}

/** Route wrapper: builds the editor draft for new/edit/duplicate modes. */
export default function RecipeEditorPage({ t, lang, byId, mode, onSave, showToast }: RecipeEditorPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const src: Recipe | null = mode !== 'new' && id != null && byId[id] ? byId[id] : null
  const draft = useMemo(() => makeDraft(src, mode), [src, mode])
  if (mode !== 'new' && !src) return <Navigate to="/recipes" replace />
  return (
    <RecipeEditor
      t={t}
      lang={lang}
      draft={draft}
      onCancel={() => navigate(-1)}
      onSave={onSave}
      showToast={showToast}
    />
  )
}
