import { useSearchParams, useLocation } from 'react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, EyeOff, GripVertical, History, ImageUp, LoaderCircle, Maximize2, Minimize2, Monitor, PanelLeftClose, PanelLeftOpen, PanelsTopLeft, Redo2, Rows3, Save, Send, Smartphone, SquarePen, Tablet, Undo2 } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { useAdminShell } from '../../features/admin/shellStore.ts'
import { workspaceApi } from '../../features/cms/api.ts'
import { prepareImage } from '../../features/cms/image.ts'
import { pageDefinitions } from '../../features/cms/registry.ts'
import type { ContentField, ContentPage, ContentRevision, Media, PageContent } from '../../features/cms/types.ts'
import { useUnsaved } from '../../features/cms/useUnsaved.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useMediaQuery } from '../../lib/useMediaQuery.ts'
import ContentPreview, { type PreviewDevice } from './ContentPreview.tsx'
const message = (e: unknown) => e instanceof Error ? e.message : 'The change could not be saved.'
/** The alt-text field paired with an image field, when the page defines one. */
const altKey = (key: string) => key.endsWith('.src') ? key.slice(0, -3) + 'alt' : key.replace('image-src', 'image-alt')

/** Image field: paste a path, pick from the library, or upload from this computer (button or drag and drop). */
function ImageField({field, value, media, busy, onBrowse, onPick, onUpload}: {field: ContentField; value: string; media: Media[]; busy: boolean; onBrowse: () => void; onPick: (m: Media | null) => void; onUpload: (file: File) => Promise<void>}) {
  const [uploading, setUploading] = useState(false), [over, setOver] = useState(false)
  const upload = async (file?: File) => { if (!file || uploading) return; setUploading(true); try { await onUpload(file) } finally { setUploading(false) } }
  const inputId = `img-${field.key}`
  return <div className="text-sm font-semibold">
    <label htmlFor={`${inputId}-path`}>{field.label}</label>
    <div
      onDragOver={e => {e.preventDefault(); setOver(true)}} onDragLeave={() => setOver(false)}
      onDrop={e => {e.preventDefault(); setOver(false); void upload(e.dataTransfer.files[0])}}
      className={`mt-2 grid gap-3 rounded-2xl border border-dashed p-3 transition-colors sm:grid-cols-[10rem_minmax(0,1fr)] ${over ? 'border-forest bg-forest-soft' : 'border-border bg-cream/40'}`}
    >
      <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-sand">
        {uploading ? <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-forest motion-reduce:animate-none"/> : value ? <img className="size-full object-cover" src={value} alt="Selected asset"/> : <ImageUp aria-hidden="true" className="size-6 text-muted"/>}
      </div>
      <div className="grid content-start gap-2 font-normal">
        <input id={`${inputId}-path`} className={inputClass} value={value} disabled={busy || uploading} onChange={e => onPick({url: e.target.value} as Media)}/>
        <div className="flex flex-wrap gap-2">
          <label htmlFor={inputId} className={`${buttonClass('primary','sm')} cursor-pointer ${busy || uploading ? 'pointer-events-none opacity-60' : ''}`}><ImageUp size={16}/> {uploading ? 'Uploading…' : 'Upload from computer'}</label>
          <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || uploading} onChange={e => {void upload(e.target.files?.[0]); e.target.value = ''}}/>
          <button type="button" disabled={busy || uploading} className={buttonClass('secondary','sm')} onClick={onBrowse}>Browse library</button>
          <button type="button" disabled={busy || uploading || !value} className={buttonClass('ghost','sm')} onClick={() => onPick(null)}>Remove</button>
        </div>
        <p className="text-xs text-muted">Or drop a JPEG, PNG or WebP here. It’s optimized to WebP and saved to the Media Library.</p>
        {media.length > 0 && <select aria-label="Choose library image" className={inputClass} value="" onChange={e => onPick(media.find(m => m.url === e.target.value) ?? null)}><option value="" disabled>Select a library image</option>{media.map(m => <option key={m.id} value={m.url}>{m.name}</option>)}</select>}
      </div>
    </div>
  </div>
}
/** Pane sizes are kept in rem so they follow the user's font size; persisted per browser as a convenience. */
const LAYOUT_KEY = 'novaro:editor-layout'
const limits = { sections: [12, 26, 16], editor: [20, 52, 28] } as const
type PaneSizes = { sections: number; editor: number }
const clamp = (pane: keyof PaneSizes, v: number) => Math.min(limits[pane][1], Math.max(limits[pane][0], v))
function readSizes(): PaneSizes {
  try { const v = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? '{}'); return { sections: clamp('sections', +v.sections || limits.sections[2]), editor: clamp('editor', +v.editor || limits.editor[2]) } }
  catch { return { sections: limits.sections[2], editor: limits.editor[2] } }
}

