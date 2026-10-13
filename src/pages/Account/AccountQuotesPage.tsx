import { ClipboardList } from 'lucide-react'
import ButtonLink from '../../components/ui/ButtonLink.tsx'
import EmptyState from '../../components/ui/EmptyState.tsx'
import { useMyQuotes } from '../../features/quotes/useMyQuotes.ts'
import AccountHeading from './AccountHeading.tsx'
import QuoteCard from './QuoteCard.tsx'
import RemoteState from './RemoteState.tsx'

export default function AccountQuotesPage() {
  const [state, reload] = useMyQuotes()

  return (
    <>
      <title>My Quotes — VELTO</title>
      <AccountHeading title="My quotes" crumbs={[{ label: 'My Quotes' }]} actions={<ButtonLink to="/quote">New quote request</ButtonLink>}>
        Requests sent while signed in, with their current status.
      </AccountHeading>
      <RemoteState state={state} reload={reload}>
        {(quotes) =>
          quotes.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No quote requests yet" actions={<ButtonLink to="/quote">Request a quote</ButtonLink>}>
              Guest requests aren’t linked automatically; track those with your reference and tracking code.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {quotes.map((quote) => (
                <li key={quote.reference}>
                  <QuoteCard quote={quote} detailsHref={`/account/quotes/${quote.reference}`} />
                </li>
              ))}
            </ul>
          )
        }
      </RemoteState>
    </>
  )
}
