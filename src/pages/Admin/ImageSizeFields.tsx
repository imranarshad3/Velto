import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { validImageDimension, type ImageFit, type ImagePosition, type ImageRatio, type ImageSize } from '../../features/cms/imageSizing.ts'

export default function ImageSizeFields({ fieldKey, size, disabled, onChange }: {
  fieldKey: string; size?: ImageSize; disabled: boolean; onChange: (size: ImageSize) => void
}) {
  const current = size ?? { width: '', height: '' }
  const hasSizing = Boolean(current.width || current.height || current.fit || current.position || current.ratio)
  const helpId = `image-size-${fieldKey}-help`
  const coverLayout = ['WhyChoose.image-src', 'ProfessionalsBanner.image-src', 'ApplicationSolutions.image-src', 'SolutionsPage.image-src'].includes(fieldKey)
  const naturalLayout = fieldKey === 'AboutPage.image-src' || /^Inspiration\.data\..+\.image\.src$/.test(fieldKey)
  if (coverLayout) return <fieldset disabled={disabled} className="rounded-xl border border-border p-3">
    <legend className="px-1 text-sm font-semibold">Edge-to-edge photo</legend>
    <p className="text-xs leading-relaxed text-muted">This photo fills its section without empty bands. The frame adjusts to the screen; choose which part of the photo stays visible when the edges are cropped.</p>
    <label htmlFor={`${helpId}-focus`} className="mt-3 block text-sm font-semibold">Photo focus
      <select id={`${helpId}-focus`} className={`${inputClass} mt-1 font-normal`} value={current.position ?? 'center'} onChange={event => onChange({ width: '', height: '', fit: 'cover', position: event.target.value as ImagePosition })}>
        <option value="center">Center</option><option value="top">Top</option><option value="right">Right</option><option value="bottom">Bottom</option><option value="left">Left</option>
      </select>
    </label>
  </fieldset>
  if (naturalLayout) return <div className="rounded-xl border border-border p-3">
    <p className="text-sm font-semibold">Full image · automatic proportions</p>
    <p className="mt-2 text-xs leading-relaxed text-muted">This photo is shown completely. Its height adjusts to its original proportions on every screen, so it stays clear without cropping or empty bands.</p>
    {hasSizing && <button type="button" disabled={disabled} className={buttonClass('ghost', 'sm', 'mt-2')} onClick={() => onChange({ width: '', height: '' })}>Clear unused frame settings</button>}
  </div>
  return <fieldset disabled={disabled} className="rounded-xl border border-border p-3">
    <legend className="px-1 text-sm font-semibold">Image size and crop</legend>
    <div role="group" aria-label="Image size presets" className="mb-4 flex flex-wrap gap-2">
      <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => onChange({ width: '', height: '' })}>Natural ratio</button>
      <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => onChange({ width: '100%', height: '', fit: 'cover', position: 'center', ratio: 'landscape' })}>Landscape</button>
      <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => onChange({ width: '100%', height: '', fit: 'cover', position: 'center', ratio: 'square' })}>Square</button>
      <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => onChange({ width: '100%', height: '', fit: 'cover', position: 'center', ratio: 'portrait' })}>Portrait</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {(['width', 'height'] as const).map(axis => {
        const valid = validImageDimension(current[axis], axis)
        const id = `image-size-${fieldKey}-${axis}`
        return <div key={axis}>
          <label htmlFor={id} className="text-sm font-semibold">{axis === 'width' ? 'Width' : 'Height'}</label>
          <input id={id} className={`${inputClass} mt-1`} type="text" value={current[axis]} maxLength={12}
            placeholder={axis === 'width' ? 'Default — e.g. 100% or 24rem' : 'Default — e.g. 18rem'}
            aria-invalid={!valid || undefined} aria-describedby={`${helpId}${valid ? '' : ` ${id}-error`}`}
            onChange={event => onChange({ ...current, [axis]: event.target.value.trim().toLowerCase(), ...(axis === 'height' ? { ratio: undefined } : {}) })} />
          {!valid && <p id={`${id}-error`} className="mt-1 text-xs text-danger">Use a positive size up to 120rem{axis === 'width' ? ', or up to 100%' : ''}.</p>}
        </div>
      })}
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label htmlFor={`image-size-${fieldKey}-ratio`} className="text-sm font-semibold">Frame ratio
        <select id={`image-size-${fieldKey}-ratio`} className={`${inputClass} mt-1 font-normal`} value={current.ratio ?? ''} onChange={event => onChange({ ...current, height: '', ratio: (event.target.value || undefined) as ImageRatio | undefined })}>
          <option value="">Original proportions</option><option value="landscape">Landscape · 4:3</option><option value="square">Square · 1:1</option><option value="portrait">Portrait · 3:4</option>
        </select>
      </label>
      <label htmlFor={`image-size-${fieldKey}-fit`} className="text-sm font-semibold">Image fit
        <select id={`image-size-${fieldKey}-fit`} className={`${inputClass} mt-1 font-normal`} value={current.fit ?? ''} onChange={event => onChange({ ...current, fit: (event.target.value || undefined) as ImageFit | undefined })}>
          <option value="">Theme default</option><option value="contain">Show full image</option><option value="cover">Fill frame and crop</option>
        </select>
      </label>
      <label htmlFor={`image-size-${fieldKey}-position`} className="text-sm font-semibold">Crop focus
        <select id={`image-size-${fieldKey}-position`} className={`${inputClass} mt-1 font-normal`} value={current.position ?? ''} disabled={current.fit !== 'cover'} onChange={event => onChange({ ...current, position: (event.target.value || undefined) as ImagePosition | undefined })}>
          <option value="">Center (default)</option><option value="top">Top</option><option value="right">Right</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="center">Center</option>
        </select>
      </label>
    </div>
    <p id={helpId} className="mt-3 text-xs leading-relaxed text-muted">Use rem for sizes that scale with text, or % for width. Frame ratios stay responsive; “Fill frame and crop” lets you choose which side stays visible. “Show full image” avoids cropping.</p>
    <button type="button" disabled={disabled || !hasSizing} className={buttonClass('ghost', 'sm', 'mt-2')} onClick={() => onChange({ width: '', height: '' })}>Reset image sizing</button>
  </fieldset>
}
