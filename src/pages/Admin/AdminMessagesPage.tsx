import { useState } from 'react'
import { Mail } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState.tsx'
import { adminApi } from '../../features/admin/api.ts'
import type { MessageStatus } from '../../features/admin/types.ts'
import { contactTopicLabels } from '../../features/contact/schema.ts'
import { dateTimeFormat } from '../../features/quotes/format.ts'
import { useToasts } from '../../features/ui/toastStore.ts'
import { useAppAuth } from '../../lib/auth/context.ts'
import { useAuthedRemote } from '../../lib/useAuthedRemote.ts'
import RemoteState from '../Account/RemoteState.tsx'
import AdminHeading from './AdminHeading.tsx'
import Badge from './Badge.tsx'

const filters: { value: MessageStatus | ''; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'closed', label: 'Closed' },
  { value: '', label: 'All' },
]

export default function AdminMessagesPage() {
  const { getToken } = useAppAuth()
  const show = useToasts((s) => s.show)
  const [status, setStatus] = useState<MessageStatus | ''>('new')
  const [state, reload] = useAuthedRemote(async (t) => (await adminApi.messages(t, status || undefined)).messages, `messages:${status}`)

  const mark = async (id: string, next: MessageStatus) => {
    const token = await getToken()
    if (!token) return
    try {
      await adminApi.updateMessage(token, id, next)
      show(`Message marked ${next}`)
      reload()
    } catch {
      show('Could not update the message. Please try again.')
    }
  }

  return (
    <>
      <title>Messages — Admin — VELTO</title>
      <AdminHeading title="Messages" crumbs={[{ label: 'Messages' }]} />
      <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.label} type="button" aria-pressed={status === f.value} onClick={() => setStatus(f.value)} className={`min-h-11 rounded-full border px-4 text-[0.875rem] font-semibold ${status === f.value ? 'border-forest bg-forest text-white' : 'border-border bg-surface hover:border-forest'}`}>
            {f.label}
          </button>
        ))}
      </div>
      <RemoteState state={state} reload={reload} skeleton={3}>
        {(messages) =>
          messages.length === 0 ? (
            <EmptyState icon={Mail} title="No messages here" />
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((m) => (
                <li key={m.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {m.fullName} <span className="font-normal text-muted">· {m.owner === 'account' ? 'Account' : 'Guest'}</span>
                      </p>
                      <p className="text-[0.875rem] break-all">
                        <a href={`mailto:${m.email}`} className="text-forest underline">
                          {m.email}
                        </a>
                        {m.phone && <span className="text-muted"> · {m.phone}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="sand">{contactTopicLabels[m.topic as keyof typeof contactTopicLabels] ?? m.topic}</Badge>
                      <Badge tone={m.status === 'new' ? 'copper' : m.status === 'read' ? 'soft' : 'muted'}>{m.status}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line">{m.message}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[0.8125rem] text-muted">{dateTimeFormat.format(new Date(m.createdAt))}</span>
                    <div className="flex gap-2">
                      {m.status !== 'read' && (
                        <button type="button" onClick={() => mark(m.id, 'read')} className="min-h-11 rounded-lg border border-border px-4 text-[0.875rem] font-semibold hover:border-forest">
                          Mark read
                        </button>
                      )}
                      {m.status !== 'closed' && (
                        <button type="button" onClick={() => mark(m.id, 'closed')} className="min-h-11 rounded-lg bg-forest px-4 text-[0.875rem] font-semibold text-white">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </RemoteState>
    </>
  )
}
