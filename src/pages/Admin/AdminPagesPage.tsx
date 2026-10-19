import { editableSections } from '../../features/cms/sections.ts'
import { Link } from 'react-router'
import { pageDefinitions } from '../../features/cms/registry.ts'
import { workspaceApi } from '../../features/cms/api.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import AdminHeading from './AdminHeading.tsx'
import RemoteState from '../Account/RemoteState.tsx'
export default function AdminPagesPage() {
 const [state,reload]=useAuthedRemote(workspaceApi.pages,'cms-pages')
 return <><title>Pages & Sections — VELTO</title><AdminHeading title="Pages & Sections" crumbs={[{label:'Pages & Sections'}]}>Your website, organized into editable pages and reusable collections.</AdminHeading><RemoteState state={state} reload={reload}>{({pages})=><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{pageDefinitions.map(p=>{const saved=pages.find(s=>s.slug===p.id);const sections=editableSections(p,saved?.draft);return <Link key={p.id} to={`/admin/website?page=${p.id}`} className="surface-card p-6 transition hover:border-forest/40"><span className="mb-6 inline-block rounded-full bg-forest-soft px-3 py-1 text-xs font-semibold text-forest">{saved?.published?'Published':'Original content'}</span><h2 className="font-display text-2xl">{p.label}</h2><p className="mt-2 text-sm text-muted">{sections.length} sections · {sections.reduce((n,s)=>n+s.fields.length,0)} editable fields</p><span className="mt-6 block text-sm font-semibold text-forest">Open editor →</span></Link>})}</div>}</RemoteState></>
}
