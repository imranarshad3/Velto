import { useContent } from "../../features/cms/context.ts";
import { ArrowRight, BookOpen, ClipboardList, Compass } from "lucide-react";
import ButtonLink from "../../components/ui/ButtonLink.tsx";
import { buttonArrow } from "../../components/ui/button.ts";
import Img from "../../components/ui/Img.tsx";
import Reveal from "../../components/ui/Reveal.tsx";
import { professionalImage } from "../../data/images.ts";

const points = [
  { icon: Compass, label: "Find products by area" },
  { icon: ClipboardList, label: "Ask about project amounts" },
  { icon: BookOpen, label: "Product guides as they are ready" },
];

export default function ProfessionalsBanner() {
  const cms = useContent("home", "ProfessionalsBanner");
  return (
    <section
      aria-labelledby="pros-title"
      className="professionals-section bg-canvas py-[var(--section-gap)]"
    >
      <Reveal className="container-page">
        <div className="relative isolate grid overflow-hidden rounded-[var(--radius-panel)] bg-forest-deep text-white shadow-[var(--shadow-float)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex min-w-0 flex-col justify-center p-[clamp(1.5rem,5vw,4rem)] lg:order-1">
            <p className="flex items-center gap-3 text-[0.75rem] font-bold tracking-[0.2em] text-gold uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-gold/70" />
              {cms("field-1", "VELTO Professionals")}
            </p>
            <h2
              id="pros-title"
              className="mt-3 font-display text-[clamp(2.25rem,3.5vw,3.75rem)] leading-[1.08]"
            >
              {cms("field-2", "Built for Professionals")}
            </h2>
            <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-relaxed text-white/80">
              {cms(
                "field-3",
                "For builders and project teams: find products by area, ask about the amounts you need, and get product guides as they are ready.",
              )}
            </p>
            <ul className="mt-7 grid border-t border-white/15">
              {points.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-4 border-b border-white/15 py-4 text-[0.9375rem] text-white/90"
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0 text-gold" />
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
                {cms("field-7", "Get a price")}
              </ButtonLink>
            </div>
          </div>

          <div className="relative min-w-0 lg:order-2">
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-forest-dark lg:h-full lg:aspect-auto">
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
                fit="cover"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