/** Draggable, keyboard-operable divider (arrows ±1rem, Shift ±4rem, Home/End, double-click resets). */
function Divider({ label, pane, value, visible, onChange, onDragging }: { label: string; pane: keyof PaneSizes; value: number; visible: boolean; onChange: (v: number) => void; onDragging: (d: boolean) => void }) {
  const start = useRef<{ x: number; v: number; rem: number } | null>(null)
  const set = (v: number) => onChange(clamp(pane, v))
  const end = () => { if (start.current) { start.current = null; onDragging(false) } }
  return (
    <div
      role="separator" aria-orientation="vertical" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={limits[pane][0]} aria-valuemax={limits[pane][1]} tabIndex={0}
      inert={!visible || undefined} className={`group relative z-10 -mx-1 hidden cursor-col-resize touch-none outline-none lg:block ${visible ? '' : 'lg:invisible'}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { x: e.clientX, v: value, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 }; onDragging(true) }}
      onPointerMove={(e) => { if (start.current) set(start.current.v + (e.clientX - start.current.x) / start.current.rem) }}
      onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onDoubleClick={() => set(limits[pane][2])}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 4 : 1
        if (e.key === 'ArrowLeft') set(value - step); else if (e.key === 'ArrowRight') set(value + step)
        else if (e.key === 'Home') set(limits[pane][0]); else if (e.key === 'End') set(limits[pane][1]); else return
        e.preventDefault()
      }}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors duration-200 group-hover:bg-forest group-focus-visible:bg-forest group-active:bg-forest" />
      <span className="absolute top-1/2 left-1/2 h-10 w-1.5 -translate-1/2 rounded-full bg-sand-deep ring-1 ring-border transition-colors duration-200 group-hover:bg-forest group-focus-visible:bg-forest group-active:bg-forest" />
    </div>
  )
}

/** Toolbar toggle that reports its pressed state to assistive tech. */
function Toggle({ pressed, label, onClick, children, disabled }: { pressed: boolean; label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={pressed} aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className={`grid size-11 place-items-center rounded-xl transition-colors duration-200 disabled:opacity-40 ${pressed ? 'bg-forest-soft text-forest' : 'text-muted hover:bg-sand hover:text-ink'}`}>
      {children}
    </button>
  )
}

export default function AdminWebsitePage() {
  const [params] = useSearchParams()
  const location = useLocation()
  const requested = location.pathname.endsWith('/categories') ? 'categories' : params.get('page') ?? 'home'
  const initial = pageDefinitions.some(p => p.id === requested) ? requested : 'home'
  return <WebsiteEditor key={initial} initial={initial}/>
}
const devices: { id: PreviewDevice; label: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor }, { id: 'tablet', label: 'Tablet · 768', icon: Tablet }, { id: 'mobile', label: 'Mobile · 390', icon: Smartphone },
]
const paneHead = 'flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4'
const eyebrow = 'text-[0.6875rem] font-semibold tracking-[0.16em] text-muted uppercase'

function WebsiteEditor({initial}: {initial:string}) {
  const {getToken} = useAppAuth()
  const desktop = useMediaQuery('(min-width: 64rem)')
  const {sidebarCollapsed, toggleSidebar} = useAdminShell()
  const [slug, setSlug] = useState(initial), [section, setSection] = useState(pageDefinitions.find(p=>p.id===initial)!.sections[0].id)
  const [page, setPage] = useState<ContentPage | null>(null), [draft, setDraft] = useState<PageContent | null>(null)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [show, setShow] = useState({sections: true, editor: true, preview: true}), [focus, setFocus] = useState(false)
  const [sizes, setSizes] = useState(readSizes), [resizing, setResizing] = useState(false)
  const [history, setHistory] = useState<ContentRevision[] | null>(null), [media, setMedia] = useState<Media[]>([])
  const [dragged, setDragged] = useState<string | null>(null)
  // Undo/redo snapshots; consecutive keystrokes in one field within a moment collapse into one step.
  const draftRef = useRef<PageContent | null>(null), past = useRef<PageContent[]>([]), future = useRef<PageContent[]>([]), lastEdit = useRef<{key: string; at: number} | null>(null)
  const [stack, setStack] = useState({undo: 0, redo: 0})
  const syncStack = () => setStack({undo: past.current.length, redo: future.current.length})
  const definition = pageDefinitions.find(p => p.id === slug)!
  const dirty = JSON.stringify(draft) !== JSON.stringify(page?.draft ?? null)
  useUnsaved(dirty)
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(sizes)) } catch { /* convenience only */ } }, [sizes])
  const token = async () => { const t = await getToken(); if (!t) throw new Error('Please sign in again.'); return t }
  const resetHistory = () => { past.current = []; future.current = []; lastEdit.current = null; syncStack() }
  useEffect(() => {
    let active = true
    setPage(null); setDraft(null); setError(''); setHistory(null); setNotice(''); resetHistory()
    void getToken().then(async t => { if (!t) throw new Error('Please sign in again.'); return workspaceApi.page(t, slug) }).then(({page}) => { if (active) {setPage(page); setDraft(page.draft)} }).catch(e => {if (active) setError(message(e))})
    return () => {active = false}
  }, [slug, getToken])
  /** Apply an edit to the latest draft and record an undo step. */
  const commit = (next: (d: PageContent) => PageContent, key?: string) => {
    const current = draftRef.current
    if (!current) return
    const now = Date.now()
    if (!(key && lastEdit.current?.key === key && now - lastEdit.current.at < 800)) past.current = [...past.current.slice(-99), current]
    lastEdit.current = key ? {key, at: now} : null
    future.current = []
    const value = next(current)
    draftRef.current = value
    setDraft(value); syncStack()
  }
  const step = (from: typeof past, to: typeof past) => {
    const current = draftRef.current, target = from.current.at(-1)
    if (!current || !target) return
    from.current = from.current.slice(0, -1); to.current = [...to.current, current]; lastEdit.current = null
    draftRef.current = target; setDraft(target); syncStack()
  }
  const undo = () => step(past, future), redo = () => step(future, past)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focus) { setFocus(false); return }
      const typing = (e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')
      if (typing || !(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo() } else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const mutate = async (action: string, revisionId?: string) => {
    if (!page || !draft || busy) return
    if (action === 'unpublish' && !window.confirm('Remove published overrides? The storefront will use its original fallback content.')) return
    if (action === 'restore' && dirty && !window.confirm('Replace unsaved changes with this revision?')) return
    setBusy(true); setError(''); setNotice('')
    try {
      let current = page
      if ((action === 'publish' && (dirty || page.version === 0))) current = (await workspaceApi.mutate(await token(), slug, page.version, 'save', draft)).page
      const result = await workspaceApi.mutate(await token(), slug, current.version, action, action === 'save' ? draft : undefined, revisionId)
      setPage(result.page); setDraft(result.page.draft); setHistory(null)
      if (action === 'restore') resetHistory()
      setNotice(action === 'publish' ? 'Published. The storefront now uses this content.' : action === 'restore' ? 'Revision restored to draft. Preview and publish when ready.' : action === 'unpublish' ? 'Unpublished. Original storefront content is active.' : 'Draft saved.')
      if (action === 'publish' || action === 'unpublish') window.dispatchEvent(new Event('novaro:published'))
    } catch(e) {setError(message(e))} finally {setBusy(false)}
  }
  const move = (id: string, target: number) => commit(d => { const order = d.order.filter(s => s !== id); order.splice(Math.max(0, target), 0, id); return {...d, order} })
  const change = (key: string, value: string) => commit(d => ({...d, fields: {...d.fields, [key]: value}}), key)
  /** Set an image field (and its alt text, when known) in one step so the preview never shows a mismatched pair. */
  const pickImage = (key: string, item: Media | null, typed = false) => commit(d => ({...d, fields: {...d.fields, [key]: item?.url ?? '', ...(!typed && item?.alt ? {[altKey(key)]: item.alt} : {})}}), typed ? key : undefined)
  const uploadImage = async (key: string, file: File) => {
    setError(''); setNotice('')
    try {
      const {base64} = await prepareImage(file, 'original')
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 120) || 'Upload'
      const {media: item} = await workspaceApi.upload(await token(), {name, alt: '', folder: 'website', tags: [slug]}, base64)
      setMedia(list => [item, ...list.filter(m => m.id !== item.id)])
      pickImage(key, item)
      setNotice('Image uploaded to the Media Library. Add alt text, then save or publish.')
    } catch (e) { setError(message(e)) }
  }
  const toggle = (pane: keyof typeof show) => setShow(s => {
    const next = {...s, [pane]: !s[pane]}
    return next.editor || next.preview ? next : s // keep at least one working surface open
  })
  const openFocus = () => { setShow(s => ({...s, preview: true})); setFocus(true) }
  const fields = definition.sections.find(s => s.id === section)?.fields ?? []
  const sectionLabel = definition.sections.find(s => s.id === section)?.label

  const columns = [
    show.sections ? `${sizes.sections}rem` : '0rem',
    show.sections ? '0.75rem' : '0rem',
    show.editor ? (show.preview ? `${sizes.editor}rem` : 'minmax(0,1fr)') : '0rem',
    show.editor && show.preview ? '0.75rem' : '0rem',
    show.preview ? 'minmax(0,1fr)' : '0rem',
  ].join(' ')
  const pane = (visible: boolean) => `min-w-0 overflow-hidden bg-canvas lg:flex lg:flex-col ${visible ? 'flex flex-col' : 'hidden lg:invisible'}`

  return <div className={`flex flex-col bg-cream/40 lg:h-[calc(100dvh-var(--header-height))] lg:overflow-hidden ${focus ? 'overflow-hidden' : ''}`}>
    <title>Website Editor — VELTO</title>
    <header inert={focus || undefined} className="sticky top-[var(--header-height)] z-20 flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-border bg-canvas/95 px-3 py-2 backdrop-blur lg:static">
      <div className="flex items-center gap-1 border-r border-border pr-2">
        {desktop && <Toggle pressed={!sidebarCollapsed} label={sidebarCollapsed ? 'Show admin sidebar' : 'Hide admin sidebar'} onClick={toggleSidebar}>{sidebarCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</Toggle>}
        <Toggle pressed={show.sections} label="Sections panel" onClick={() => toggle('sections')}><Rows3 size={18}/></Toggle>
        <Toggle pressed={show.editor} label="Content editor" onClick={() => toggle('editor')} disabled={show.editor && !show.preview}><SquarePen size={18}/></Toggle>
        <Toggle pressed={show.preview} label="Live preview" onClick={() => toggle('preview')} disabled={show.preview && !show.editor}><PanelsTopLeft size={18}/></Toggle>
      </div>
      <label className="flex min-w-0 items-center gap-2 text-sm font-semibold"><span className="sr-only sm:not-sr-only">Page</span><select className={`${inputClass} min-h-11 w-auto`} value={slug} disabled={busy} onChange={e => {if (dirty && !window.confirm('Discard unsaved changes?')) return; setSlug(e.target.value); setSection(pageDefinitions.find(p => p.id === e.target.value)!.sections[0].id)}}>{pageDefinitions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <span role="status" className={`rounded-full px-3 py-1.5 text-xs font-semibold ${dirty ? 'bg-copper-soft text-copper' : 'bg-forest-soft text-forest'}`}>{dirty ? 'Unsaved changes' : page?.published ? 'Published' : 'Draft'}{page ? ` · v${page.version}` : ''}</span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Toggle pressed={false} label="Undo (Ctrl+Z)" onClick={undo} disabled={!stack.undo || busy}><Undo2 size={18}/></Toggle>
        <Toggle pressed={false} label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!stack.redo || busy}><Redo2 size={18}/></Toggle>
        <button type="button" className={buttonClass('ghost','sm')} onClick={openFocus} disabled={!draft}><Maximize2 size={16}/> <span className="hidden sm:inline">Full-screen preview</span></button>
        <button type="button" disabled={!draft || busy} className={buttonClass('secondary','sm')} onClick={() => void mutate('save')}><Save size={16}/> Save draft</button>
        <button type="button" disabled={!draft || busy} className={buttonClass('primary','sm')} onClick={() => void mutate('publish')}><Send size={16}/> {busy ? 'Saving…' : 'Publish'}</button>
      </div>
    </header>
    {(error || notice) && <p role={error ? 'alert' : 'status'} className={`shrink-0 px-4 py-2.5 text-sm ${error ? 'bg-danger-soft text-danger' : 'bg-forest-soft text-forest'}`}>{error || notice}</p>}
    {!draft && !error && <p role="status" className="p-8 text-muted">Loading content…</p>}
    {draft && <div
      className={`grid gap-px max-lg:gap-4 max-lg:p-3 lg:min-h-0 lg:flex-1 ${resizing ? 'select-none' : 'transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none'}`}
      style={desktop ? {gridTemplateColumns: columns} : undefined}
    >
      {/* Sections */}
      <aside aria-label="Sections" inert={!show.sections || focus || undefined} className={`${pane(show.sections)} max-lg:rounded-2xl max-lg:border max-lg:border-border`}>
        <div className={paneHead}><div><p className={eyebrow}>Sections</p><p className="text-xs text-muted">{definition.reorder ? 'Drag or use arrows to reorder' : 'Fixed page layout'}</p></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {draft.order.map((id, i) => {const s = definition.sections.find(s => s.id === id); return s && <div key={id} draggable={definition.reorder && !busy} onDragStart={() => setDragged(id)} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); if (dragged) move(dragged, i); setDragged(null)}} className={`mb-1 rounded-xl p-2 transition-colors ${section === id ? 'bg-forest-soft ring-1 ring-forest/15' : 'hover:bg-sand/60'} ${draft.hidden.includes(id) ? 'opacity-60' : ''}`}>
            <button className={`flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold ${section === id ? 'text-forest' : ''}`} onClick={() => {setSection(id); if (!show.editor) toggle('editor')}}>{definition.reorder && <GripVertical size={15} className="shrink-0 text-muted"/>} <span className="truncate">{s.label}</span></button>
            {definition.reorder && <div className="flex items-center gap-1"><label className="mr-auto flex min-h-9 items-center gap-2 text-xs"><input type="checkbox" checked={!draft.hidden.includes(id)} onChange={e => commit(d => ({...d, hidden: e.target.checked ? d.hidden.filter(x => x !== id) : [...d.hidden, id]}))}/> Visible</label><button aria-label={`Move ${s.label} up`} disabled={i === 0} className="min-h-9 px-2 disabled:opacity-30" onClick={() => move(id,i-1)}><ArrowUp size={14}/></button><button aria-label={`Move ${s.label} down`} disabled={i === draft.order.length-1} className="min-h-9 px-2 disabled:opacity-30" onClick={() => move(id,i+1)}><ArrowDown size={14}/></button></div>}
          </div>})}
        </div>
        <div className="grid shrink-0 gap-1 border-t border-border p-2">
          <button className={buttonClass('ghost','sm','w-full')} onClick={() => {void token().then(t => workspaceApi.revisions(t,slug)).then(r => {setHistory(r.revisions); setShow(s => ({...s, editor: true}))}).catch(e => setError(message(e)))}}><History size={16}/> Revision history</button>
          <button disabled={!page?.published || busy} className={buttonClass('ghost','sm','w-full')} onClick={() => void mutate('unpublish')}><EyeOff size={16}/> Unpublish overrides</button>
        </div>
      </aside>
      {desktop ? <Divider label="Resize sections panel" pane="sections" visible={show.sections && !focus} value={sizes.sections} onChange={v => setSizes(s => ({...s, sections: v}))} onDragging={setResizing}/> : <span hidden/>}

      {/* Content editor */}
      <section aria-label="Content editor" inert={!show.editor || focus || undefined} className={`${pane(show.editor)} max-lg:rounded-2xl max-lg:border max-lg:border-border`}>
        <div className={paneHead}><div className="min-w-0"><p className={eyebrow}>Editing</p><h2 className="truncate font-display text-[1.125rem]">{sectionLabel}</h2></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <p className="mb-4 text-xs text-muted">Text is safely rendered. Links accept site paths or HTTPS destinations.</p>
          <fieldset disabled={busy} className="grid gap-5">
            {fields.map(field => field.kind === 'image'
              ? <ImageField key={field.key} field={field} value={draft.fields[field.key] ?? field.value} media={media} busy={busy}
                  onBrowse={() => {void token().then(workspaceApi.media).then(r => setMedia(r.media)).catch(e => setError(message(e)))}}
                  onPick={item => pickImage(field.key, item, !!item && !item.id)} onUpload={file => uploadImage(field.key, file)}/>
              : <label key={field.key} className="block text-sm font-semibold">{field.label}
                {field.kind === 'text' ? <textarea rows={(draft.fields[field.key] ?? field.value).length > 140 ? 4 : 2} className={`${inputClass} mt-2 font-normal`} value={draft.fields[field.key] ?? field.value} onChange={e => change(field.key,e.target.value)} maxLength={6000}/> : <input className={`${inputClass} mt-2 font-normal`} value={draft.fields[field.key] ?? field.value} onChange={e => change(field.key,e.target.value)}/>}
              </label>)}
          </fieldset>
          {history && <div className="mt-8 border-t border-border pt-5"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Revision history</h3><button className={buttonClass('ghost','sm')} onClick={() => setHistory(null)}>Close</button></div><p className="mb-3 text-xs text-muted">Restoring creates a draft; it does not publish automatically.</p>{history.length === 0 ? <p>No saved revisions yet.</p> : <ul className="divide-y divide-border">{history.map(r => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span><strong className="capitalize">{r.action}</strong><span className="block text-xs text-muted">{new Date(r.createdAt).toLocaleString()} · {r.actor}</span></span><button disabled={busy} className={buttonClass('secondary','sm')} onClick={() => void mutate('restore',r.id)}>Restore draft</button></li>)}</ul>}</div>}
        </div>
      </section>
      {desktop ? <Divider label="Resize content editor" pane="editor" visible={show.editor && show.preview && !focus} value={sizes.editor} onChange={v => setSizes(s => ({...s, editor: v}))} onDragging={setResizing}/> : <span hidden/>}

      {/* Live preview: the same element becomes the full-screen view, so the frame keeps its state and scroll. */}
      <section aria-label="Live preview" inert={!show.preview || undefined} className={focus ? 'fixed inset-0 z-[80] flex flex-col bg-forest-deep' : `${pane(show.preview)} max-lg:h-[75dvh] max-lg:rounded-2xl max-lg:border max-lg:border-border`}>
        <div className={`${paneHead} ${focus ? 'border-white/10 text-white' : ''}`}>
          <div className="min-w-0"><p className={`${eyebrow} ${focus ? 'text-white/60' : ''}`}>Live preview</p><p className={`truncate text-xs ${focus ? 'text-white/70' : 'text-muted'}`}>{dirty ? 'Unsaved draft' : 'Saved draft'} · {definition.path}</p></div>
          <div className="flex items-center gap-1">
            <div role="group" aria-label="Preview device" className={`flex rounded-xl p-0.5 ${focus ? 'bg-white/10' : 'bg-sand'}`}>
              {devices.map(d => <button key={d.id} type="button" aria-pressed={device === d.id} title={d.label} aria-label={d.label} onClick={() => setDevice(d.id)} className={`grid size-10 place-items-center rounded-[0.625rem] transition-colors duration-200 ${device === d.id ? (focus ? 'bg-white text-forest-deep' : 'bg-canvas text-forest shadow-sm') : (focus ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink')}`}><d.icon size={17}/></button>)}
            </div>
            <button type="button" onClick={() => focus ? setFocus(false) : openFocus()} aria-label={focus ? 'Exit full-screen preview (Esc)' : 'Full-screen preview'} title={focus ? 'Exit full screen (Esc)' : 'Full screen'} className={`grid size-11 place-items-center rounded-xl transition-colors ${focus ? 'text-white hover:bg-white/10' : 'text-muted hover:bg-sand hover:text-ink'}`}>{focus ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
          </div>
        </div>
        <div className={`min-h-0 flex-1 p-3 ${focus ? 'bg-forest-deep' : 'bg-sand/70'}`}>
          <ContentPreview slug={slug} path={definition.path} content={draft} device={device} interactive={!resizing}/>
        </div>
      </section>
    </div>}
  </div>
}
