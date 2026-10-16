import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import PageHeader from '../../components/ui/PageHeader.tsx'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { useCart } from '../../features/cart/cartStore.ts'
import { useCatalog } from '../../features/catalog/catalogContext.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { call } from '../../features/quotes/api.ts'
import { orderInput, type OrderInput, type Order } from '../../features/orders/schema.ts'

const money=(n:number)=>new Intl.NumberFormat('en-PK',{style:'currency',currency:'PKR',maximumFractionDigits:2}).format(n)
export default function CheckoutPage(){
 const [params]=useSearchParams()
 const auth=useAppAuth()
 const {find,status}=useCatalog()
 const cart=useCart(s=>s.items)
 const direct=params.get('product')
 const qty=Math.min(999,Math.max(1,Math.floor(Number(params.get('qty'))||1)))
 const selected=direct?[{slug:direct,quantity:qty}]:cart
 const lines=selected.map(i=>({product:find(i.slug),slug:i.slug,quantity:i.quantity??1}))
 const valid=lines.length>0&&lines.every(l=>l.product?.verified&&l.product.price?.currency==='PKR'&&l.product.price.amount>0&&Number.isInteger(l.quantity)&&l.quantity>=1&&l.quantity<=999)
 const total=lines.reduce((sum,l)=>sum+(l.product?.price?.amount??0)*l.quantity,0)+300
 const [order,setOrder]=useState<Order|null>(null)
 const [error,setError]=useState('')
 const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm<OrderInput['customer']>({resolver:zodResolver(orderInput.shape.customer),defaultValues:{country:'Pakistan',name:auth.user?.name??'',email:auth.user?.email??''}})
 const submit=handleSubmit(async customer=>{
  setError('')
  try{
   const token=await auth.getToken({skipCache:true});if(!token)throw Error('Please sign in again.')
   const payload={customer,items:lines.map(l=>({slug:l.slug,quantity:l.quantity})),expectedTotal:total,paymentMethod:'cod'}
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))).map(n=>n.toString(16).padStart(2,'0')).join('')
   const storageKey='velto-order-attempt-'+auth.user?.id+'-'+hash
   const requestKey=sessionStorage.getItem(storageKey)||crypto.randomUUID()
   sessionStorage.setItem(storageKey,requestKey)
   const result=await call<{order:Order}>('/api/orders',{method:'POST',body:JSON.stringify({...payload,requestKey})},token)
   sessionStorage.removeItem(storageKey)
   setOrder(result.order)
   if(!direct)for(const l of lines){const current=useCart.getState().items.find(i=>i.slug===l.slug);if((current?.quantity??1)===l.quantity)useCart.getState().remove(l.slug)}
  }catch(e){setError(e instanceof Error?e.message:'Could not place your order. Please retry.')}
 })
 return <><title>Checkout — VELTO</title><PageHeader eyebrow="Cash on delivery" title="Checkout" crumbs={[{label:'Cart',to:'/cart'},{label:'Checkout'}]}/><div className="container-page py-10">
 {order?<section className="surface-card mx-auto max-w-2xl p-6" role="status"><h2 className="font-display text-3xl">Thank you. Your order is placed.</h2><p className="mt-4">Order <strong>{order.reference}</strong></p><p className="mt-2">Pay {money(Number(order.total))} on delivery.</p><p className="mt-2">Delivery address: {order.customer.address}, {order.customer.city}</p><ButtonLink to="/account/orders" className="mt-6">View my orders</ButtonLink></section>:
 !auth.loaded||status==='loading'?<p role="status">Loading checkout…</p>:
 !auth.signedIn?<section className="surface-card mx-auto max-w-xl p-6"><h2 className="font-display text-2xl">Sign in to complete your purchase</h2><p className="my-4">Your cart is saved. Track your order from your account after checkout.</p><ButtonLink to={`/sign-in?redirect_url=${encodeURIComponent('/checkout'+(direct?'?'+params.toString():''))}`}>Sign in to buy</ButtonLink></section>:
 !valid?<section className="surface-card p-6"><h2 className="font-display text-2xl">Check your cart</h2><p className="my-4">Choose available products with confirmed prices and quantities from 1 to 999.</p><ButtonLink to="/cart">Back to cart</ButtonLink></section>:
 <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><form onSubmit={submit} className="surface-card p-5 sm:p-8"><h2 className="font-display text-2xl">Delivery details</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">
 {([['name','Full name','name'],['email','Email','email'],['phone','Phone number','tel'],['address','Street address','street-address'],['city','City','address-level2']] as const).map(([key,label,auto])=><div key={key} className={key==='address'?'sm:col-span-2':''}><label htmlFor={`order-${key}`} className="mb-2 block font-semibold">{label}</label><input id={`order-${key}`} {...register(key)} autoComplete={auto} type={key==='email'?'email':key==='phone'?'tel':'text'} className={inputClass} aria-invalid={!!errors[key]}/>{errors[key]&&<p role="alert" className="mt-1 text-sm text-danger">{errors[key]?.message}</p>}</div>)}
 </div><p className="mt-5 text-sm text-muted">Country: Pakistan</p><h3 className="mt-8 font-semibold">Payment method</h3><label className="mt-3 flex min-h-12 items-center gap-3 rounded-xl border border-forest bg-forest-soft p-4"><input type="radio" checked readOnly name="payment"/>Cash on Delivery — pay when your order arrives</label><p className="mt-3 text-sm text-muted">Online payment is not available yet.</p>{error&&<p role="alert" className="mt-5 text-danger">{error}</p>}<button disabled={isSubmitting} className={buttonClass('primary','lg','mt-6 w-full')}>{isSubmitting?'Placing your order…':`Place order · ${money(total)}`}</button></form>
 <aside className="surface-card h-fit p-6"><h2 className="font-display text-2xl">Order summary</h2><ul className="my-5 space-y-4">{lines.map(l=><li key={l.slug} className="flex gap-3">{l.product?.image&&<img src={l.product.image.src} alt="" className="size-16 shrink-0 rounded-lg bg-cream object-contain p-1"/>}<span className="min-w-0 flex-1">{l.product?.name}<small className="block text-muted">Quantity: {l.quantity}</small><strong>{money(l.product!.price!.amount*l.quantity)}</strong></span></li>)}</ul><dl className="space-y-3 border-t border-border pt-4"><div className="flex justify-between"><dt>Products</dt><dd>{money(total-300)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{money(300)}</dd></div><div className="flex justify-between font-bold"><dt>Pay on delivery</dt><dd>{money(total)}</dd></div></dl></aside></div>}
 </div></>
}
