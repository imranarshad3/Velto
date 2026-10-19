import type { Order } from './schema.ts'

export { orderStatuses, statusLabels, type OrderStatus } from './tracking.ts'

export function visibleOrders<T extends Order>(orders: T[], search: string, status: string, sort: string, range = 'all', now = Date.now()) {
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const since = range === 'all' ? 0 : now - Number.parseInt(range, 10) * 86_400_000
  const result = orders.filter(order => {
    const haystack = [order.reference, order.tracking?.number ?? '', order.customer.name, order.customer.email, order.customer.phone, order.customer.city, ...order.items.map(item => item.name)].join(' ').toLowerCase()
    const open = status === 'open' ? order.status !== 'delivered' && order.status !== 'cancelled' : status === 'all' || order.status === status
    return open && Date.parse(order.created_at) >= since && terms.every(term => haystack.includes(term))
  })
  return result.sort((a, b) => sort === 'value' ? Number(b.total) - Number(a.total) : (Date.parse(b.created_at) - Date.parse(a.created_at)) * (sort === 'oldest' ? -1 : 1))
}

export const orderMoney = (amount: number | string) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 2 }).format(Number(amount))
export const orderDate = (value: string, withTime = false) =>
  new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}), timeZone: 'Asia/Karachi' }).format(new Date(value))
export const orderDay = (value: string) => new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(new Date(value))
export const unitsOf = (order: Order) => order.items.reduce((sum, item) => sum + item.quantity, 0)

/** Headline metrics for the admin dashboard, computed from the loaded orders. Revenue counts delivered (collected) orders only. */
export function orderMetrics(orders: Order[], now = Date.now()) {
  const day = 86_400_000
  const live = orders.filter(o => o.status !== 'cancelled')
  const delivered = orders.filter(o => o.status === 'delivered')
  const open = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const sum = (list: Order[]) => list.reduce((s, o) => s + Number(o.total), 0)
  const inWindow = (o: Order, from: number, to: number) => { const t = Date.parse(o.created_at); return t >= now - from * day && t < now - to * day }
  const last7 = live.filter(o => inWindow(o, 7, 0)).length
  const prev7 = live.filter(o => inWindow(o, 14, 7)).length
  const today = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate())
  const daily = Array.from({ length: 14 }, (_, i) => {
    const start = today - (13 - i) * day
    return { day: new Date(start).toISOString().slice(0, 10), value: live.filter(o => { const t = Date.parse(o.created_at); return t >= start && t < start + day }).length }
  })
  const byStatus = Object.fromEntries(['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map(s => [s, orders.filter(o => o.status === s).length]))
  return {
    total: orders.length,
    open: open.length,
    openValue: sum(open),
    collected: sum(delivered),
    averageValue: live.length ? sum(live) / live.length : 0,
    cancelRate: orders.length ? byStatus.cancelled / orders.length : 0,
    last7,
    prev7,
    daily,
    byStatus,
  }
}
