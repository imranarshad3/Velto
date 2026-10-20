import { z } from 'zod'
import type { TimelineEvent } from './tracking.ts'

export const orderInput = z.object({
  requestKey: z.uuid('Your checkout session expired. Refresh the page and try again.'),
  customer: z.object({
    name: z.string({ error: 'Enter your full name.' }).trim()
      .min(2, 'Enter your full name (at least 2 characters).')
      .max(120, 'Your name must be 120 characters or fewer.'),
    email: z.string({ error: 'Enter your email address.' }).trim()
      .min(1, 'Enter your email address.')
      .max(200, 'Your email address must be 200 characters or fewer.')
      .pipe(z.email('Enter a valid email address, like name@example.com.')),
    phone: z.string({ error: 'Enter your phone number.' }).trim()
      .regex(/^(?=.*\d)[+0-9 ()-]{7,25}$/, 'Enter a phone number using 7–25 characters. You may use digits, +, spaces, parentheses, and hyphens.'),
    address: z.string({ error: 'Enter your street address.' }).trim()
      .min(10, 'Enter your street address (at least 10 characters).')
      .max(500, 'Your street address must be 500 characters or fewer.'),
    city: z.string({ error: 'Enter your city.' }).trim()
      .min(2, 'Enter your city (at least 2 characters).')
      .max(100, 'Your city must be 100 characters or fewer.'),
    country: z.literal('Pakistan', { error: 'Delivery is currently available in Pakistan only.' }),
  }),
  items: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9-]{1,80}$/, 'This product could not be identified. Refresh your cart and try again.'),
    quantity: z.number().int('Choose a whole-number quantity.')
      .min(1, 'Choose a quantity of at least 1.')
      .max(999, 'For larger orders, contact us for a project quote.'),
  })).min(1, 'Your cart is empty. Add a product before checking out.')
    .max(20, 'Checkout supports up to 20 products at a time. Contact us for a larger order.'),
  expectedTotal: z.number().positive('Your order total must be greater than zero.')
    .max(999999999, 'Your order total is too large. Contact us for help.'),
  paymentMethod: z.literal('cod', { error: 'Choose cash on delivery to continue.' }),
}).strict()

export type OrderInput = z.infer<typeof orderInput>
export interface OrderItem {slug:string;name:string;quantity:number;unitPrice:number;image?:{src:string;alt?:string;width?:number;height?:number}|null}
export interface OrderTracking {number:string|null;carrier:string|null;carrierReference:string|null;estimatedDelivery:{earliest:string;latest:string;exact:boolean}|null}
export interface Order {id:string;reference:string;customer:OrderInput['customer'];items:OrderItem[];subtotal:number;delivery:number;total:number;currency:string;status:string;created_at:string;updated_at?:string;payment_method?:string;tracking?:OrderTracking;timeline?:TimelineEvent[];isOwner?:boolean}
export interface OrderActivity {kind:'status'|'update';from:string|null;to:string|null;at:string;note:string|null;notePublic:boolean;carrier:string|null;carrierReference:string|null;eta:string|null;actor:string}
export interface AdminOrder extends Order {activity:OrderActivity[]}
