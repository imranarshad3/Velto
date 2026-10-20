import { z } from 'zod'
import type { TimelineEvent } from './tracking.ts'

export const orderInput = z.object({
  requestKey: z.uuid('Your checkout session expired. Refresh the page and try again.'),
  customer: z.object({
    name: z.string({ error: 'Enter your full name.' }).trim()
      .min(2, 'Please enter your full name.')
      .max(120, 'Your name must be 120 characters or fewer.'),
    email: z.string({ error: 'Enter your email address.' }).trim()
      .min(1, 'Enter your email address.')
      .max(200, 'Your email address must be 200 characters or fewer.')
      .pipe(z.email('Enter a valid email address, like name@example.com.')),
    phone: z.string({ error: 'Please enter a phone number we can reach you on.' }).trim()
      .min(1, 'Please enter a phone number we can reach you on.')
      .pipe(z.string().regex(/^(?=.*\d)[+0-9 ()-]{7,25}$/, 'Check your phone number, for example 0300 1234567.')),
    address: z.string({ error: 'Enter your street address.' }).trim()
      .min(1, 'Please enter your delivery address.')
      .pipe(z.string()
        .min(10, 'Add your house or building number, street and area so we can find you.')
        .max(500, 'Please shorten your address and keep the house, street and area details.')),
    city: z.string({ error: 'Enter your city.' }).trim()
      .min(2, 'Please enter your city name.')
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
