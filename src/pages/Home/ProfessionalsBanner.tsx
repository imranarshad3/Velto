import { useContent } from "../../features/cms/context.ts";
import { ArrowRight, BookOpen, ClipboardList, Compass } from "lucide-react";
import ButtonLink from "../../components/ui/ButtonLink.tsx";
import { buttonArrow } from "../../components/ui/button.ts";
import Img from "../../components/ui/Img.tsx";
import Reveal from "../../components/ui/Reveal.tsx";
import { professionalImage } from "../../data/images.ts";

const points = [
  { icon: Compass, label: "Browse by application" },
  { icon: ClipboardList, label: "Request project quantities" },
  { icon: BookOpen, label: "Technical documents as published" },
];

export default function ProfessionalsBanner() {
  const cms = useContent("home", "ProfessionalsBanner");
  return (
    <section
      aria-labelledby="pros-title"
      className="bg-canvas py-[var(--section-gap)]"
    >
      <Reveal className="container-page">
        <div className="relative isolate grid overflow-hidden rounded-[var(--radius-panel)] bg-forest text-white shadow-[var(--shadow-float)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col justify-center p-[clamp(1.5rem,5vw,4rem)] md:order-1">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
              {cms("field-1", "VELTO Professionals")}
            </p>
            <h2
              id="pros-title"
              className="mt-3 font-display text-[length:var(--h2)] leading-[1.08]"
            >
              {cms("field-2", "Built for Professionals")}
            </h2>
            <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-white/80">
              {cms(
                "field-3",
                "For builders, architects and contractors: browse by application, request project quantities and access technical documents as they are published.",
              )}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {points.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.8125rem] text-white/90"
                >
                  <Icon aria-hidden="true" className="size-3.5 text-gold" />
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to={cms("field-4", "/solutions")} variant="light">
                {cms("field-5", "Explore Solutions ")}
                <ArrowRight
                  aria-hidden="true"
                  className={`size-4 ${buttonArrow}`}
                />
              </ButtonLink>
              <ButtonLink to={cms("field-6", "/quote")} variant="outline-light">
                {cms("field-7", "Ask for Price")}
              </ButtonLink>
            </div>
          </div>

          <div className="relative min-h-[16rem] p-[clamp(0.75rem,2vw,1.25rem)] md:order-2 md:min-h-[26rem] md:pl-0">
            <div className="relative size-full min-h-[inherit] overflow-hidden rounded-[calc(var(--radius-panel)-0.5rem)] bg-forest-dark">
              <Img cmsImage={{ page: 'home', field: 'ProfessionalsBanner.image-src' }}
                image={{
                  ...professionalImage,
                  src: cms(
                    "image-src",
                    "/images/banners/professional-contractor.webp",
                  ),
                  alt: cms(
                    "image-alt",
                    "Illustrative concept: contractor in safety gear levelling a floor surface",
                  ),
                }}
                className="absolute inset-0 size-full origin-right scale-[1.06] object-cover object-[center_30%]"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
