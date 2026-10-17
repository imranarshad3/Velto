import ProductPhotoAssistant, {
  type ProductPhoto,
} from "./ProductPhotoAssistant.tsx";
import { mergeDraft } from "../../features/catalog/aiProduct.ts";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { CircleAlert, LoaderCircle } from "lucide-react";
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
const lines = (v: string) =>
  v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const pairs = (v: string, sep: string) =>
  lines(v).map((l) => l.split(sep).map((p) => p.trim()));

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
  benefits: string;
  specifications: string;
  packSizes: string;
  coverage: string;
  documents: string;
  faq: string;
  image: string;
  imageAlt: string;
  priceAmount: string;
  priceCurrency: string;
  verified: boolean;
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
  benefits: (p?.benefits ?? []).join("\n"),
  specifications: (p?.specifications ?? [])
    .map((s) => `${s.label}: ${s.value}`)
    .join("\n"),
  packSizes: (p?.packSizes ?? []).join("\n"),
  coverage: p?.coverage ?? "",
  documents: (p?.documents ?? [])
    .map((d) => `${d.title} | ${d.url} | ${d.fileType}`)
    .join("\n"),
  faq: (p?.faq ?? []).map((f) => `${f.question} | ${f.answer}`).join("\n"),
  image: p?.image?.src ?? "",
  imageAlt: p?.image?.alt ?? "",
  priceAmount: p?.price ? String(p.price.amount) : "",
  priceCurrency: "PKR",
  verified: p?.verified ?? true,
  published: p?.published ?? true,
  sortOrder: String(p?.sortOrder ?? 0),
});

const toInput = (
  f: FormState,
  options: ImageAsset[] = imageOptions,
): ProductInput => {
  const image = options.find((i) => i.src === f.image);
  return {
    slug: f.slug,
    name: f.name,
    categorySlug: f.categorySlug,
    categoryName: f.categoryName || undefined,
    stockQuantity: f.stockQuantity.trim() ? Number(f.stockQuantity) : null,
    usage: f.usage,
    description: f.description,
    applications: f.applications as ProductInput["applications"],
    areas: f.areas as ProductInput["areas"],
    benefits: lines(f.benefits),
    specifications: lines(f.specifications).map((l) => {
      const i = l.indexOf(":");
      return {
        label: i > 0 ? l.slice(0, i).trim() : l,
        value: i > 0 ? l.slice(i + 1).trim() : "",
      };
    }),
    packSizes: lines(f.packSizes),
    coverage: f.coverage,
    documents: pairs(f.documents, "|").map(
      ([title = "", url = "", fileType = ""]) => ({ title, url, fileType }),
    ),
    faq: pairs(f.faq, "|").map(([question = "", answer = ""]) => ({
      question,
      answer,
    })),
    image: image
      ? { ...image, alt: f.imageAlt.trim() || image.alt }
      : undefined,
    price: { amount: Number(f.priceAmount), currency: "PKR" },
    verified: true,
    published: f.published,
    sortOrder: Number(f.sortOrder) || 0,
  };
};

