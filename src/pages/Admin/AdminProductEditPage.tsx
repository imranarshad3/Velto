import ProductPhotoAssistant from "./ProductPhotoAssistant.tsx";
import ProductGallery from "./ProductGallery.tsx";
import { toGalleryItem, type GalleryItem } from "./gallery.ts";
import RowsEditor from "./RowsEditor.tsx";
import { mergeDraft } from "../../features/catalog/aiProduct.ts";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { CircleAlert, ExternalLink, LoaderCircle, Sparkles } from "lucide-react";
import Field, { inputClass } from "../../components/ui/form/Field.tsx";
import { catalog } from "../../data/catalog.ts";
import { demoCategories } from "../../data/demoCategories.ts";
import type { ImageAsset } from "../../data/images.ts";
import { applications } from "../../data/homeContent.ts";
import { adminApi } from "../../features/admin/api.ts";
import { workspaceApi } from "../../features/cms/api.ts";
import type { AdminProduct } from "../../features/admin/types.ts";
import {
  applicationSlugs,
  areaSlugs,
  categorySlugs,
  productInputSchema,
  slugify,
  type ProductInput,
} from "../../features/catalog/productSchema.ts";
import { QuoteApiError } from "../../features/quotes/api.ts";
import { useToasts } from "../../features/ui/toastStore.ts";
import { useAppAuth } from "../../lib/auth/context.ts";
import { useAuthedRemote } from "../../lib/useAuthedRemote.ts";
import RemoteState from "../Account/RemoteState.tsx";
import { buttonClass } from "../../components/ui/button.ts";
import AdminHeading from "./AdminHeading.tsx";
import CoveragePanel from "./CoveragePanel.tsx";

/** Images already shipped in /public/images that can be attached to a product. */
const imageOptions: ImageAsset[] = [
  ...catalog.flatMap((p) => (p.image ? [p.image] : [])),
  ...demoCategories.flatMap((c) => (c.image ? [{ ...c.image }] : [])),
].filter((img, i, all) => all.findIndex((x) => x.src === img.src) === i);

const appName = new Map(applications.map((a) => [a.slug, a.name]));
const NEW_CATEGORY = "__new__";

/** Field labels for the error summary; keys are productInputSchema paths. */
const fieldLabels: Record<string, string> = {
  name: "Product name",
  slug: "URL slug",
  categorySlug: "Category",
  categoryName: "Category name",
  price: "Price",
  stockQuantity: "Stock",
  usage: "Short usage line",
  description: "Description",
  applications: "Applications",
  areas: "Use areas",
  benefits: "Benefits",
  specifications: "Specifications",
  packSizes: "Pack sizes",
  coverage: "Coverage",
  faq: "FAQ",
  image: "Main image alt text",
  images: "Photos",
};
/** Element to focus for each error key. */
const fieldId = (key: string) =>
  `pf-${key === "price" ? "priceAmount" : key === "categorySlug" ? "categorySelect" : key === "image" || key === "images" ? "imageAlt" : key}`;
const rowLists = new Set(["benefits", "specifications", "packSizes", "faq"]);

interface FormState {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  stockQuantity: string;
  usage: string;
  description: string;
  applications: string[];
  areas: string[];
  benefits: string[];
  specifications: { label: string; value: string }[];
  packSizes: string[];
  coverage: string;
  documents: ProductInput["documents"];
  faq: { question: string; answer: string }[];
  imageAlt: string;
  priceAmount: string;
  published: boolean;
  sortOrder: string;
}

