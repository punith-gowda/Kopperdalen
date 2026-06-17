import { Navigate, useNavigate, useParams } from 'react-router-dom'
import RecipeDetail from './RecipeDetail'
import type { AppData, Lang, Recipe, RecipeId, RecipeMap, TFunc } from '../../types'

interface RecipeDetailPageProps {
  t: TFunc
  lang: Lang
  data: AppData
  byId: RecipeMap
  onFav: (id: RecipeId) => void
  onRate: (id: RecipeId, n: number) => void
  onAddToPlan: (id: RecipeId) => void
  onEdit: (r: Recipe) => void
  onDuplicate: (r: Recipe) => void
  onDelete: (id: RecipeId) => void
}

/** Route wrapper: resolves :id to a recipe, redirects to the catalogue if gone. */
export default function RecipeDetailPage(props: RecipeDetailPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const recipe = id != null ? props.byId[id] : undefined
  if (!recipe) return <Navigate to="/recipes" replace />
  return (
    <RecipeDetail
      t={props.t}
      lang={props.lang}
      recipe={recipe}
      data={props.data}
      onBack={() => navigate('/recipes')}
      onFav={props.onFav}
      onRate={props.onRate}
      onAddToPlan={props.onAddToPlan}
      onEdit={props.onEdit}
      onDuplicate={props.onDuplicate}
      onDelete={props.onDelete}
    />
  )
}
