import PageHeader from '../../components/ui/PageHeader.tsx'
import GuestLookup from './GuestLookup.tsx'

export default function TrackPage() {
  return (
    <>
      <title>Track a Request — NOVARO</title>
      <PageHeader
        title="Track a request"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Track a Request' }]}
        description="Guest requests can be checked with the reference and tracking code shown when you submitted. Signed-in customers can see every request in My quotes."
      />
      <div className="container-page py-[clamp(2rem,4vw,3.5rem)] pb-[var(--section-gap)]">
        <GuestLookup />
      </div>
    </>
  )
}