const toForm = (p?: AdminProduct): FormState => ({
  slug: p?.slug ?? "",
  name: p?.name ?? "",
  categorySlug: p?.categorySlug ?? "",
  categoryName: p?.categoryName ?? "",
  stockQuantity: p?.stockQuantity == null ? "" : String(p.stockQuantity),
  usage: p?.usage ?? "",
  description: p?.description ?? "",
  applications: p?.applications ?? [],
  areas: p?.areas ?? [],
  benefits: p?.benefits ?? [],
  specifications: p?.specifications ?? [],
  packSizes: p?.packSizes ?? [],
  coverage: p?.coverage ?? "",
  documents: p?.documents ?? [],
  faq: p?.faq ?? [],
  imageAlt: p?.image?.alt ?? "",
  priceAmount: p?.price ? String(p.price.amount) : "",
  published: p?.published ?? true,
  sortOrder: String(p?.sortOrder ?? 0),
});

const filled = (v: string) => v.trim() !== "";
const toInput = (f: FormState): ProductInput => ({
  slug: f.slug.trim(),
  name: f.name,
  categorySlug: f.categorySlug,
  categoryName: f.categoryName.trim() || undefined,
  stockQuantity: f.stockQuantity.trim() ? Number(f.stockQuantity) : null,
  usage: f.usage,
  description: f.description,
  applications: f.applications as ProductInput["applications"],
  areas: f.areas as ProductInput["areas"],
  // Blank rows are ignored; half-filled rows are kept so validation can point at them.
  benefits: f.benefits.filter(filled),
  specifications: f.specifications.filter((s) => filled(s.label) || filled(s.value)),
  packSizes: f.packSizes.filter(filled),
  coverage: f.coverage,
  documents: f.documents,
  faq: f.faq.filter((q) => filled(q.question) || filled(q.answer)),
  price: f.priceAmount.trim()
    ? { amount: Number(f.priceAmount), currency: "PKR" }
    : undefined,
  verified: true,
  published: f.published,
  sortOrder: Number(f.sortOrder) || 0,
});

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-[1.375rem]">
        {icon}
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-[var(--grid-gap)] sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ProductForm({ product }: { product?: AdminProduct }) {
  const creating = !product;
  const navigate = useNavigate();
  const { getToken } = useAppAuth();
  const show = useToasts((s) => s.show);
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>(() =>
    (product?.images?.length
      ? product.images
      : product?.image
        ? [product.image]
        : []
    ).map(toGalleryItem),
  );
  const uploaded = useRef(new Map<string, ImageAsset>());
  const [slugTouched, setSlugTouched] = useState(!creating);
  const [categories, setCategories] = useState<
    { slug: string; name: string }[]
  >(() =>
    [
      ...categorySlugs.map((slug) => ({
        slug,
        name: demoCategories.find((c) => c.slug === slug)?.name ?? slug,
      })),
      ...(product && !(categorySlugs as readonly string[]).includes(product.categorySlug)
        ? [{ slug: product.categorySlug, name: product.categoryName || product.categorySlug }]
        : []),
    ],
  );
  const [newCategory, setNewCategory] = useState(false);
  useEffect(() => {
    let active = true;
    void getToken()
      .then((t) => (t ? adminApi.categories(t) : null))
      .then((r) => {
        // Managed list (admin order, hidden ones included); keep any AI-suggested category not saved yet.
        if (active && r)
          setCategories((current) => [
            ...r.categories.map((c) => ({
              slug: c.slug,
              name: c.visible ? c.name : `${c.name} (hidden)`,
            })),
            ...current.filter(
              (c) =>
                !r.categories.some((x) => x.slug === c.slug) &&
                !(categorySlugs as readonly string[]).includes(c.slug),
            ),
          ]);
      })
      .catch(() => {}); // Built-in list remains available.
    return () => {
      active = false;
    };
  }, [getToken]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };
  // Media Library images are offered alongside bundled ones; dimensions are read so the storefront reserves aspect ratio.
  const [library, setLibrary] = useState<ImageAsset[]>(imageOptions);
  useEffect(() => {
    let active = true;
    void getToken()
      .then((t) => (t ? workspaceApi.media(t) : null))
      .then((r) => {
        if (!r || !active) return;
        return Promise.all(
          r.media.map(
            (m) =>
              new Promise<ImageAsset | null>((resolve) => {
                const img = new Image();
                img.onload = () =>
                  resolve({
                    src: m.url,
                    alt: m.alt || m.name,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                img.onerror = () => resolve(null);
                img.src = m.url;
              }),
          ),
        ).then((found) => {
          if (active)
            setLibrary((prev) => [
              ...prev,
              ...found.filter(
                (i): i is ImageAsset =>
                  !!i && !prev.some((p) => p.src === i.src),
              ),
            ]);
        });
      })
      .catch(() => {}); // Library is optional here; bundled images remain available.
    return () => {
      active = false;
    };
  }, [getToken]);

  // Warn before leaving with unsaved edits.
  const [initial] = useState(() => JSON.stringify([form, gallery.map((g) => g.src)]));
  const dirty =
    !saved && JSON.stringify([form, gallery.map((g) => g.src)]) !== initial;
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("You have unsaved changes. Leave this page and discard them?"))
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    // Navigate once rendered as saved, so the unsaved-changes blocker lets it through.
    if (saved) navigate("/admin/products");
  }, [saved, navigate]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setName = (name: string) => {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  };
  const toggle = (key: "applications" | "areas", value: string) =>
    set(
      key,
      form[key].includes(value)
        ? form[key].filter((v) => v !== value)
        : [...form[key], value],
    );

  const fail = (next: Record<string, string>, fallback: string) => {
    setErrors(next);
    const keys = Object.keys(next);
    setFormError(
      keys.length
        ? `Please fix ${keys.length === 1 ? "this field" : `these ${keys.length} fields`} before saving:`
        : fallback,
    );
    if (keys.length) document.getElementById(fieldId(keys[0]))?.focus();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || photoBusy) return;
    setFormError(null);
    const next: Record<string, string> = {};
    if (!form.stockQuantity.trim())
      next.stockQuantity = "Enter how many units are available (0 if sold out).";
    if (!form.priceAmount.trim()) next.price = "Enter the selling price.";
    const parsed = productInputSchema.safeParse(toInput(form));
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= rowLists.has(key)
          ? "Complete or remove the half-filled row."
          : key === "categorySlug"
            ? "Choose a category."
            : issue.message;
      }
    if (!parsed.success || Object.keys(next).length)
      return fail(next, "Please check the form.");
    const input = parsed.data;
    setErrors({});
    setSaving(true);
    try {
      const token = await getToken();
      if (!token)
        throw new QuoteApiError(
          401,
          "sign_in_required",
          "Please sign in again.",
        );
      const alt = form.imageAlt.trim() || form.name.trim();
      const images: GalleryItem[] = [];
      for (const item of gallery) {
        if (!item.base64) {
          images.push(item);
          continue;
        }
        let image = uploaded.current.get(item.key);
        if (!image) {
          const { media } = await workspaceApi.upload(
            token,
            { name: form.name || item.name || "Product", alt, folder: "Products", tags: [] },
            item.base64,
          );
          image = { src: media.url, alt, width: item.width, height: item.height };
          uploaded.current.set(item.key, image);
        }
        images.push(toGalleryItem(image));
      }
      setGallery(images);
      input.images = images.map(({ src, alt: a, width, height }, i) => ({
        src,
        alt: i === 0 ? alt : a || alt,
        width,
        height,
      }));
      input.image = input.images[0];
      if (creating) await adminApi.createProduct(token, input);
      else await adminApi.updateProduct(token, product.slug, input);
      show(`${input.name} saved`);
      setSaved(true);
    } catch (err) {
      const apiErr = err instanceof QuoteApiError ? err : null;
      const fe: Record<string, string> = {};
      for (const [k, v] of Object.entries(apiErr?.fieldErrors ?? {}))
        fe[k.split(".")[0]] ??= v;
      fail(fe, apiErr?.message ?? "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const text = (
    key: keyof FormState,
    label: string,
    opts: {
      required?: boolean;
      hint?: string;
      rows?: number;
      placeholder?: string;
      type?: "number" | "text";
      disabled?: boolean;
      onChange?: (value: string) => void;
    } = {},
  ) => (
    <Field
      id={`pf-${key}`}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={errors[key === "priceAmount" ? "price" : key === "imageAlt" ? "image" : key]}
    >
      {(a) =>
        opts.rows ? (
          <textarea
            {...a}
            rows={opts.rows}
            value={form[key] as string}
            placeholder={opts.placeholder}
            onChange={(e) => (opts.onChange ?? ((v: string) => set(key, v as never)))(e.target.value)}
            className={`${inputClass} py-3`}
          />
        ) : (
          <input
            {...a}
            type={opts.type ?? "text"}
            inputMode={opts.type === "number" ? "decimal" : undefined}
            min={opts.type === "number" ? 0 : undefined}
            step={key === "stockQuantity" ? 1 : opts.type === "number" ? 0.01 : undefined}
            value={form[key] as string}
            placeholder={opts.placeholder}
            disabled={opts.disabled}
            onChange={(e) => (opts.onChange ?? ((v: string) => set(key, v as never)))(e.target.value)}
            className={`${inputClass} disabled:bg-sand/60`}
          />
        )
      }
    </Field>
  );
  const checks = (
    key: "applications" | "areas",
    label: string,
    options: readonly string[],
    name: (v: string) => string,
  ) => (
    <fieldset className="min-w-0">
      <legend className="text-[0.875rem] font-semibold">
        {label}
        <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">(optional)</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 has-checked:border-forest has-checked:bg-forest-soft has-checked:text-forest has-focus-visible:outline-[0.1875rem] has-focus-visible:outline-copper"
          >
            <input
              type="checkbox"
              checked={form[key].includes(o)}
              onChange={() => toggle(key, o)}
              className="size-[1.125rem] accent-forest"
            />
            {name(o)}
          </label>
        ))}
      </div>
      {errors[key] && (
        <p className="text-[0.8125rem] font-semibold text-danger">
          {errors[key]}
        </p>
      )}
    </fieldset>
  );
  const stringRows = (key: "benefits" | "packSizes") => ({
    rows: form[key].map((value) => ({ value })),
    onChange: (rows: { value: string }[]) => set(key, rows.map((r) => r.value)),
  });
  const errorKeys = Object.keys(errors).filter((k) => errors[k]);

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger"
        >
          <p className="flex gap-2 font-semibold">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {formError}
          </p>
          {errorKeys.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-4 pl-7">
              {errorKeys.map((k) => (
                <li key={k}>
                  <a
                    href={`#${fieldId(k)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(fieldId(k))?.focus();
                    }}
                    className="inline-flex min-h-11 items-center underline"
                  >
                    {fieldLabels[k] ?? k}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Section
        title="Photos"
        description="Upload photos first: AI can then fill in most of the form for you."
      >
        <div className="sm:col-span-2">
          <ProductGallery
            items={gallery}
            library={library}
            disabled={saving}
            onBusy={setPhotoBusy}
            onChange={setGallery}
          />
        </div>
        {gallery.length > 0 && (
          <div className="sm:col-span-2">
            {text("imageAlt", "Main image description (alt text)", {
              hint: "Describe the photo for screen readers, e.g. “20 kg bag of grey tile adhesive”. Defaults to the product name.",
            })}
          </div>
        )}
      </Section>

      <Section
        title="Fill in with AI"
        icon={<Sparkles aria-hidden="true" className="size-5 text-copper" />}
        description="Optional. AI reads your photos and suggests the name, description and details. Price and stock are always entered by you."
      >
        <div className="sm:col-span-2">
          <ProductPhotoAssistant
            photos={gallery}
            category={form.categorySlug}
            disabled={saving}
            onBusy={setPhotoBusy}
            onDraft={(draft, replace) => {
              setForm((current) =>
                mergeDraft(current, draft, replace, creating && !slugTouched, form),
              );
              if (
                draft.categorySlug &&
                !categories.some((c) => c.slug === draft.categorySlug)
              ) {
                setCategories((c) => [
                  ...c,
                  {
                    slug: draft.categorySlug!,
                    name: draft.categoryName || draft.categorySlug!,
                  },
                ]);
              }
              setAiApplied(true);
            }}
          />
        </div>
      </Section>

      {aiApplied && (
        <p className="rounded-xl bg-forest-soft p-4 text-sm text-forest">
          This form contains AI suggestions. Check each field against your
          product label or supplier information before saving.
        </p>
      )}

      <Section title="Essentials" description="Fields marked * are required.">
        <div className="sm:col-span-2">
          {text("name", "Product name", {
            required: true,
            placeholder: "e.g. Premium Tile Adhesive C2TE",
            onChange: setName,
          })}
        </div>
        <Field
          id="pf-categorySelect"
          label="Category"
          required
          error={errors.categorySlug || errors.categoryName}
        >
          {(a) => (
            <select
              {...a}
              value={newCategory ? NEW_CATEGORY : form.categorySlug}
              onChange={(e) => {
                if (e.target.value === NEW_CATEGORY) {
                  setNewCategory(true);
                  set("categorySlug", slugify(form.categoryName));
                  requestAnimationFrame(() =>
                    document.getElementById("pf-categoryName")?.focus(),
                  );
                  return;
                }
                setNewCategory(false);
                set("categorySlug", e.target.value);
                set(
                  "categoryName",
                  categories
                    .find((c) => c.slug === e.target.value)
                    ?.name.replace(/ \(hidden\)$/, "") ?? "",
                );
              }}
              className={inputClass}
            >
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ New category…</option>
            </select>
          )}
        </Field>
        {newCategory ? (
          text("categoryName", "New category name", {
            required: true,
            placeholder: "e.g. Decorative Coatings",
            hint: form.categorySlug
              ? `Created when you save · /${form.categorySlug}`
              : "Created when you save the product.",
            onChange: (v) => {
              set("categoryName", v);
              set("categorySlug", slugify(v));
            },
          })
        ) : (
          <div className="hidden sm:block" />
        )}
        {text("priceAmount", "Price (PKR)", {
          required: true,
          type: "number",
          placeholder: "0.00",
          hint: "Price per unit. Delivery is calculated separately.",
        })}
        {text("stockQuantity", "Stock available", {
          required: true,
          type: "number",
          placeholder: "0",
          hint: "Units ready to sell. Enter 0 if sold out.",
        })}
        <div className="sm:col-span-2">
          {text("usage", "Short usage line", {
            required: true,
            placeholder: "e.g. For fixing ceramic and porcelain tiles on floors and walls",
            hint: "One sentence shown under the name in the store.",
          })}
        </div>
        <div className="sm:col-span-2">
          {text("slug", "URL slug", {
            required: true,
            hint: creating
              ? `Page address: /products/${form.slug || "…"} · Filled from the name; cannot be changed after creation.`
              : `Page address: /products/${form.slug} · Fixed after creation.`,
            disabled: !creating,
            onChange: (v) => {
              setSlugTouched(true);
              set("slug", v.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
            },
          })}
        </div>
        <label className="flex min-h-11 items-center gap-3 font-semibold sm:col-span-2">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="size-5 accent-forest"
          />
          Visible in the store
          <span className="text-sm font-normal text-muted">
            {form.published
              ? "Customers can see and buy this product."
              : "Saved as a draft; hidden from customers."}
          </span>
        </label>
      </Section>

      <Section title="Description & use">
        <div className="sm:col-span-2">
          {text("description", "Description", {
            rows: 5,
            hint: "Use accurate details from your product label or supplier.",
          })}
        </div>
        {checks(
          "applications",
          "Applications",
          applicationSlugs,
          (v) => appName.get(v) ?? v,
        )}
        {checks("areas", "Use areas", areaSlugs, (v) =>
          v === "interior" ? "Interior" : "Exterior",
        )}
      </Section>

      <Section
        title="Technical details"
        description="Optional. Add only what is printed on the label or confirmed by your supplier."
      >
        <RowsEditor
          id="pf-benefits"
          legend="Benefits"
          columns={[{ key: "value", label: "Benefit", placeholder: "e.g. Water resistant once cured" }]}
          max={12}
          addLabel="Add benefit"
          error={errors.benefits}
          {...stringRows("benefits")}
        />
        <RowsEditor
          id="pf-packSizes"
          legend="Pack sizes"
          columns={[{ key: "value", label: "Pack size", placeholder: "e.g. 20 kg bag" }]}
          max={12}
          addLabel="Add pack size"
          error={errors.packSizes}
          {...stringRows("packSizes")}
        />
        <div className="sm:col-span-2">
          <RowsEditor
            id="pf-specifications"
            legend="Specifications"
            columns={[
              { key: "label", label: "Specification", placeholder: "e.g. Colour" },
              { key: "value", label: "Value", placeholder: "e.g. Grey" },
            ]}
            rows={form.specifications}
            max={30}
            addLabel="Add specification"
            error={errors.specifications}
            onChange={(rows) => set("specifications", rows)}
          />
        </div>
        <div className="sm:col-span-2">
          {text("coverage", "Coverage", {
            rows: 2,
            placeholder: "e.g. Approx. 4–5 kg per m² at 3 mm bed thickness",
          })}
        </div>
        <div className="sm:col-span-2">
          <RowsEditor
            id="pf-faq"
            legend="FAQ"
            columns={[
              { key: "question", label: "Question", placeholder: "Question" },
              { key: "answer", label: "Answer", placeholder: "Answer", multiline: true },
            ]}
            rows={form.faq}
            max={12}
            addLabel="Add question"
            error={errors.faq}
            onChange={(rows) => set("faq", rows)}
          />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <p className="mr-auto text-sm text-muted" aria-live="polite">
          {photoBusy
            ? "Working on photos…"
            : dirty
              ? "Unsaved changes"
              : "No changes yet"}
        </p>
        {!creating && product.published && (
          <Link
            to={`/products/${product.slug}`}
            target="_blank"
            className={buttonClass("ghost", "md")}
          >
            View in store
            <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className={buttonClass("secondary", "md")}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || photoBusy}
          className={buttonClass("primary", "md")}
        >
          {saving && (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          )}
          {saving
            ? gallery.some((g) => g.base64)
              ? "Uploading photos…"
              : "Saving…"
            : creating
              ? "Create product"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default function AdminProductEditPage() {
  const { slug } = useParams();
  const creating = !slug || slug === "new";
  const [state, reload] = useAuthedRemote(
    async (t) =>
      (await adminApi.products(t)).products.find((p) => p.slug === slug) ??
      null,
    `admin-product:${slug}`,
  );

  return (
    <>
      <title>{`${creating ? "New product" : slug} — Admin — VELTO`}</title>
      <AdminHeading
        title={creating ? "New product" : "Edit product"}
        crumbs={[
          { label: "Products", to: "/admin/products" },
          { label: creating ? "New" : (slug ?? "") },
        ]}
      />
      {creating ? (
        <ProductForm />
      ) : (
        <RemoteState state={state} reload={reload} skeleton={3}>
          {(product) =>
            product ? (
              <>
                <ProductForm product={product} />
                <CoveragePanel product={product} />
              </>
            ) : (
              <p className="text-muted">Product not found.</p>
            )
          }
        </RemoteState>
      )}
    </>
  );
}
