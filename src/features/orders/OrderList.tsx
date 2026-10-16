import AdminOrderWorkspace from './AdminOrderWorkspace.tsx'
import { useToasts } from '../ui/toastStore.ts'
import { useRef, useState } from 'react'
import { call } from '../quotes/api.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import RemoteState from '../../pages/Account/RemoteState.tsx'
import type { Order } from './schema.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'

export default function OrderList({admin=false}:{admin?:boolean}){
 const path='/api/orders'+(admin?'?admin=1':'')
 const [state,reload]=useAuthedRemote(t=>call<{orders:Order[]}>(path,{method:'GET'},t),path)
 const {getToken}=useAppAuth()
 const show=useToasts(s=>s.show)
 const pending=useRef(false)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState<string|null>(null)
 const update=async(id:string,status:string)=>{if(pending.current)return;pending.current=true;setBusy(id);setError('');try{await call(path,{method:'PATCH',body:JSON.stringify({id,status})},await getToken({skipCache:true}));show('Order status updated');reload()}catch(e){setError(e instanceof Error?e.message:'Could not update order.')}finally{pending.current=false;setBusy(null)}}
 if(admin) return <>{error&&<p role="alert" className="mb-4 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">{error}</p>}<RemoteState state={state} reload={reload}>{({orders})=><AdminOrderWorkspace orders={orders} busy={busy} update={update} reload={reload}/>}</RemoteState></>
 return <><p className="mb-5 text-muted">Cash on Delivery orders. Payment is collected on delivery.</p>{error&&<p role="alert" className="mb-4 text-danger">{error}</p>}<RemoteState state={state} reload={reload}>{({orders})=>orders.length===0?<p className="surface-card p-6">No orders yet.</p>:<ul className="space-y-5">{orders.map(o=><li key={o.id} className="surface-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{o.reference}</h2><span className="rounded-full bg-forest-soft px-3 py-2 capitalize">{o.status}</span></div><p className="mt-2 text-sm text-muted">{new Date(o.created_at).toLocaleDateString()} · {o.currency} {Number(o.total).toLocaleString()} · Cash on Delivery</p><ul className="my-4 space-y-2">{o.items.map(i=><li key={i.slug}>{i.name} × {i.quantity} — PKR {(i.unitPrice*i.quantity).toLocaleString()}</li>)}</ul><p className="text-sm">{o.customer.name} · {o.customer.phone}</p><p className="text-sm">{o.customer.address}, {o.customer.city}, {o.customer.country}</p>{admin&&<><p className="mt-1 text-sm">{o.customer.email}</p><label className="mt-4 block font-semibold" htmlFor={`status-${o.id}`}>Order status</label><select id={`status-${o.id}`} value={o.status} disabled={busy===o.id} onChange={e=>void update(o.id,e.target.value)} className={`${inputClass} mt-2 max-w-xs`}>{['placed','confirmed','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}</select></>}</li>)}</ul>}</RemoteState></>
}