function ProductForm({ product }: { product?: AdminProduct }) {
  const creating = !product;
  const navigate = useNavigate();
  const { getToken } = useAppAuth();
  const show = useToasts((s) => s.show);
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<ProductPhoto[]>([]);
  const [gallery, setGallery] = useState<ImageAsset[]>(
    product?.images?.length
      ? product.images
      : product?.image
        ? [product.image]
        : [],
  );
  const uploaded = useRef(new Map<string, ImageAsset>());
  const [photoVersion, setPhotoVersion] = useState(0);
  const [categories, setCategories] = useState<
    { slug: string; name: string }[]
  >(() =>
    categorySlugs.map((slug) => ({
      slug,
      name: demoCategories.find((c) => c.slug === slug)?.name ?? slug,
    })),
  );
  const [newCategory, setNewCategory] = useState(false);
  useEffect(() => {
    let active = true;
    void getToken()
      .then((t) => (t ? adminApi.products(t) : null))
      .then((r) => {
        if (active && r)
          setCategories((current) => [
            ...new Map(
              [
                ...current,
                ...r.products.map((p) => ({
                  slug: p.categorySlug,
                  name:
                    p.categoryName ||
                    demoCategories.find((c) => c.slug === p.categorySlug)
                      ?.name ||
                    p.categorySlug.replaceAll("-", " "),
                })),
              ].map((c) => [c.slug, c]),
            ).values(),
          ]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [getToken]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  // Media Library images are offered alongside bundled ones; dimensions are read so the storefront reserves aspect ratio.
  const [options, setOptions] = useState<ImageAsset[]>(() =>
    product?.image && !imageOptions.some((i) => i.src === product.image!.src)
      ? [...imageOptions, product.image]
      : imageOptions,
  );
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
            setOptions((prev) => [
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
  const toggle = (key: "applications" | "areas", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value)
        ? f[key].filter((v) => v !== value)
        : [...f[key], value],
    }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || photoBusy) return;
    setFormError(null);
    const candidate = {
      ...toInput(form, options),
      images: gallery,
      published: creating ? true : form.published,
    };
    if (!form.stockQuantity.trim()) {
      setErrors({ stockQuantity: "Enter available stock (0 for sold out)." });
      setFormError("Enter the available quantity.");
      document.getElementById("pf-stockQuantity")?.focus();
      return;
    }
    const parsed = productInputSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      setFormError("Please correct the highlighted fields.");
      document
        .getElementById(
          `pf-${Object.keys(next)[0] === "price" ? "priceAmount" : Object.keys(next)[0] === "categorySlug" ? "categorySelect" : Object.keys(next)[0]}`,
        )
        ?.focus();
      return;
    }
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
      if (pendingPhotos.length) {
        const images: ImageAsset[] = [];
        for (const photo of pendingPhotos) {
          let image = uploaded.current.get(photo.base64);
          if (!image) {
            const { media } = await workspaceApi.upload(
              token,
              {
                name: form.name || photo.name,
                alt: form.imageAlt || form.name,
                folder: "Products",
                tags: [],
              },
              photo.base64,
            );
            image = {
              src: media.url,
              alt: form.imageAlt || form.name,
              width: photo.width,
              height: photo.height,
            };
            uploaded.current.set(photo.base64, image);
          }
          images.push(image);
        }
        input.images = images;
        input.image = images[0];
        setGallery(images);
        setOptions((prev) => [
          ...prev,
          ...images.filter((img) => !prev.some((p) => p.src === img.src)),
        ]);
        set("image", images[0].src);
        setPendingPhotos([]);
        setPhotoVersion((v) => v + 1);
      } else {
        const selected = input.image;
        input.images = selected
          ? [
              selected,
              ...gallery.filter((img) => img.src !== selected.src),
            ].slice(0, 8)
          : gallery;
        input.image = input.images[0];
      }
      if (creating) await adminApi.createProduct(token, input);
      else await adminApi.updateProduct(token, product.slug, input);
      show(`${input.name} saved`);
      navigate("/admin/products");
    } catch (err) {
      const apiErr = err instanceof QuoteApiError ? err : null;
      const fe: Record<string, string> = {};
      for (const [k, v] of Object.entries(apiErr?.fieldErrors ?? {}))
        fe[k.split(".")[0]] ??= v;
      setErrors(fe);
      setFormError(apiErr?.message ?? "Could not save. Please try again.");
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
      disabled?: boolean;
    } = {},
  ) => (
    <Field
      id={`pf-${key}`}
      label={label}
      required={opts.required}
      hint={opts.hint}
      error={
        errors[
          key === "priceAmount" || key === "priceCurrency"
            ? "price"
            : key === "imageAlt"
              ? "image"
              : key
        ]
      }
    >
      {(a) =>
        opts.rows ? (
          <textarea
            {...a}
            rows={opts.rows}
            value={form[key] as string}
            onChange={(e) => set(key, e.target.value as never)}
            className={`${inputClass} py-3`}
          />
        ) : (
          <input
            {...a}
            type={
              key === "stockQuantity" || key === "priceAmount"
                ? "number"
                : "text"
            }
            min={
              key === "stockQuantity"
                ? 0
                : key === "priceAmount"
                  ? 0.01
                  : undefined
            }
            step={
              key === "stockQuantity"
                ? 1
                : key === "priceAmount"
                  ? 0.01
                  : undefined
            }
            value={form[key] as string}
            disabled={opts.disabled}
            onChange={(e) => set(key, e.target.value as never)}
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
      <legend className="text-[0.875rem] font-semibold">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-x-4">
        {options.map((o) => (
          <label key={o} className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={form[key].includes(o)}
              onChange={() => toggle(key, o)}
              className="size-[1.125rem] accent-forest"
            />{" "}
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

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {formError && (
        <p
          role="alert"
          className="flex gap-2 rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />{" "}
          {formError}
        </p>
      )}
      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">
          Product photos & AI assistant
        </h2>
        <ProductPhotoAssistant
          category={form.categorySlug}
          disabled={saving}
          key={photoVersion}
          onBusy={setPhotoBusy}
          onPhotos={setPendingPhotos}
          onDraft={(draft, replace) => {
            setForm((current) =>
              mergeDraft(current, draft, replace, creating, form),
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
        <Field
          id="pf-image"
          label="Image"
          error={errors.image}
          hint="Bundled images and Media Library uploads."
        >
          {(a) => (
            <select
              {...a}
              value={form.image}
              disabled={pendingPhotos.length > 0}
              onChange={(e) => set("image", e.target.value)}
              className={inputClass}
            >
              <option value="">No image (placeholder)</option>
              {options.map((img) => (
                <option key={img.src} value={img.src}>
                  {img.src.startsWith("/images/")
                    ? img.src.replace("/images/", "")
                    : `Library · ${img.alt}`}
                </option>
              ))}
            </select>
          )}
        </Field>
        {text("imageAlt", "Image alt text")}

        {!pendingPhotos.length && gallery.length > 1 && (
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            {gallery.map((img) => (
              <div key={img.src} className="w-28">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="aspect-square w-full rounded-xl object-contain"
                />
                <button
                  type="button"
                  className="min-h-11 text-sm text-danger"
                  onClick={() => {
                    const next = gallery.filter((i) => i.src !== img.src);
                    setGallery(next);
                    if (form.image === img.src)
                      set("image", next[0]?.src ?? "");
                  }}
                >
                  Remove image
                </button>
              </div>
            ))}
          </div>
        )}
        {!pendingPhotos.length && form.image && (
          <img
            src={form.image}
            alt={form.imageAlt || "Selected product image"}
            className="max-h-48 w-full rounded-xl object-contain sm:col-span-2"
          />
        )}
        {pendingPhotos.length > 0 && (
          <p className="text-sm text-muted sm:col-span-2">
            These uploaded images will replace the current gallery when you
            save.
          </p>
        )}
      </section>
      {aiApplied && (
        <p className="rounded-xl bg-forest-soft p-4 text-sm text-forest">
          This form contains AI suggestions. Check each field against your
          product label or supplier information before publishing.
        </p>
      )}
      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">Basics</h2>
        {text("name", "Name", { required: true })}
        {text("slug", "URL slug", {
          required: true,
          hint: creating
            ? "Lowercase letters, numbers and hyphens. Cannot be changed later."
            : "Fixed after creation.",
          disabled: !creating,
        })}
        <Field
          id="pf-categorySelect"
          label="Category"
          required
          error={errors.categorySlug}
        >
          {(a) => (
            <select
              {...a}
              value={form.categorySlug}
              onChange={(e) => {
                set("categorySlug", e.target.value);
                set(
                  "categoryName",
                  categories.find((c) => c.slug === e.target.value)?.name ?? "",
                );
              }}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {text("stockQuantity", "Available quantity", {
          required: true,
          hint: "Units available to buy. Enter 0 for sold out.",
        })}
        <div className="sm:col-span-2">
          <button
            type="button"
            className="min-h-11 font-semibold text-forest"
            onClick={() => setNewCategory((v) => !v)}
          >
            {newCategory ? "Close category editor" : "+ Create a category"}
          </button>
          <p className="text-sm text-muted">
            Generate with AI above to suggest a category from your photos. New
            categories are created when you save the product.
          </p>
          {newCategory && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {text("categoryName", "Category name", { required: true })}
              {text("categorySlug", "Category URL slug", {
                required: true,
                hint: "Lowercase words separated by hyphens.",
              })}
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          {text("usage", "Short usage line", { required: true })}
        </div>
        <div className="sm:col-span-2">
          {text("description", "Description", {
            rows: 4,
            hint: "Use accurate details from your product or supplier.",
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
      </section>

      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">
          Technical information
        </h2>
        {text("benefits", "Benefits", { rows: 4, hint: "One per line." })}
        {text("specifications", "Specifications", {
          rows: 4,
          hint: "One per line as “Label: Value”.",
        })}
        {text("packSizes", "Pack sizes", {
          rows: 3,
          hint: "One per line, e.g. “20 kg bag”.",
        })}
        {text("coverage", "Coverage", { rows: 3 })}
        <div className="sm:col-span-2">
          {text("faq", "FAQ", {
            rows: 3,
            hint: "One per line as “Question | Answer”.",
          })}
        </div>
      </section>

      <section className="grid gap-[var(--grid-gap)] surface-card p-5 sm:grid-cols-2">
        <h2 className="font-display text-[1.375rem] sm:col-span-2">
          Price & visibility
        </h2>
        {text("priceAmount", "Price (PKR)", {
          required: true,
          hint: "Price per unit. Delivery is calculated separately.",
        })}
        {creating ? (
          <p className="text-sm font-semibold text-forest sm:col-span-2">
            New products are published when you click Create product.
          </p>
        ) : (
          <label className="flex min-h-11 items-center gap-3 font-semibold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="size-5 accent-forest"
            />
            Published in the store
          </label>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="inline-flex min-h-12 items-center rounded-lg border border-ink/15 bg-surface px-5 font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || photoBusy}
          className={buttonClass("primary", "lg")}
        >
          {saving && (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          )}{" "}
          {creating ? "Create product" : "Save product"}
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
