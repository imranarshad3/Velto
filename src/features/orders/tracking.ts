/** Order fulfilment model shared by the API and the UI (no runtime dependencies). */
export const orderStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof orderStatuses)[number]

/** The delivery journey, in order. `cancelled` sits outside it. */
export const fulfilmentSteps = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] as const

export const statusLabels: Record<string, string> = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  processing: 'Preparing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const statusDescriptions: Record<string, string> = {
  placed: 'We received your order and will confirm it shortly.',
  confirmed: 'Your order is confirmed and scheduled for preparation.',
  processing: 'Your materials are being picked, packed and checked.',
  shipped: 'Your order has left our warehouse.',
  out_for_delivery: 'Your order is on its way to your address today.',
  delivered: 'Your order was delivered. Payment collected on delivery.',
  cancelled: 'This order was cancelled. No payment is due.',
}

/** What a customer should expect next, without promising an unconfirmed delivery time. */
export const nextUpdateDescriptions: Record<string, string> = {
  placed: 'Your order is waiting for confirmation.',
  confirmed: 'Your order is scheduled for preparation.',
  processing: 'Shipment details will appear here when your order ships.',
  shipped: 'Use the tracking ID and courier details below to follow the shipment.',
  out_for_delivery: 'Keep your phone nearby in case the courier needs delivery directions.',
  delivered: 'Your order is complete.',
  cancelled: 'This order is closed. No payment is due.',
}

export const isTerminal = (status: string) => status === 'delivered' || status === 'cancelled'
export const stepIndex = (status: string) => (fulfilmentSteps as readonly string[]).indexOf(status)

/** Statuses an admin may move an order to next: any later step, or cancel while it is still open. */
export function nextStatuses(status: string): OrderStatus[] {
  if (isTerminal(status)) return []
  const i = stepIndex(status)
  return [...fulfilmentSteps.slice(i + 1), 'cancelled'] as OrderStatus[]
}

/** Progress through the journey from 0 to 1 (cancelled reads as 0). */
export const progressOf = (status: string) => (status === 'cancelled' ? 0 : Math.max(0, stepIndex(status)) / (fulfilmentSteps.length - 1))

/** Raw history entry as stored in `orders.status_history`. */
export interface HistoryEvent {
  kind?: 'status' | 'update'
  actor?: string
  from?: string
  to?: string
  at: string
  note?: string
  public?: boolean
  carrier?: string
  carrierReference?: string
  tracking?: string
  eta?: string
}

/** Customer-safe timeline entry: no staff identities, no internal notes. */
export interface TimelineEvent {
  status: string
  at: string
  note?: string
}

export function customerTimeline(createdAt: string, history: HistoryEvent[] = []): TimelineEvent[] {
  const events: TimelineEvent[] = [{ status: 'placed', at: createdAt }]
  for (const e of Array.isArray(history) ? history : []) {
    if (!e || typeof e.at !== 'string') continue
    const note = e.public && typeof e.note === 'string' ? e.note : undefined
    const statusChange = (e.kind ?? 'status') === 'status' && typeof e.to === 'string' && e.to !== e.from
    if (statusChange) events.push({ status: e.to as string, at: e.at, ...(note ? { note } : {}) })
    else if (note) events.push({ status: e.to ?? e.from ?? 'placed', at: e.at, note })
  }
  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
}

/** Latest time each journey step was reached (for the step tracker). */
export function stepTimes(timeline: TimelineEvent[]) {
  const times: Record<string, string> = {}
  for (const e of timeline) times[e.status] = e.at
  return times
}

/** A delivery estimate is shown only after an administrator schedules one. */
export function deliveryWindow(estimated?: string | null) {
  if (!estimated) return null
  return { earliest: estimated, latest: estimated, exact: true }
}

export const REFERENCE_PATTERN = /^VEL-[A-Z0-9]{16}$/
export const TRACKING_PATTERN = /^VT[A-Z0-9]{10}$/
