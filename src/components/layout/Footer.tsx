import { Link } from 'react-router'
import { footerColumns, legalNav } from '../../data/navigation.ts'
import Logo from '../ui/Logo.tsx'

const year = new Date().getFullYear()

const linkClass = 'inline-flex min-h-11 items-center text-[0.875rem] text-white/75 transition-colors hover:text-white'

export default function Footer() {
  return (
    <footer className="bg-forest-dark text-white">
      <div className="container-page grid gap-10 py-[clamp(3rem,6vw,4.5rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)]">
        <div className="max-w-[22rem]">
          <Logo className="text-white [&_span]:text-white" />
          <p className="mt-4 text-[0.875rem] text-white/70">
            NOVARO is a storefront for construction chemical solutions, featuring ULTRA Chemicals products.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-[0.75rem] font-semibold tracking-[0.16em] text-[#e3c58f] uppercase">{column.title}</h2>
              <ul className="mt-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-4 text-[0.8125rem] text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© {year} NOVARO. Product imagery is illustrative.</p>
          <ul className="flex flex-wrap gap-x-6">
            {legalNav.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
