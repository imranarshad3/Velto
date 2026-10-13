import { useContentData } from '../../features/cms/context.ts'
import { Link } from 'react-router'
import { announcements as defaultannouncements, utilityNav as defaultutilityNav } from '../../data/navigation.ts'

export default function AnnouncementBar() {
  const utilityNav = useContentData('site', 'UtilityNavigation.data', defaultutilityNav)
  const announcements = useContentData('site', 'Announcements.data', defaultannouncements)
  return (
    <div className="border-b border-white/[0.06] bg-footer text-[0.75rem] text-white/70">
      <div className="container-page flex min-h-11 items-center justify-between gap-4">
        <ul className="flex min-w-0 items-center" aria-label="Store highlights">
          {announcements.map((message, index) => (
            <li
              key={message}
              className={`truncate ${index > 0 ? 'hidden before:mx-3 before:text-white/35 before:content-["|"] xl:block' : ''} ${index === 0 ? 'text-emerald-muted' : ''}`}
            >
              {message}
            </li>
          ))}
        </ul>
        <nav aria-label="Customer service" className="hidden shrink-0 md:block">
          <ul className="flex items-center gap-5">
            {utilityNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
