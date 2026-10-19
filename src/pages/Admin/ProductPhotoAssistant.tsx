import { useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { call } from "../../features/quotes/api.ts";
import type { AiProductDraft } from "../../features/catalog/aiProduct.ts";
import { useAppAuth } from "../../lib/auth/context.ts";
import { buttonClass } from "../../components/ui/button.ts";
import { inputClass } from "../../components/ui/form/Field.tsx";
import type { GalleryItem } from "./gallery.ts";

/** Downscale to a small JPEG for analysis so two phone photos stay well under the server's 2.5 MB limit. */
async function analysisImage(src: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is unavailable.");
  ctx.fillStyle = "#fff"; // Transparent PNG areas would otherwise turn black.
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
}

export default function ProductPhotoAssistant({
  photos,
  category,
  disabled,
  onDraft,
  onBusy,
}: {
  photos: GalleryItem[];
  category: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onDraft: (draft: AiProductDraft, replace: boolean) => void;
}) {
  const { getToken } = useAppAuth();
  const [context, setContext] = useState("");
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiProductDraft | null>(null);
  const pending = useRef(false);

  const generate = async () => {
    if (!photos.length || pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const images = await Promise.all(
        photos.slice(0, 2).map((p) => analysisImage(p.src)),
      ).catch(() => {
        throw new Error(
          "Could not read the product photos. Upload them again and retry.",
        );
      });
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error("Please sign in again.");
      const { draft } = await call<{ draft: AiProductDraft }>(
        "/api/admin/products/ai-generate",
        {
          method: "POST",
          body: JSON.stringify({
            images,
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

  const notes = result
    ? [...result.reviewNotes, ...result.missingInformation]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <fieldset disabled={disabled || busy} className="min-w-0 space-y-4">
        <label className="block text-sm font-semibold">
          Known product details{" "}
          <span className="font-normal text-muted">(optional)</span>
          <textarea
            maxLength={1500}
            rows={2}
            className={`${inputClass} mt-2 py-3 font-normal`}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. brand, product name, or label text that is hard to read in the photo"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
            className="size-5 accent-forest"
          />
          Overwrite fields I have already filled in
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!photos.length}
            onClick={() => void generate()}
            className={buttonClass("accent")}
          >
            {busy ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden="true" className="size-4" />
            )}
            {busy
              ? "Reading photos…"
              : result
                ? "Fill again from photos"
                : "Fill form from photos"}
          </button>
          <p className="max-w-lg text-sm text-muted">
            {photos.length
              ? "Uses the first two photos (front and back label work best). You can keep editing while it runs."
              : "Add a product photo above to let AI suggest the name, description and details."}
          </p>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}
      {result && (
        <div
          role="status"
          className="rounded-xl border border-forest/20 bg-forest-soft p-4 text-sm"
        >
          <p className="font-semibold">
            Suggestions added · {result.confidence} confidence. Nothing is saved
            yet.
          </p>
          <p className="mt-1">
            {replace
              ? "Filled fields were overwritten."
              : "Only empty fields were filled; your entries were kept."}{" "}
            Check every field against the product label before saving. Price
            and stock are never filled by AI.
          </p>
          {(notes.length > 0 || result.observations.length > 0) && (
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer content-center font-semibold">
                Things to double-check ({notes.length})
              </summary>
              {notes.length > 0 && (
                <ul className="list-disc pl-5">
                  {notes.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              )}
              {result.observations.length > 0 && (
                <>
                  <p className="mt-3 font-semibold">What AI saw in the photos</p>
                  <ul className="list-disc pl-5">
                    {result.observations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </>
              )}
            </details>
          )}
        </div>
      )}
    </div>
  );
}
