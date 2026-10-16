import type { Order } from './schema.ts'

export const orderStatuses = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = typeof orderStatuses[number]
export const statusLabels: Record<string, string> = { placed: 'New order', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
export function visibleOrders(orders: Order[], search: string, status: string, sort: string) {
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const result = orders.filter(order => {
    const haystack = [order.reference, order.customer.name, order.customer.email, order.customer.phone, order.customer.city, ...order.items.map(item => item.name)].join(' ').toLowerCase()
    return (status === 'all' || order.status === status) && terms.every(term => haystack.includes(term))
  })
  return result.sort((a, b) => sort === 'value' ? Number(b.total) - Number(a.total) : (Date.parse(b.created_at) - Date.parse(a.created_at)) * (sort === 'oldest' ? -1 : 1))
}
export const orderMoney = (amount: number | string) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(Number(amount))
