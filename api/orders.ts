import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClerkVerifier } from '../server/quotes/auth.js'
import { apiError, bearerToken, HttpError, json, readJson } from '../server/http.js'
import { orderInput } from '../src/features/orders/schema.js'

async function handle(request:Request) {
 try {
  const env=process.env
  const url=new URL(request.url)
  const verify=createClerkVerifier({secretKey:env.CLERK_SECRET_KEY,jwtKey:env.CLERK_JWT_KEY,authorizedParties:(env.CLERK_AUTHORIZED_PARTIES??'').split(',').filter(Boolean)})
  const auth=await verify(bearerToken(request),url.origin)
  if(auth.kind!=='user')return apiError(401,'sign_in_required','Please sign in to manage your orders.')
  if(request.method!=='GET' && request.headers.get('origin') && ![url.origin,...(env.ALLOWED_ORIGINS??'').split(',')].includes(request.headers.get('origin')!))return apiError(403,'origin','This request is not allowed.')
  const secret=env.SUPABASE_SECRET_KEY??env.SUPABASE_SERVICE_ROLE_KEY
  if(!env.SUPABASE_URL||!secret)return apiError(503,'unavailable','Ordering is temporarily unavailable.')
  const db=createClient(env.SUPABASE_URL,secret,{auth:{persistSession:false}})
  const admin=url.searchParams.get('admin')==='1'
  if(admin){const {data,error}=await db.from('admin_members').select('clerk_user_id').eq('clerk_user_id',auth.userId).maybeSingle();if(error||!data)return apiError(403,'forbidden','Admin access required.')}
  if(request.method==='GET'){
   let query=db.from('orders').select('id,reference,customer,items,subtotal,delivery,total,currency,status,created_at').order('created_at',{ascending:false}).limit(100)
   if(!admin)query=query.eq('clerk_user_id',auth.userId)
   const {data,error}=await query;if(error)throw new Error('orders_read');return json({orders:data})
  }
  if(request.method==='PATCH'&&admin){
   const parsed=z.object({id:z.uuid(),status:z.enum(['placed','confirmed','shipped','delivered','cancelled'])}).strict().safeParse(await readJson(request,2048))
   if(!parsed.success)return apiError(422,'invalid','Choose a valid order status.')
   const {data,error}=await db.rpc('update_cod_order',{p_actor:auth.userId,p_id:parsed.data.id,p_status:parsed.data.status})
   if(error)throw new Error('orders_update');return data?json({ok:true}):apiError(404,'not_found','Order not found.')
  }
  if(request.method==='POST'&&!admin){
   const parsed=orderInput.safeParse(await readJson(request,16000));if(!parsed.success)return apiError(422,'invalid','Check your delivery details and quantities.')
   const p=parsed.data
   const {data,error}=await db.rpc('place_cod_order',{p_user:auth.userId,p_key:p.requestKey,p_customer:p.customer,p_items:p.items,p_expected:p.expectedTotal})
   if(error){if(/price_changed|product_unavailable/.test(error.message))return apiError(409,'cart_changed','A price or product changed. Refresh your cart before ordering.');if(/order_limit/.test(error.message))return apiError(429,'order_limit','Daily order limit reached. Please contact us.');throw new Error('orders_create')}
   return json({order:data},201)
  }
  return apiError(405,'method','Method not allowed.')
 }catch(e){if(e instanceof HttpError)return apiError(e.status,e.code,e.message);return apiError(503,'unavailable','Orders are temporarily unavailable. Your cart is saved; please retry.')}
}
export const GET=handle
export const POST=handle
export const PATCH=handle
