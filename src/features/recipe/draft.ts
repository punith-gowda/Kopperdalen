import type { Recipe } from '../../types'
import type { EditorDraft } from './RecipeEditor'

export type EditorMode = 'new' | 'edit' | 'duplicate'

/** Build the editor's working draft from a source recipe (or blank for "new"). */
export function makeDraft(src: Recipe | null, mode: EditorMode): EditorDraft {
  const isEdit = mode === 'edit'
  return {
    id: isEdit && src ? src.id : 'c' + Date.now(),
    isEdit: isEdit && !!src,
    sv: src ? (isEdit ? src.sv : src.sv + ' (kopia)') : '',
    en: src ? src.en || '' : '',
    day: src ? src.day || 'Monday' : 'Monday',
    mark: src ? src.mark || '' : '',
    weeks: isEdit && src ? src.weeks || '' : '',
    ingredients: src
      ? src.ingredients.map((i) => ({ ...i }))
      : [{ sv: '', en: '', qty: null, unit: '', cat: 'Övrigt' }],
    steps: src ? src.steps.join('\n') : '',
  }
}
