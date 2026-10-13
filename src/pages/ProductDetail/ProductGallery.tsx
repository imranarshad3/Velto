import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react'
import type { ImageAsset } from '../../data/images.ts'

export interface GallerySlide {
  key: string
  caption: string
  /** Undefined renders a labelled placeholder. */
  image?: ImageAsset
}

interface ProductGalleryProps {
  slides: GallerySlide[]
  productName: string
}

/** Images never render above their natural size: current assets are small concept crops. */
const naturalSize = 'h-auto max-h-full w-auto max-w-full object-contain'

function SlideImage({ slide, priority }: { slide: GallerySlide; priority?: boolean }) {
  const [failed, setFailed] = useState(false)

  if (!slide.image || failed) {
    return (
      <span className="flex flex-col items-center gap-2 text-muted">
        <ImageOff aria-hidden="true" className="size-10 text-forest/50" />
        <span className="text-[0.875rem] font-medium">Product image coming soon</span>
      </span>
    )
  }

  return (
    <img
      src={slide.image.src}
      alt={slide.image.alt}
      width={slide.image.width}
      height={slide.image.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
      className={naturalSize}
    />
  )
}

export default function ProductGallery({ slides, productName }: ProductGalleryProps) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const count = slides.length
  const slide = slides[index]
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (lightbox && !dialog.open) dialog.showModal()
    if (!lightbox && dialog.open) dialog.close()
  }, [lightbox])

  const onArrows = (event: KeyboardEvent) => {
    if (count < 2) return
    if (event.key === 'ArrowRight') go(1)
    if (event.key === 'ArrowLeft') go(-1)
  }

  const navButton =
    'absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/95 text-ink shadow-[var(--shadow-card)] transition-colors hover:text-forest'

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} images`}
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={onArrows}
        className="relative grid aspect-square flex-1 place-items-center overflow-hidden rounded-[var(--radius-card)] border border-border bg-white p-[8%]"
      >
        <div key={slide.key} aria-live="polite" className="grid size-full animate-[fade-in_0.3s_ease-out] place-items-center">
          <SlideImage slide={slide} priority={index === 0} />
        </div>
        <p
          className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-white via-white/90 to-transparent px-4 pt-6 pb-3 text-center text-[0.75rem] text-muted ${slide.image ? '' : 'sr-only'}`}
        >
          {slide.caption}
          {count > 1 && <span className="sr-only">, image {index + 1} of {count}</span>}
        </p>
        {count > 1 && (
          <>
            <button type="button" className={`${navButton} left-3`} onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button type="button" className={`${navButton} right-3`} onClick={() => go(1)} aria-label="Next image">
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
        {slide.image && (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-haspopup="dialog"
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-surface/95 text-ink shadow-[var(--shadow-card)] hover:text-forest"
            aria-label="View larger image"
          >
            <Expand aria-hidden="true" className="size-[1.125rem]" />
          </button>
        )}
      </div>

      {count > 1 && (
        <ul className="flex gap-3 lg:w-[clamp(4.5rem,7vw,5.5rem)] lg:flex-col" aria-label="Choose image">
          {slides.map((s, i) => (
            <li key={s.key} className="w-[clamp(4rem,20vw,5.5rem)] lg:w-full">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}: ${s.caption}`}
                aria-current={i === index ? 'true' : undefined}
                className={`grid aspect-square w-full place-items-center overflow-hidden rounded-xl border bg-white p-1.5 transition-shadow ${i === index ? 'border-forest ring-2 ring-forest' : 'border-border hover:border-forest/50'}`}
              >
                {s.image ? (
                  <img src={s.image.src} alt="" width={s.image.width} height={s.image.height} loading="lazy" decoding="async" className="size-full object-contain" />
                ) : (
                  <ImageOff aria-hidden="true" className="size-6 text-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`${productName}: ${slide.caption}`}
        onClose={() => setLightbox(false)}
        onKeyDown={onArrows}
        onClick={(event) => {
          if (event.target === event.currentTarget) setLightbox(false)
        }}
        className="m-auto max-h-[92dvh] w-[min(94vw,56rem)] max-w-none overflow-hidden rounded-[var(--radius-card)] bg-white p-0 backdrop:bg-ink/80 open:animate-[fade-in_0.25s_ease-out]"
      >
        <div className="relative grid min-h-[min(70dvh,36rem)] place-items-center p-[clamp(3.5rem,8vw,5rem)]">
          {lightbox && <SlideImage slide={slide} />}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-sand hover:bg-sand-deep"
            aria-label="Close image viewer"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
          {count > 1 && (
            <>
              <button type="button" className={`${navButton} left-3`} onClick={() => go(-1)} aria-label="Previous image">
                <ChevronLeft aria-hidden="true" className="size-5" />
              </button>
              <button type="button" className={`${navButton} right-3`} onClick={() => go(1)} aria-label="Next image">
                <ChevronRight aria-hidden="true" className="size-5" />
              </button>
            </>
          )}
          <p className="absolute inset-x-0 bottom-3 text-center text-[0.8125rem] text-muted">{slide.caption}</p>
        </div>
      </dialog>
    </div>
  )
}
