import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { validImageDimension, type ImageSize } from '../../features/cms/imageSizing.ts'

export default function ImageSizeFields({ fieldKey, size, disabled, onChange }: {
  fieldKey: string; size?: ImageSize; disabled: boolean; onChange: (size: ImageSize) => void
}) {
  const current = size ?? { width: '', height: '' }
  const helpId = `image-size-${fieldKey}-help`
  return <fieldset disabled={disabled} className="rounded-xl border border-border p-3">
    <legend className="px-1 text-sm font-semibold">Image dimensions</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {(['width', 'height'] as const).map(axis => {
        const valid = validImageDimension(current[axis], axis)
        const id = `image-size-${fieldKey}-${axis}`
        return <div key={axis}>
          <label htmlFor={id} className="text-sm font-semibold">{axis === 'width' ? 'Width' : 'Height'}</label>
          <input id={id} className={`${inputClass} mt-1`} type="text" value={current[axis]} maxLength={12}
            placeholder={axis === 'width' ? 'Default — e.g. 100% or 24rem' : 'Default — e.g. 18rem'}
            aria-invalid={!valid || undefined} aria-describedby={`${helpId}${valid ? '' : ` ${id}-error`}`}
            onChange={event => onChange({ ...current, [axis]: event.target.value.trim().toLowerCase() })} />
          {!valid && <p id={`${id}-error`} className="mt-1 text-xs text-danger">Use a positive size up to 120rem{axis === 'width' ? ', or up to 100%' : ''}.</p>}
        </div>
      })}
    </div>
    <p id={helpId} className="mt-3 text-xs text-muted">Use rem for sizes that scale with text, or % for width. Blank values keep the original sizing. Setting only width preserves the image proportions. Images stay within the page width; existing image frames may crop them.</p>
    <button type="button" disabled={disabled || (!current.width && !current.height)} className={buttonClass('ghost', 'sm', 'mt-2')} onClick={() => onChange({ width: '', height: '' })}>Reset dimensions</button>
  </fieldset>
}
