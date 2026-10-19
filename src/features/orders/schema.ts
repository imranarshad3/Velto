import { z } from 'zod'
import type { TimelineEvent } from './tracking.ts'
export const orderInput = z.object({
 requestKey: z.uuid(),
 customer: z.object({name:z.string().trim().min(2).max(120),email:z.email().max(200),phone:z.string().trim().regex(/^[+0-9 ()-]{7,25}$/),address:z.string().trim().min(10).max(500),city:z.string().trim().min(2).max(100),country:z.literal('Pakistan')}),
 items:z.array(z.object({slug:z.string().regex(/^[a-z0-9-]{1,80}$/),quantity:z.number().int().min(1).max(999)})).min(1).max(20),
 expectedTotal:z.number().positive().max(999999999),paymentMethod:z.literal('cod'),
}).strict()
export type OrderInput = z.infer<typeof orderInput>
export interface OrderItem {slug:string;name:string;quantity:number;unitPrice:number;image?:{src:string;alt?:string;width?:number;height?:number}|null}
export interface OrderTracking {number:string|null;carrier:string|null;carrierReference:string|null;estimatedDelivery:{earliest:string;latest:string;exact:boolean}|null}
export interface Order {id:string;reference:string;customer:OrderInput['customer'];items:OrderItem[];subtotal:number;delivery:number;total:number;currency:string;status:string;created_at:string;updated_at?:string;payment_method?:string;tracking?:OrderTracking;timeline?:TimelineEvent[];isOwner?:boolean}
export interface OrderActivity {kind:'status'|'update';from:string|null;to:string|null;at:string;note:string|null;notePublic:boolean;carrier:string|null;carrierReference:string|null;eta:string|null;actor:string}
export interface AdminOrder extends Order {activity:OrderActivity[]}
