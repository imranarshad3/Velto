import { useContentData } from '../../features/cms/context.ts'
import { useContent } from '../../features/cms/context.ts'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { footerColumns as defaultfooterColumns, legalNav as defaultlegalNav } from '../../data/navigation.ts'
import Logo from '../ui/Logo.tsx'
import { buttonArrow, buttonClass } from '../ui/button.ts'

const year = new Date().getFullYear()

const linkClass = 'group inline-flex min-h-11 items-center text-[0.9375rem] text-white/70 transition-colors hover:text-white'

export default function Footer() {
  const legalNav = useContentData('site', 'LegalLinks.data', defaultlegalNav)
  const footerColumns = useContentData('site', 'FooterLinks.data', defaultfooterColumns)
  const cms = useContent('site', 'Footer')
  return (
    <footer className="relative isolate overflow-hidden border-t border-white/[0.06] bg-footer text-white">

      <div className="container-page grid gap-12 pt-[clamp(3.5rem,7vw,5.5rem)] pb-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] lg:gap-16">
        <div className="max-w-[26rem]">
          <Logo className="text-white [&_span]:text-white" />
          <p className="mt-6 font-display text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-tight text-white">
            {cms("field-1", "Construction chemistry, ")}<span className="text-emerald-muted">{cms("field-2", "chosen with confidence.")}</span>
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/65">
            {cms("field-3", "VELTO brings together building and repair products from ULTRA Chemicals.")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={cms("field-4", "/quote")} className={buttonClass('light', 'md')}>
              {cms("field-5", "Get a price")}<ArrowRight aria-hidden="true" className={`size-4 ${buttonArrow}`} />
            </Link>
            <Link to={cms("field-6", "/contact")} className={buttonClass('outline-light', 'md')}>
              {cms("field-7", "Contact us")}</Link>
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-[0.75rem] font-bold tracking-[0.2em] text-emerald-muted uppercase">{column.title}</h2>
              <ul className="mt-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={linkClass}>
                      <span className="h-px w-0 bg-emerald-muted transition-[width,margin] duration-300 group-hover:mr-2 group-hover:w-3" aria-hidden="true" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="container-page">
        <div className="h-px bg-white/[0.08]" />
      </div>

      <div className="container-page flex flex-col gap-2 py-5 text-[0.8125rem] text-white/55 md:flex-row md:items-center md:justify-between">
        <p>© {year} {cms("field-8", " VELTO. Images are examples only.")}</p>
        <ul className="flex flex-wrap gap-x-6">
          {legalNav.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="inline-flex min-h-11 items-center transition-colors hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.18em] text-center font-display text-[clamp(5rem,19vw,17rem)] leading-none tracking-[-0.03em] text-transparent select-none [-webkit-text-stroke:1px_rgb(143_181_163/0.14)]"
      >
        {cms("field-9", "VELTO")}</p>
    </footer>
  )
}
