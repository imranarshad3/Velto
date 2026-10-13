import { Link } from 'react-router'
import LegalLayout, { type LegalSection } from './LegalLayout.tsx'

const sections: LegalSection[] = [
  { id: 'about', title: 'About these terms', body: <p>These terms apply to your use of the VELTO website. By using the site you agree to them.</p> },
  {
    id: 'information',
    title: 'Product information',
    body: (
      <>
        <p>Listings marked <strong>DEMO</strong> describe product types and use illustrative images; they are not verified product specifications or photographs.</p>
        <p>Always follow the manufacturer’s technical data sheet and safety information when using any product. Application guidance on this site is general and does not replace professional advice for your specific project.</p>
      </>
    ),
  },
  {
    id: 'quotes',
    title: 'Quotes and orders',
    body: (
      <ul>
        <li>A quote request is an enquiry, not an order. Nothing is reserved or charged when you send one.</li>
        <li>Prices, availability and delivery are only agreed when we confirm them to you in writing.</li>
        <li>Online payment is not currently offered on this site.</li>
      </ul>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts',
    body: <p>Keep your sign-in details secure and let us know if you suspect misuse. We may suspend accounts used to abuse the site.</p>,
  },
  {
    id: 'use',
    title: 'Acceptable use',
    body: <p>Do not attempt to disrupt the site, access other people’s information, send spam or automated requests, or misuse forms.</p>,
  },
  {
    id: 'ip',
    title: 'Trademarks and content',
    body: <p>ULTRA Chemicals names and marks belong to their owner. Site content may not be copied for commercial use without permission.</p>,
  },
  {
    id: 'liability',
    title: 'Liability',
    body: <p>We work to keep information accurate, but the site is provided as-is. Nothing in these terms limits rights you have by law.</p>,
  },
  {
    id: 'privacy',
    title: 'Privacy',
    body: (
      <p>
        How we handle personal information is described in our <Link to="/privacy" className="font-semibold text-forest underline">Privacy Policy</Link>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return <LegalLayout title="Terms of Use" updated="13 October 2026" intro={<p>Please read these terms before using the site or sending a request.</p>} sections={sections} />
}
