import { useImageSize } from "../../features/cms/context.ts";
import {
  imageFrameStyle,
  imageSizeStyle,
} from "../../features/cms/imageSizing.ts";
import { useState } from "react";
import type { CSSProperties } from "react";
import { resolveImageAsset, type ImageAsset } from "../../data/images.ts";

interface ImgProps {
  cmsImage?: {
    page: string;
    field: string;
  };
  image: ImageAsset;
  className?: string;
  /** Pass "" when the image is decorative. */
  alt?: string;
  /** Above-the-fold image: eager load with high fetch priority. */
  priority?: boolean;
  /** Fill a fixed media frame without CMS sizing conflicts. */
  fit?: boolean | "contain";
  /** Show the complete image in normal flow; stale CMS frame sizes must not add blank bands. */
  uncropped?: boolean;
}

/** Responsive, CLS-safe image with CMS sizing and load-error handling. */
export default function Img({
  image,
  className = "",
  alt = image.alt,
  priority = false,
  cmsImage,
  fit = false,
  uncropped = false,
}: ImgProps) {
  const cmsStyle = useImageSize(
    cmsImage?.page ?? "",
    cmsImage?.field ?? "",
  );

  const [failed, setFailed] = useState<string | null>(null);
  const asset = resolveImageAsset(image);

  if (!asset.src || failed === asset.src) {
    return null;
  }

  const sizing = { ...imageSizeStyle(image.displaySize), ...cmsStyle };
  const imageStyle: CSSProperties = uncropped
    ? { width: "100%", height: "auto", maxWidth: "100%", aspectRatio: "auto", objectFit: "contain", display: "block" }
    : fit
      ? { ...sizing, ...imageFrameStyle, objectFit: fit === "contain" ? "contain" : sizing.objectFit ?? "cover", objectPosition: sizing.objectPosition ?? "center", display: "block" }
      : sizing;

  return (
    <img
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      style={imageStyle}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(asset.src)}
      className={className}
    />
  );
}
