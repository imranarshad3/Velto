import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import { inputClass } from "../../components/ui/form/Field.tsx";
import { prepareProductPhoto } from "../../features/catalog/productImage.ts";
import type { ImageAsset } from "../../data/images.ts";
import { toGalleryItem, type GalleryItem } from "./gallery.ts";

const MAX_IMAGES = 8;


export default function ProductGallery({
  items,
  library,
  disabled,
  onChange,
  onBusy,
}: {
  items: GalleryItem[];
  library: ImageAsset[];
  disabled: boolean;
  onChange: (items: GalleryItem[]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const pending = useRef(false);
  const [notes, setNotes] = useState<Record<string, string[]>>({});
  const locked = disabled || busy;
  const full = items.length >= MAX_IMAGES;

  const add = async (files: FileList | null) => {
    if (!files?.length || disabled || pending.current) return;
    setError("");
    const room = MAX_IMAGES - items.length;
    if (files.length > room) {
      setError(
        room
          ? `You can add ${room} more image${room === 1 ? "" : "s"} (up to ${MAX_IMAGES} in total).`
          : `A product can have up to ${MAX_IMAGES} images. Remove one to add another.`,
      );
      if (!room) return;
    }
    pending.current = true;
    setBusy(true);
    onBusy(true);
    const next = [...items];
    try {
      for (const file of Array.from(files).slice(0, room)) {
        const photo = await prepareProductPhoto(file);
        const key = crypto.randomUUID();
        setNotes((current) => ({ ...current, [key]: photo.warnings }));
        next.push({
          key,
          src: photo.preview,
          alt: "",
          width: photo.width,
          height: photo.height,
          base64: photo.base64,
          name: file.name,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare the photo.");
    } finally {
      onChange(next);
      pending.current = false;
      setBusy(false);
      onBusy(false);
    }
  };

  const makeMain = (i: number) =>
    onChange([items[i], ...items.filter((_, n) => n !== i)]);
  const remove = (i: number) => onChange(items.filter((_, n) => n !== i));
  const available = library.filter(
    (img) => !items.some((item) => item.src === img.src),
  );

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <li
              key={item.key}
              className={`flex flex-col overflow-clip rounded-xl border bg-surface ${i ? "border-border" : "border-forest ring-2 ring-forest/20"}`}
            >
              <div className="relative">
                <img
                  src={item.src}
                  alt={i ? `Gallery image ${i + 1}` : "Main product image"}
                  width={item.width}
                  height={item.height}
                  className="aspect-square w-full bg-white object-contain"
                />
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${i ? "bg-white/90 text-ink" : "bg-forest text-white"}`}
                >
                  {i ? `Image ${i + 1}` : "Main image"}
                </span>
                {item.base64 && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-copper px-2 py-0.5 text-xs font-semibold text-white">
                    New
                  </span>
                )}
              </div>
              <div className="flex border-t border-border">
                {i > 0 && (
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => makeMain(i)}
                    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-forest hover:bg-forest-soft/60"
                  >
                    <Star aria-hidden="true" className="size-4" />
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => remove(i)}
                  aria-label={`Remove ${i ? `image ${i + 1}` : "main image"}`}
                  className={`flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold text-danger hover:bg-danger-soft ${i ? "w-11 border-l border-border" : "flex-1"}`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  {i === 0 && "Remove"}
                </button>
              </div>
              {notes[item.key]?.map((note) => <p key={note} role="status" className="px-3 pb-3 text-sm text-muted">{note}</p>)}
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void add(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-within:outline-[0.1875rem] focus-within:outline-offset-2 focus-within:outline-forest ${dragging ? "border-forest bg-forest-soft" : "border-forest/30 bg-forest-soft/30 hover:bg-forest-soft/60"} ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          {busy ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-7 animate-spin text-forest"
            />
          ) : (
            <ImagePlus aria-hidden="true" className="size-7 text-forest" />
          )}
          <span className="font-semibold text-forest">
            {busy
              ? "Preparing photos…"
              : items.length
                ? "Add more photos"
                : "Upload product photos"}
          </span>
          <span id="product-photos-hint" className="text-sm text-muted">
            Click to choose or drag files here. JPEG, PNG or WebP, up to 12 MB
            each, {MAX_IMAGES} images in total. The first image is shown in the
            store listing. Photos are automatically sized and optimized for the store, keeping the full product visible.
          </span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="product-photos-hint"
            disabled={disabled || busy}
            className="sr-only"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {!full && available.length > 0 && (
        <label className="flex flex-col gap-1.5 text-[0.875rem] font-semibold">
          Or add an existing image
          <select
            value=""
            disabled={locked}
            onChange={(e) => {
              const image = available.find((i) => i.src === e.target.value);
              if (image) onChange([...items, toGalleryItem(image)]);
            }}
            className={`${inputClass} font-normal`}
          >
            <option value="">Choose from Media Library or site images…</option>
            {available.map((img) => (
              <option key={img.src} value={img.src}>
                {img.src.startsWith("/images/")
                  ? img.src.replace("/images/", "")
                  : `Library · ${img.alt}`}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
