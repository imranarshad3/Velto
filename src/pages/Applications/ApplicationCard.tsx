import { useContentData } from "../../features/cms/context.ts";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import Img from "../../components/ui/Img.tsx";
import { applicationDetails } from "../../data/applications.ts";
import type { Application } from "../../data/homeContent.ts";

interface ApplicationCardProps {
  application: Application;
  /** Heading level for the card title. */
  as?: "h2" | "h3";
  /** Show the longer intro instead of the short summary. */
  long?: boolean;
}

/** Image-led application card used on the Applications and Solutions pages. */
export default function ApplicationCard({
  application,
  as: Heading = "h3",
  long = false,
}: ApplicationCardProps) {
  const details = useContentData(
    "applications",
    "ApplicationDetails.data",
    applicationDetails,
  );

  const detail = details[application.slug];
  const Icon = application.icon;

  return (
    <Link
      to={`/applications/${application.slug}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-forest/25 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Image frame */}
      <div className="relative isolate w-full shrink-0 overflow-hidden bg-sand-deep">
        {detail?.image?.src ? (
          <Img
            image={detail.image}
            alt=""
            uncropped
          />
        ) : (
          <div
            className="grid aspect-[3/2] place-items-center"
            aria-hidden="true"
          >
            <Icon className="size-12 text-forest/50" />
          </div>
        )}

        {/* Hover arrow */}
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 text-forest opacity-0 shadow-[var(--shadow-soft)] transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      {/* Card content */}
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <Heading className="font-display text-2xl leading-tight transition-colors group-hover:text-forest">
          <Icon aria-hidden="true" className="mr-2 inline-block size-5 text-forest" />
          {application.name}
        </Heading>

        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          {long
            ? detail?.intro ?? application.text
            : application.text}
        </p>

        {detail && (
          <p className="mt-auto pt-4 text-xs font-bold uppercase tracking-[0.14em] text-copper">
            {detail.steps.length} step sequence
          </p>
        )}
      </div>
    </Link>
  );
}
