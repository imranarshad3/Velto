import { Link } from 'react-router'
import LegalLayout, { type LegalSection } from './LegalLayout.tsx'

/** Reflects the data handling actually implemented in this codebase (M05–M08). Keep in sync with changes. */
const sections: LegalSection[] = [
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <p>We collect only what you give us and what is needed to run the site securely:</p>
        <ul>
          <li><strong>Price requests:</strong> your name, email, phone, optional company, the products and quantities you choose, project type, city or region, optional site/area, your project description, and when you agreed to send it.</li>
          <li><strong>Contact messages:</strong> your name, email, optional phone, topic and message.</li>
          <li><strong>Accounts:</strong> if you create one, Clerk handles sign-in and processes your name, email and sign-in details. We store your account ID with your price requests and saved products.</li>
          <li><strong>Wishlist and cart:</strong> saved in your browser’s local storage; if you are signed in, your wishlist is also saved to your account.</li>
          <li><strong>Security data:</strong> to prevent abuse we count requests using a keyed one-way hash of your IP address or account ID. We do not store raw IP addresses for this purpose.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use it',
    body: (
      <ul>
        <li>To respond to your price requests and messages, and to arrange orders you agree to.</li>
        <li>To run your account, show your request history and keep your saved products.</li>
        <li>To protect the site against spam and misuse.</li>
      </ul>
    ),
  },
  {
    id: 'tracking-codes',
    title: 'Guest tracking codes',
    body: <p>When you send a request as a guest you receive a tracking code. We store only a keyed one-way hash of it, so we cannot recover the code. Anyone holding both your reference and code can see the status of that request, so keep them private.</p>,
  },
  {
    id: 'sharing',
    title: 'Service providers',
    body: (
      <>
        <p>We do not sell your information. We use service providers to operate the site:</p>
        <ul>
          <li>Clerk — account sign-in and session management.</li>
          <li>Supabase — database hosting for price requests, messages and saved products.</li>
          <li>Vercel — website hosting.</li>
          <li>Google Fonts — web fonts; your browser requests fonts from Google’s servers.</li>
          <li>Cloudflare Turnstile — bot checks on forms, if enabled.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and local storage',
    body: <p>We do not use advertising or analytics cookies. If you sign in, our authentication provider sets the cookies needed to keep you signed in. Your cart and wishlist use your browser’s local storage, which you can clear at any time.</p>,
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: <p>We keep requests and messages only as long as needed to handle them and meet record-keeping obligations. Specific retention periods will be set out here after review.</p>,
  },
  {
    id: 'rights',
    title: 'Your choices',
    body: (
      <p>
        You can ask to see, correct or delete your information through the <Link to="/contact" className="font-semibold text-forest underline">contact form</Link>. Signed-in customers can update
        their profile and sign-in details from <Link to="/account/profile" className="font-semibold text-forest underline">Profile &amp; security</Link>.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: <p>We will update this page when our practices change and show the date of the latest update at the top.</p>,
  },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="13 October 2026"
      intro={<p>This policy explains what information VELTO collects when you use this website, why we collect it and how it is protected.</p>}
      sections={sections}
    />
  )
}
