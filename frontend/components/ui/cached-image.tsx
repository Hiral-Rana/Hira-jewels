"use client";

import { ImgHTMLAttributes } from "react";
import { useCachedImageSrc } from "@/lib/image-cache";

type CachedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  ttlMs?: number;
};

export function CachedImage({
  src,
  alt,
  ttlMs,
  ...imgProps
}: CachedImageProps) {
  const resolvedSrc = useCachedImageSrc(src, ttlMs);

  if (!resolvedSrc) {
    return null;
  }

  return <img src={resolvedSrc} alt={alt} {...imgProps} />;
}
