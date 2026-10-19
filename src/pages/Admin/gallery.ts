import type { ImageAsset } from "../../data/images.ts";

/** A saved image, or a new upload (has base64) that is stored in the Media Library on save. */
export interface GalleryItem extends ImageAsset {
  key: string;
  base64?: string;
  name?: string;
}

export const toGalleryItem = (image: ImageAsset): GalleryItem => ({
  ...image,
  key: image.src,
});
