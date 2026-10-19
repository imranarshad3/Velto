/** Store process FAQs: how VELTO works today. No product, delivery-time or pricing claims. */
export interface FaqGroup {
  id: string
  title: string
  items: { q: string; a: string }[]
}

export const faqGroups: FaqGroup[] = [
  {
    id: 'quotes',
    title: 'Prices and orders',
    items: [
      { q: 'How do I order?', a: 'Add products to your cart or choose them in the price request form. We’ll reply with the price and availability, then arrange the order with you.' },
      { q: 'Why can’t I pay on the website?', a: 'Online payment will be available once prices and a secure payment service are ready. For now, we arrange every order by request.' },
      { q: 'Can I request several products at once?', a: 'Yes. You can ask for prices on up to 20 products at once. You can also add how much you need.' },
      { q: 'How do I track my request?', a: 'If you have an account, find it under My price requests. Otherwise, use the reference number and code we show after you send your request.' },
      { q: 'I lost my tracking code.', a: 'For your security, we only show the code once. If you lose it, contact us with your reference number and email address.' },
    ],
  },
  {
    id: 'products',
    title: 'Products and guides',
    items: [
      { q: 'Are the product photos and details final?', a: 'Not yet. Items marked DEMO are examples, not final products. We’ll add confirmed product details and photos when they are ready.' },
      { q: 'Where can I find technical data sheets?', a: 'We add confirmed product guides to each product page. Until then, ask us for a copy using the price request or contact form.' },
      { q: 'Which product is right for my project?', a: 'Tell us what area you are working on in your price request and we’ll help you choose products. Visit Shop by Area to see common jobs.' },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    items: [
      { q: 'Do you deliver?', a: 'Delivery options, areas and charges depend on your order and location. We’ll confirm them with your price.' },
    ],
  },
  {
    id: 'account',
    title: 'Accounts and privacy',
    items: [
      { q: 'Do I need an account?', a: 'No. You can ask for a price without an account. With an account, you can see your requests and saved products on your devices.' },
      { q: 'Is my guest request linked to my account later?', a: 'No. For your security, we don’t link requests to an account just because the email is the same.' },
      { q: 'How is my information used?', a: 'We use it to reply to you and manage your account. See our Privacy Policy for details.' },
    ],
  },
]
