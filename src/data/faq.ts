/** Store process FAQs: how VELTO works today. No product, delivery-time or pricing claims. */
export interface FaqGroup {
  id: string
  title: string
  items: { q: string; a: string }[]
}

export const faqGroups: FaqGroup[] = [
  {
    id: 'quotes',
    title: 'Quotes & ordering',
    items: [
      { q: 'How do I buy products?', a: 'Add products to your cart (or choose them in the quote form) and send a quote request. We reply with pricing and availability, and arrange the order with you directly.' },
      { q: 'Why can’t I pay online?', a: 'Online checkout opens once verified prices and a secure payment provider are in place. Until then, every order is arranged through a quote.' },
      { q: 'Can I request several products at once?', a: 'Yes. A quote request can include up to 20 products, each with an optional quantity and unit.' },
      { q: 'How do I track my request?', a: 'Signed-in customers see every request in My quotes. Guests can use the Track a Request page with the reference and tracking code shown after submitting.' },
      { q: 'I lost my tracking code.', a: 'For security the code is shown only once and is not stored in a readable form. Contact us with your reference and the email you used, and we will help.' },
    ],
  },
  {
    id: 'products',
    title: 'Products & information',
    items: [
      { q: 'Are the product photos and details final?', a: 'Not yet. Listings marked DEMO are product types with illustrative images. Verified ULTRA Chemicals product details, photos and documents will replace them as they are confirmed.' },
      { q: 'Where can I find technical data sheets?', a: 'Verified documents appear on each product page and in Technical Documents as they are published. Until then, ask for them in a quote request or through the contact form.' },
      { q: 'Which product is right for my project?', a: 'Describe the surfaces and the job in your quote request and we will suggest suitable products. The Solutions and Applications pages give a general overview.' },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    items: [
      { q: 'Do you deliver?', a: 'Delivery options, areas and charges depend on the order and location, and are confirmed in your quote.' },
    ],
  },
  {
    id: 'account',
    title: 'Accounts & privacy',
    items: [
      { q: 'Do I need an account?', a: 'No. You can request quotes as a guest. An account lets you see all your requests and keep your wishlist across devices.' },
      { q: 'Is my guest request linked to my account later?', a: 'Not automatically. For security, requests are never linked just because the email matches.' },
      { q: 'How is my information used?', a: 'Only to respond to your requests and run your account. See the Privacy Policy for details.' },
    ],
  },
]
