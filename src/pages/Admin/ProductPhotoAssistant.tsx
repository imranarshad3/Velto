import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Sparkles, X } from "lucide-react";
import { prepareImage } from "../../features/cms/image.ts";
import { call } from "../../features/quotes/api.ts";
import type { AiProductDraft } from "../../features/catalog/aiProduct.ts";
import { useAppAuth } from "../../lib/auth/context.ts";
import { buttonClass } from "../../components/ui/button.ts";
import { inputClass } from "../../components/ui/form/Field.tsx";

export interface ProductPhoto {
  base64: string;
  preview: string;
  width: number;
  height: number;
  name: string;
}

export default function ProductPhotoAssistant({
  category,
  disabled,
  onPhotos,
  onDraft,
  onBusy,
}: {
  category: string;
  disabled: boolean;
  onPhotos: (photos: ProductPhoto[]) => void;
  onBusy: (busy: boolean) => void;
  onDraft: (draft: AiProductDraft, replace: boolean) => void;
}) {
  const { getToken } = useAppAuth();
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [context, setContext] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiProductDraft | null>(null);
  const pending = useRef(false);
  const choose = async (files: FileList | null) => {
    if (!files?.length || disabled || pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      if (photos.length + files.length > 8)
        throw new Error(
          "You can upload up to 8 product images. Remove an image before adding another.",
        );
      const next: ProductPhoto[] = [...photos];
      for (const file of Array.from(files))
        next.push({
          ...(await prepareImage(file, "original")),
          name: file.name,
        });
      setPhotos(next);
      onPhotos(next);
      setResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare the photo.");
    } finally {
      pending.current = false;
      setBusy(false);
      onBusy(false);
    }
  };
  const generate = async () => {
    if (!photos.length || pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      if (
        photos.slice(0, 2).reduce((n, p) => n + p.base64.length * 0.75, 0) >
        2_500_000
      )
        throw new Error(
          "The first two images are too large for AI analysis. Use smaller front and back-label photos; all 8 images can still be saved.",
        );
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Please sign in again.");
      const { draft } = await call<{ draft: AiProductDraft }>(
        "/api/admin/products/ai-generate",
        {
          method: "POST",
          body: JSON.stringify({
            images: photos.slice(0, 2).map((p) => p.base64),
            context,
            ...(category ? { category } : {}),
          }),
        },
        token,
      );
      onDraft(draft, replace);
      setResult(draft);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "AI generation failed. Please retry.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
      onBusy(false);
    }
  };
  return (
    <div className="sm:col-span-2">
      <fieldset disabled={disabled || busy} className="min-w-0 space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void choose(e.dataTransfer.files);
          }}
          className="rounded-2xl border-2 border-dashed border-forest/30 bg-forest-soft/30 p-5"
        >
          <label
            htmlFor="product-photos"
            className="flex items-center gap-3 font-semibold"
          >
            <ImagePlus aria-hidden="true" className="size-5" />
            Upload product photos
          </label>
          <p id="product-photos-hint" className="mt-2 text-sm text-muted">
            Add up to 8 JPEG, PNG or WebP images, up to 12 MB each. The first is
            your main image; the rest appear in the product gallery. AI reads
            the first two photos (front and back label).
          </p>
          <input
            id="product-photos"
            aria-describedby="product-photos-hint"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className={`${inputClass} mt-4`}
            onChange={(e) => {
              void choose(e.target.files);
              e.target.value = "";
            }}
          />
          {!!photos.length && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <figure key={photo.preview} className="relative w-32">
                  <img
                    src={photo.preview}
                    width={photo.width}
                    height={photo.height}
                    alt={
                      i ? `Gallery preview ${i + 1}` : "Main product preview"
                    }
                    className="aspect-square w-full rounded-xl bg-white object-contain"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 grid size-11 place-items-center rounded-full bg-white shadow"
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => {
                      const next = photos.filter((_, n) => n !== i);
                      setPhotos(next);
                      onPhotos(next);
                      setResult(null);
                    }}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                  <figcaption className="mt-1 text-xs text-muted">
                    {i ? `Gallery image ${i + 1}` : "Main image"}
                  </figcaption>
                  {i > 0 && (
                    <button
                      type="button"
                      className="min-h-11 text-sm font-semibold text-forest"
                      onClick={() => {
                        const next = [
                          photo,
                          ...photos.filter((_, n) => n !== i),
                        ];
                        setPhotos(next);
                        onPhotos(next);
                        setResult(null);
                      }}
                    >
                      Make main
                    </button>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
        <label className="block text-sm font-semibold">
          Known product details (optional)
          <textarea
            maxLength={1500}
            rows={2}
            className={`${inputClass} mt-2`}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add a confirmed brand, product name or label text that is hard to read."
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
            className="size-5 accent-forest"
          />
          Replace existing descriptive fields with AI suggestions
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!photos.length}
            onClick={() => void generate()}
            className={buttonClass()}
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {result ? "Generate again" : "Generate with AI"}
          </button>
          <p className="max-w-lg text-sm text-muted">
            Review suggestions before saving. Enter the selling price and
            available stock yourself.
          </p>
        </div>
      </fieldset>
      {busy && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Preparing or analyzing photos… You can continue editing the fields
          below.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-danger-soft p-3 text-danger"
        >
          {error}
        </p>
      )}
      {result && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-forest/20 bg-forest-soft p-4 text-sm"
        >
          <p className="font-semibold">
            AI suggestions applied · {result.confidence} identification
            confidence
          </p>
          <p className="mt-1">
            {replace
              ? "Existing descriptive fields were replaced."
              : "Only empty fields were filled; your existing entries were kept."}{" "}
            Nothing has been saved or published.
          </p>
          <p className="mt-3 font-semibold">Visible observations</p>
          <ul className="list-disc pl-5">
            {result.observations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
          <p className="mt-3 font-semibold">Review before saving</p>
          <ul className="list-disc pl-5">
            {[...result.reviewNotes, ...result.missingInformation].map(
              (v, i) => (
                <li key={i}>{v}</li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
