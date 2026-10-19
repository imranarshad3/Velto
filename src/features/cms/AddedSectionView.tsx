import { imageSizeStyle } from './imageSizing.ts'
import { buttonClass } from '../../components/ui/button.ts'
import { safeImage, safeLink } from './safeUrl.ts'
import type { AddedSection, PageContent } from './types.ts'

export function AddedSectionView({ section, content }: { section: AddedSection; content: PageContent }) {
  const value = (key: string) => content.fields[`${section.id}.${key}`] ?? ''
  const dark = section.type === 'cta'
  const src = value('image-src'), href = value('link')
  return <section className={`py-12 sm:py-16 ${dark ? 'bg-forest text-white' : 'bg-cream'}`}>
    <div className={`container-page grid min-w-0 gap-8 ${section.type === 'image-text' && src ? 'items-center md:grid-cols-2' : ''}`}>
      {section.type === 'image-text' && src && safeImage(src) && <img style={imageSizeStyle(content.imageSizes?.[`${section.id}.image-src`])} src={src} alt={value('image-alt')} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
      <div className="min-w-0 [overflow-wrap:anywhere]">
        <h2 className="font-display text-3xl sm:text-4xl">{value('title')}</h2>
        {value('body') && <p className={`mt-5 whitespace-pre-line text-base leading-relaxed ${dark ? 'text-white/90' : 'text-muted'}`}>{value('body')}</p>}
        {href && safeLink(href) && value('button') && <a href={href} className={buttonClass(dark ? 'light' : 'primary', 'md', 'mt-6 max-w-full whitespace-normal! text-center')}>{value('button')}</a>}
      </div>
    </div>
  </section>
}
