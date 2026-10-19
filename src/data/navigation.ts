export interface NavItem {
  label: string
  to: string
}

export const primaryNav: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products#product-results' },
  { label: 'Find Products', to: '/solutions' },
  { label: 'Shop by Area', to: '/applications' },
  { label: 'Resources', to: '/resources' },
  { label: 'About', to: '/about' },
]

export const utilityNav: NavItem[] = [
  { label: 'Help', to: '/faq' },
  { label: 'Track an Order', to: '/track' },
  { label: 'Contact', to: '/contact' },
]

/** Neutral announcement copy only. No delivery thresholds, phone numbers or order figures until confirmed. */
export const announcements: string[] = [
  'Construction chemical solutions for every build',
  'Help choosing products for each job',
  'Get a price for your project or large order',
]

export interface FooterColumn {
  title: string
  links: NavItem[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/products#product-results' },
      { label: 'Tile Adhesives', to: '/products?category=tile-adhesives#product-results' },
      { label: 'Waterproofing', to: '/products?category=waterproofing#product-results' },
      { label: 'Concrete Repair', to: '/products?category=concrete-repair#product-results' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Find Products', to: '/solutions' },
      { label: 'Shop by Area', to: '/applications' },
      { label: 'Resources', to: '/resources' },
      { label: 'Work out how much you need', to: '/resources/coverage-calculator' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'My Account', to: '/account' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Get a price', to: '/quote' },
      { label: 'Track an Order', to: '/track' },
    ],
  },
]

export const legalNav: NavItem[] = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Use', to: '/terms' },
]

/** Keep resource routes available, but hide their menu entry until launch. */
export const storefrontNav = (items: NavItem[]) => items.filter(item => !item.to.startsWith('/resources')).map(item => ({ ...item, label: item.to === '/solutions' ? 'Find Products' : item.to === '/applications' ? 'Shop by Area' : item.label }))
