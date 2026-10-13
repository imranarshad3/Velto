import type { CatalogProduct } from '../../data/catalog.ts'

type Money = { amount: number; currency: string }

function formatMoney({ amount, currency }: Money): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

/** Formatted price for verified products; null means "pricing on request". */
export function displayPrice(product: CatalogProduct): string | null {
  if (!product.verified || !product.price) return null
  return formatMoney(product.price)
}

/** Card price: the verified price, else the bundled catalogue's illustrative DEMO price (flagged `demo`). */
export function cardPrice(product: CatalogProduct): { label: string; demo: boolean } | null {
  const verified = displayPrice(product)
  if (verified) return { label: verified, demo: false }
  return product.demoPrice ? { label: formatMoney(product.demoPrice), demo: true } : null
}

/** Amount used only for client-side price sorting; products without a price sort last. */
export function sortableAmount(product: CatalogProduct): number | null {
  if (product.verified && product.price) return product.price.amount
  return product.demoPrice?.amount ?? null
}
