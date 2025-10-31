export const toImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const normalizeProductImages = (product = {}) => {
  const base =
    product && typeof product.toObject === "function" ? product.toObject() : { ...product };
  const images = toImageArray(base.images);
  if (!images.length) {
    images.push(...toImageArray(base.image));
  }
  return { ...base, images };
};