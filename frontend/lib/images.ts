type CloudinaryOptions = {
  width?: number;
  height?: number;
  quality?: number;
  crop?: "fill" | "fit" | "thumb" | "scale";
  gravity?: "auto" | "center" | "face" | "north" | "south" | "east" | "west";
};

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

function isCloudinaryUrl(src: string) {
  return src.includes("res.cloudinary.com") && src.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

export function getOptimizedImageSrc(src: string, options: CloudinaryOptions = {}) {
  if (!src || !isCloudinaryUrl(src)) {
    return src;
  }

  const {
    width,
    height,
    quality = 70,
    crop = "fill",
    gravity = "auto",
  } = options;

  const transforms = [
    "f_auto",
    `q_${quality}`,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    crop ? `c_${crop}` : null,
    gravity ? `g_${gravity}` : null,
  ]
    .filter(Boolean)
    .join(",");

  return src.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transforms}/`);
}

export function dedupeImageList(images: string[]) {
  return Array.from(new Set(images.filter(Boolean)));
}

export function buildProductGallery(mainImage: string, images: string[] = []) {
  return dedupeImageList([mainImage, ...images].filter(Boolean));
}

