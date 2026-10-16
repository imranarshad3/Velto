import { useState, type FormEvent } from 'react'
import { Check, Clock, Copy, MailCheck, RotateCw, ShieldCheck, UserMinus, UserPlus, X } from 'lucide-react'
import { buttonClass } from '../../components/ui/button.ts'
import { inputClass } from '../../components/ui/form/Field.tsx'
import { adminApi } from '../../features/admin/api.ts'
import type { AdminTeam } from '../../features/admin/types.ts'
import { QuoteApiError } from '../../features/quotes/api.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'
import ConfirmDialog from './ConfirmDialog.tsx'
import { Avatar, Panel } from './ui.tsx'

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const daysLeft = (iso: string) => Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000)

type Member = AdminTeam['members'][number]
type Notice = { email: string; delivery: 'sent' | 'existing_user' | 'not_sent'; link: string }

const steps = [
  'Enter their email address (Gmail or any other provider).',
  'If they’re new to VELTO, Clerk emails them a sign-up invitation.',
  'They get admin access as soon as they sign in with that exact address, once it’s verified. Invitations expire after 7 days.',
]

export default function AdminTeamPage() {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [state, reload] = useAuthedRemote((t) => adminApi.team(t), 'admin-team')
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [copied, setCopied] = useState(false)
  const [toRemove, setToRemove] = useState<Member | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const token = async () => {
    const t = await getToken()
    if (!t) throw new QuoteApiError(401, 'sign_in_required', 'Please sign in again.')
    return t
  }
  const message = (error: unknown, fallback: string) => (error instanceof QuoteApiError ? error.message : fallback)

  const invite = async (address: string) => {
    setSending(address)
    setFieldError(null)
    try {
      const result = await adminApi.inviteAdmin(await token(), address)
      setNotice(result)
      setCopied(false)
      setEmail('')
      show(result.delivery === 'sent' ? `Invitation emailed to ${result.email}.` : `Invitation created for ${result.email}.`)
      reload()
    } catch (error) {
      const fe = error instanceof QuoteApiError ? error.fieldErrors?.email : undefined
      setFieldError(fe ?? message(error, 'The invitation could not be sent. Please try again.'))
    } finally {
      setSending(null)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void invite(email.trim())
  }

  const revoke = async (id: string, address: string) => {
    setBusy(id)
    try {
      await adminApi.revokeInvite(await token(), id)
      show(`Invitation for ${address} revoked.`)
      reload()
    } catch (error) {
      show(message(error, 'The invitation could not be revoked.'))
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!toRemove) return
    setBusy(toRemove.clerkUserId)
    setRemoveError(null)
    try {
      await adminApi.removeAdmin(await token(), toRemove.clerkUserId)
      show(`${toRemove.name || toRemove.email || 'Admin'} no longer has admin access.`)
      setToRemove(null)
      reload()
    } catch (error) {
      setRemoveError(message(error, 'Admin access could not be removed.'))
    } finally {
      setBusy(null)
    }
  }

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      show('Copy failed. Select the link and copy it manually.')
    }
  }

  return (
    <>
      <title>Team — Admin — VELTO</title>
      <AdminHeading title="Team" crumbs={[{ label: 'Team' }]}>
        Invite colleagues to the admin console. Access is granted only to the exact, verified email address you invite.
      </AdminHeading>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[clamp(1.25rem,2.5vw,1.75rem)] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-[clamp(1.25rem,2.5vw,1.75rem)]">
          <Panel id="invite-title" title="Invite an admin" description="They’ll have admin access without protected Superadmin status.">
            <form onSubmit={onSubmit} noValidate>
              <label htmlFor="invite-email" className="block text-[0.875rem] font-semibold text-ink">
                Email address
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  id="invite-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldError(null)
                  }}
                  placeholder="name@gmail.com"
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={fieldError ? 'invite-error' : undefined}
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <button type="submit" disabled={!email.trim() || sending !== null} className={buttonClass('primary', 'md', 'shrink-0 disabled:opacity-60')}>
                  <UserPlus aria-hidden="true" className="size-4" />
                  {sending === email.trim() ? 'Sending…' : 'Send invite'}
                </button>
              </div>
              {fieldError && (
                <p id="invite-error" role="alert" className="mt-2 text-[0.875rem] text-danger">
                  {fieldError}
                </p>
              )}
            </form>

            {notice && (
              <div role="status" className="mt-4 rounded-xl border border-forest/15 bg-forest-soft/60 p-4 text-[0.875rem]">
                <p className="flex items-start gap-2 font-semibold text-forest">
                  <MailCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {notice.delivery === 'sent' && <>Invitation email sent to {notice.email}.</>}
                  {notice.delivery === 'existing_user' && <>{notice.email} already has a VELTO account.</>}
                  {notice.delivery === 'not_sent' && <>Invitation saved for {notice.email}, but no email was sent.</>}
                </p>
                <p className="mt-1 pl-6 text-muted">
                  {notice.delivery === 'sent' ? 'They’ll become an admin after creating their account and verifying the address.' : 'Send them this link: they’ll become an admin when they sign in with that address.'}
                </p>
                {notice.delivery !== 'sent' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
                    <code className="min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[0.8125rem] break-all">{notice.link}</code>
                    <button type="button" onClick={() => void copyLink(notice.link)} className={buttonClass('secondary', 'sm')}>
                      {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </Panel>

          <Panel id="how-title" title="How invitations work">
            <ol className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={s} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 text-[0.9375rem] leading-relaxed">
                  <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-forest-soft text-[0.8125rem] font-bold text-forest">
                    {i + 1}
                  </span>
                  <span className="text-ink">{s}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <RemoteState state={state} reload={reload} skeleton={2}>
          {(team) => (
            <div className="flex flex-col gap-[clamp(1.25rem,2.5vw,1.75rem)]">
              <Panel id="members-title" title="Admins" description={`${team.members.length} ${team.members.length === 1 ? 'person has' : 'people have'} admin access`} bodyClassName="p-0">
                <ul className="divide-y divide-border">
                  {team.members.map((m) => {
                    const label = m.name || m.email || m.clerkUserId
                    return (
                      <li key={m.clerkUserId} className="flex flex-wrap items-center gap-3 px-5 py-4">
                        <Avatar name={label} />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                            <span className="truncate capitalize">{label}</span>
                            {m.superAdmin && <Badge tone="green">Protected Superadmin</Badge>}
                        {m.you && <Badge tone="green">You</Badge>}
                          </p>
                          <p className="truncate text-[0.8125rem] text-muted">
                            {m.email && m.email !== label ? `${m.email} · ` : ''}Admin since {dateFmt.format(new Date(m.createdAt))}
                          </p>
                        </div>
                        {!m.you && !m.superAdmin && team.members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setRemoveError(null)
                              setToRemove(m)
                            }}
                            className={buttonClass('ghost', 'sm', 'text-muted hover:text-danger')}
                          >
                            <UserMinus aria-hidden="true" className="size-4" /> Remove
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Panel>

              <Panel id="invites-title" title="Pending invitations" description="Accepted invitations move to Admins automatically." bodyClassName="p-0">
                {team.invites.length ? (
                  <ul className="divide-y divide-border">
                    {team.invites.map((i) => {
                      const left = daysLeft(i.expiresAt)
                      const expired = left <= 0
                      return (
                        <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                          <span className={`grid size-10 shrink-0 place-items-center rounded-full ${expired ? 'bg-sand text-muted' : 'bg-copper-soft text-copper'}`}>
                            <Clock aria-hidden="true" className="size-[1.125rem]" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-semibold text-ink">{i.email}</span>
                              {expired ? <Badge tone="muted">Expired</Badge> : <span className="rounded-full bg-copper-soft px-2.5 py-0.5 text-[0.75rem] font-semibold text-copper-hover">Expires in {left} {left === 1 ? 'day' : 'days'}</span>}
                            </p>
                            <p className="text-[0.8125rem] text-muted">Invited {dateFmt.format(new Date(i.createdAt))}</p>
                          </div>
                          <span className="flex gap-1">
                            <button type="button" onClick={() => void invite(i.email)} disabled={sending !== null || busy !== null} className={buttonClass('ghost', 'sm', 'disabled:opacity-60')}>
                              <RotateCw aria-hidden="true" className="size-4" /> {expired ? 'Renew' : 'Resend'}
                              <span className="sr-only"> invitation for {i.email}</span>
                            </button>
                            <button type="button" onClick={() => void revoke(i.id, i.email)} disabled={busy !== null} className={buttonClass('ghost', 'sm', 'text-muted hover:text-danger disabled:opacity-60')}>
                              <X aria-hidden="true" className="size-4" /> Revoke
                              <span className="sr-only"> invitation for {i.email}</span>
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 px-5 py-6 text-[0.9375rem] text-muted">
                    <ShieldCheck aria-hidden="true" className="size-5 text-forest" /> No pending invitations.
                  </p>
                )}
              </Panel>
            </div>
          )}
        </RemoteState>
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        icon={UserMinus}
        title={<>Remove admin access for {toRemove?.name || toRemove?.email || 'this person'}?</>}
        confirmLabel="Remove access"
        busyLabel="Removing…"
        busy={busy !== null && busy === toRemove?.clerkUserId}
        error={removeError}
        onCancel={() => setToRemove(null)}
        onConfirm={() => void remove()}
      >
        They’ll keep their customer account but lose access to the admin console immediately. You can invite them again later.
      </ConfirmDialog>
    </>
  )
}
