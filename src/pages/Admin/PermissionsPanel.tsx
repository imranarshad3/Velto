import { useState } from 'react'
import { workspaceApi } from '../../features/cms/api.ts'
import type { WorkspaceRole } from '../../features/cms/types.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import RemoteState from '../Account/RemoteState.tsx'
import { Panel } from './ui.tsx'
export default function PermissionsPanel() {
 const {getToken,user}=useAppAuth(),[state,reload]=useAuthedRemote(workspaceApi.roles,'workspace-roles')
 const [error,setError]=useState(''),[busy,setBusy]=useState(false)
 const update=async(id:string,role:WorkspaceRole)=>{if(!window.confirm(`Change this team member to ${role}?`))return;setBusy(true);setError('');try{const t=await getToken();if(!t)throw new Error('Please sign in again.');await workspaceApi.setRole(t,id,role);reload()}catch(e){setError(e instanceof Error?e.message:'Could not save permissions.')}finally{setBusy(false)}}
 return <Panel title="Team permissions" description="Administrators manage the workspace. Editors manage content and products. Sales staff manage customers, quotes and messages." className="mt-6"><p className="mb-4 text-sm text-muted">Invite members through Team first. Another administrator must change your own role.</p>{error&&<p role="alert" className="mb-4 text-danger">{error}</p>}<RemoteState state={state} reload={reload}>{({members})=><ul className="divide-y divide-border">{members.map(m=><li key={m.clerkUserId} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="min-w-0 truncate text-sm">{m.note??m.clerkUserId}{m.clerkUserId===user?.id?' (you)':''}</span><select aria-label={`Role for ${m.note??m.clerkUserId}`} disabled={busy||m.clerkUserId===user?.id} value={m.role} className={`${inputClass} w-auto`} onChange={e=>void update(m.clerkUserId,e.target.value as WorkspaceRole)}><option value="admin">Administrator</option><option value="editor">Content editor</option><option value="sales">Sales staff</option></select></li>)}</ul>}</RemoteState></Panel>
}
