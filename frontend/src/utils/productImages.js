const CLOUDINARY_HOST = 'res.cloudinary.com';
const DEFAULT_WIDTH = 400;

const optimiseCloudinaryUrl = (rawUrl, width = DEFAULT_WIDTH) => {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes(CLOUDINARY_HOST)) {
      return trimmed;
    }

    const [prefixPath, restPath] = parsed.pathname.split('/upload/');
    if (restPath === undefined) {
      return trimmed;
    }

    const segments = restPath.split('/').filter(Boolean);
    const widthTransform = `w_${width}`;
    const requiredTransforms = ['f_auto', 'q_auto', 'c_fill', widthTransform];

  if (!segments.length) {
      parsed.pathname = `${prefixPath}/upload/${requiredTransforms.join(',')}`;
      return parsed.toString();
    }

    const firstSegment = segments[0];
    const isVersionSegment = firstSegment.startsWith('v') && Number.isFinite(Number(firstSegment.slice(1)));

    if (isVersionSegment) {
      parsed.pathname = `${prefixPath}/upload/${requiredTransforms.join(',')}/${segments.join('/')}`;
      return parsed.toString();
    }
    const existingParts = firstSegment.split(',').filter(Boolean);
    const merged = [...requiredTransforms];
    existingParts.forEach((part) => {
      if (!part) return;
      if (part.startsWith('w_')) return;
      if (part === 'f_auto' || part === 'q_auto' || part === 'c_fill') return;
      if (!merged.includes(part)) {
        merged.push(part);
      }
    });

    segments[0] = merged.join(',');
    parsed.pathname = `${prefixPath}/upload/${segments.join('/')}`;
    return parsed.toString();
  } catch (error) {
    return trimmed;
  }
};

export const getOptimizedImageUrl = (url, options = {}) => {
  const width = Number(options.width) > 0 ? Number(options.width) : DEFAULT_WIDTH;
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.includes(CLOUDINARY_HOST)) {
    return optimiseCloudinaryUrl(trimmed, width);
  }
  return trimmed;
};

const normaliseImages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

export const getProductImageArray = (product, options = {}) => {
  if (!product) return [];

  const images = normaliseImages(product.images);
  if (images.length) {
    return images.map((img) => getOptimizedImageUrl(img, options));
  }

  const legacyImages = normaliseImages(product.image);
  if (legacyImages.length) {
    return legacyImages.map((img) => getOptimizedImageUrl(img, options));
  }

  return [];
};

export const getPrimaryProductImage = (product, options = {}) => {
  const [firstImage] = getProductImageArray(product, options);
  return firstImage || '';
};