import { useEffect, useState } from 'react'
import { ImagePlus, Search, Trash2 } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { workspaceApi } from '../../features/cms/api.ts'
import { prepareImage } from '../../features/cms/image.ts'
import type { Media } from '../../features/cms/types.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import AdminHeading from './AdminHeading.tsx'
import { Panel } from './ui.tsx'
export default function AdminMediaPage() {
  const {getToken} = useAppAuth()
  const [items,setItems] = useState<Media[]>([]), [error,setError] = useState(''), [notice,setNotice] = useState(''), [busy,setBusy] = useState(false)
  const [query,setQuery] = useState(''), [folder,setFolder] = useState(''), [file,setFile] = useState<File | null>(null)
  const [crop,setCrop] = useState<'original'|'square'|'wide'>('original'), [focusX,setFocusX] = useState(50), [focusY,setFocusY] = useState(50)
  const [prepared,setPrepared] = useState<{base64:string;preview:string} | null>(null)
  const [selected,setSelected] = useState<Media | null>(null)
  const [name,setName] = useState(''), [alt,setAlt] = useState(''), [assetFolder,setAssetFolder] = useState(''), [tags,setTags] = useState('')
  const token = async () => {const t = await getToken(); if (!t) throw new Error('Please sign in again.'); return t}
  const reload = async () => setItems((await workspaceApi.media(await token())).media)
  useEffect(() => {let active = true; void getToken().then(t => t ? workspaceApi.media(t) : Promise.reject(new Error('Please sign in again.'))).then(r => {if(active) setItems(r.media)}).catch(e => {if(active)setError(e.message)}); return () => {active=false}},[getToken])
  useEffect(() => {let active=true;setPrepared(null);if(file) void prepareImage(file,crop,focusX,focusY).then(r => {if(active)setPrepared(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[file,crop,focusX,focusY])
  const save = async () => {
    setBusy(true);setError('');setNotice('')
    try {const metadata={name,alt,folder:assetFolder,tags:tags.split(',').map(s=>s.trim()).filter(Boolean)};if(selected){await workspaceApi.updateMedia(await token(),selected.id,metadata);if(prepared)await workspaceApi.replaceMedia(await token(),selected.id,prepared.base64)}else {if(!prepared)throw new Error('Choose an image first.');await workspaceApi.upload(await token(),metadata,prepared.base64)};await reload();setFile(null);setPrepared(null);setSelected(null);setNotice(selected&&prepared?'Image replaced everywhere it is used.':'Media saved. Select it from the Website Editor or product editor to use it.')}catch(e){setError(e instanceof Error?e.message:'Could not save media.')}finally{setBusy(false)}
  }
  const remove = async (item:Media) => {if(!window.confirm(`Delete ${item.name}? Referenced images are protected.`))return;setBusy(true);setError('');try{await workspaceApi.deleteMedia(await token(),item.id);await reload();if(selected?.id===item.id)setSelected(null);setNotice('Image deleted.')}catch(e){setError(e instanceof Error?e.message:'Could not delete image.')}finally{setBusy(false)}}
  return <>
    <title>Media Library — VELTO</title><AdminHeading title="Media Library" crumbs={[{label:'Media Library'}]}>One place for storefront photography. Upload, crop, organize, and reuse.</AdminHeading>
    {error&&<p role="alert" className="mb-4 rounded-xl bg-danger-soft p-4 text-danger">{error}</p>}{notice&&<p role="status" className="mb-4 rounded-xl bg-forest-soft p-4 text-forest">{notice}</p>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div><div className="mb-4 flex flex-wrap items-center gap-3"><Search size={18}/><input aria-label="Search media" className={`${inputClass} flex-1`} placeholder="Search name, alt text or tags" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter folder" className={`${inputClass} w-auto`} value={folder} onChange={e=>setFolder(e.target.value)}><option value="">All folders</option>{[...new Set(items.map(m=>m.folder).filter(Boolean))].map(f=><option key={f}>{f}</option>)}</select></div>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{items.filter(m=>(!folder||m.folder===folder)&&[m.name,m.alt,...m.tags].some(v=>v.toLowerCase().includes(query.toLowerCase()))).map(item=><article key={item.id} className="surface-card overflow-hidden"><button className="w-full text-left" onClick={()=>{setSelected(item);setFile(null);setName(item.name);setAlt(item.alt);setAssetFolder(item.folder);setTags(item.tags.join(', '))}}><img src={item.url} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full bg-sand object-cover"/><span className="block truncate px-4 pt-3 font-semibold">{item.name}</span><span className="block px-4 pb-3 text-xs text-muted">{item.folder||'Unfiled'} · {Math.round(item.size/1024)} KB</span></button><button disabled={busy} aria-label={`Delete ${item.name}`} className={buttonClass('ghost','sm','mx-2 mb-2')} onClick={()=>void remove(item)}><Trash2 size={15}/> Delete</button></article>)}</div>{items.length===0&&<p className="surface-card p-10 text-center text-muted">Upload the first image to start your library.</p>}</div>
      <Panel title={selected?'Image details':'Upload image'} description="JPEG, PNG or WebP · up to 12 MB. Optimized to WebP, at most 1920 px and 2 MB.">
        <fieldset disabled={busy} className="grid gap-4">
          <label className="text-sm font-semibold">{selected?'Replace image file (keeps its URL and every reference)':'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" className={`${inputClass} mt-2`} onChange={e=>{const f=e.target.files?.[0];if(f){setFile(f);if(!selected)setName(f.name.replace(/\.[^.]+$/,''));setError('')}}}/></label>
          {file&&<><label className="text-sm">Crop<select className={inputClass} value={crop} onChange={e=>setCrop(e.target.value as typeof crop)}><option value="original">Original proportions</option><option value="square">Square</option><option value="wide">Wide · 16:9</option></select></label>{crop!=='original'&&<><label className="text-xs">Horizontal focus<input aria-label="Horizontal crop focus" type="range" min="0" max="100" value={focusX} onChange={e=>setFocusX(+e.target.value)} className="w-full"/></label><label className="text-xs">Vertical focus<input aria-label="Vertical crop focus" type="range" min="0" max="100" value={focusY} onChange={e=>setFocusY(+e.target.value)} className="w-full"/></label></>}{prepared&&<img src={prepared.preview} alt="Crop preview" className="max-h-56 w-full rounded-xl object-contain"/>}</>}
          <label className="text-sm font-semibold">Name<input className={`${inputClass} mt-2`} value={name} maxLength={120} onChange={e=>setName(e.target.value)}/></label>
          <label className="text-sm font-semibold">Alt text<textarea className={`${inputClass} mt-2`} value={alt} maxLength={300} onChange={e=>setAlt(e.target.value)}/></label>
          <label className="text-sm font-semibold">Folder<input className={`${inputClass} mt-2`} value={assetFolder} maxLength={60} onChange={e=>setAssetFolder(e.target.value)}/></label>
          <label className="text-sm font-semibold">Tags, separated by commas<input className={`${inputClass} mt-2`} value={tags} onChange={e=>setTags(e.target.value)}/></label>
          <button disabled={!name.trim()||(!selected&&!prepared)} className={buttonClass()} onClick={()=>void save()}><ImagePlus size={17}/>{busy?'Saving…':selected?(prepared?'Replace image':'Save details'):'Upload image'}</button>
        </fieldset>
      </Panel>
    </div>
  </>
}
