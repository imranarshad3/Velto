import { useContent } from "../../features/cms/context.ts";
import { ArrowRight } from "lucide-react";
import CategoryCard from "../../components/commerce/CategoryCard.tsx";
import ButtonLink from "../../components/ui/ButtonLink.tsx";
import { buttonArrow } from "../../components/ui/button.ts";
import Reveal from "../../components/ui/Reveal.tsx";
import SectionHeading from "../../components/ui/SectionHeading.tsx";
import { useCatalog } from "../../features/catalog/catalogContext.ts";

export default function CategoryPreview() {
  const { categories } = useCatalog();
  const cms = useContent("home", "CategoryPreview");
  return (
    <section
      aria-labelledby="categories-title"
      className="bg-canvas py-[clamp(3rem,6vw,5.5rem)]"
    >
      <div className="container-page">
        <Reveal>
          <SectionHeading
            id="categories-title"
            eyebrow={cms("field-1", "Product range")}
            title={cms("field-2", "Shop by Category")}
            description={cms(
              "field-3",
              "Explore our range of construction chemical solutions.",
            )}
            action={
              <ButtonLink
                to={cms("field-4", "/products")}
                variant="secondary"
                size="sm"
              >
                <span>
                  {cms("field-5", "View All")}
                  <span className="hidden sm:inline">
                    {" "}
                    {cms("field-6", " Categories")}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className={`size-4 ${buttonArrow}`}
                />
              </ButtonLink>
            }
          />
        </Reveal>

        <p
          id="category-scroll-hint"
          className="mt-6 flex items-center gap-2 text-[0.8125rem] font-medium text-muted md:hidden"
        >
          Scroll to explore categories{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </p>
        {/* Larger image tiles retain readable labels at desktop and mobile sizes. */}
        <ul
          aria-label="Product categories"
          aria-describedby="category-scroll-hint"
          tabIndex={0}
          className="mt-4 -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-[var(--grid-gap)] overflow-x-auto px-[var(--page-gutter)] pt-1 pb-3 md:mx-0 md:mt-[var(--heading-gap)] md:grid md:grid-cols-4 md:overflow-visible md:p-0"
        >
          {categories.map((category, index) => (
            <Reveal
              as="li"
              key={category.slug}
              delay={Math.min(index, 7) * 0.05}
              className="w-[72%] min-w-[12rem] shrink-0 snap-start sm:w-[38%] md:w-auto md:min-w-0"
            >
              <CategoryCard category={category} presentation="editorial" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
