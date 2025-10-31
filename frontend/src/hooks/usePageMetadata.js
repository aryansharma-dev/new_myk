import { useEffect, useMemo } from "react";
import heroImage from "../assets/hero_img.png";

const SITE_NAME = "TinyMillion";
const DEFAULT_DESCRIPTION =
  "TinyMillion curates statement fashion, jewellery, and lifestyle essentials crafted for modern trendsetters.";
const DEFAULT_KEYWORDS =
  "TinyMillion, fashion, jewellery, lifestyle, online shopping, streetwear, creator stores";

const DEFAULT_IMAGE = heroImage;
const DEFAULT_LOCALE = "en_IN";
const JSON_LD_SELECTOR = "script[data-page-structured='true']";
const FALLBACK_SITE_ORIGIN = "https://tinymillion.com";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

const normaliseOrigin = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.origin;
  } catch (error) {
    try {
      return new URL(String(value).trim().replace(/\/+$/, ""), FALLBACK_SITE_ORIGIN).origin;
    } catch (_) {
      return "";
    }
  }
};

const ENV_SITE_ORIGIN = normaliseOrigin(import.meta.env.VITE_SITE_URL);

const computeSiteOrigin = () => {
  if (ENV_SITE_ORIGIN) return ENV_SITE_ORIGIN;
  if (isBrowser) return window.location.origin;
  return FALLBACK_SITE_ORIGIN;
};

const SITE_ORIGIN = computeSiteOrigin();

const SITE_ORIGIN_URL = (() => {
  try {
    return new URL(SITE_ORIGIN);
  } catch (error) {
    return new URL(FALLBACK_SITE_ORIGIN);
  }
})();

const normaliseText = (value, fallback = "") => {
  if (typeof value === "number") return String(value);
  if (!value) return fallback;
  return String(value).replace(/\s+/g, " ").trim() || fallback;
};

const ensureTag = (selector, create) => {
  if (!isBrowser) return null;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

const updateMetaName = (name, content) => {
  if (!isBrowser || !name) return;
  const value = normaliseText(content);
  const meta = ensureTag(`meta[name="${name}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("name", name);
    return el;
  });
  if (meta) {
    meta.setAttribute("content", value);
  }
};

const updateMetaProperty = (property, content) => {
  if (!isBrowser || !property) return;
  const value = normaliseText(content);
  const meta = ensureTag(`meta[property="${property}"]`, () => {
    const el = document.createElement("meta");
    el.setAttribute("property", property);
    return el;
  });
  if (meta) {
    meta.setAttribute("content", value);
  }
};

const updateLink = (rel, href) => {
  if (!isBrowser || !rel || !href) return;
  const link = ensureTag(`link[rel="${rel}"]`, () => {
    const el = document.createElement("link");
    el.setAttribute("rel", rel);
    return el;
  });
  if (link) {
    link.setAttribute("href", href);
  }
};

const toAbsoluteUrl = (value) => {
  const base = SITE_ORIGIN_URL;
  if (!value) {
    return base.href;
  }
  try {
    const candidate = new URL(value, base);
    if (candidate.origin !== base.origin) {
      candidate.protocol = base.protocol;
      candidate.host = base.host;
    }
    return candidate.href;
  } catch (error) {
    const path = String(value);
    if (path.startsWith("/")) {
      return `${base.origin}${path}`;
    }
    return `${base.origin}/${path}`;
  }
};

const getOriginFromUrl = (value) => {
  try {
    return new URL(value).origin;
  } catch (error) {
    return SITE_ORIGIN_URL.origin;
  }
};

const updateStructuredData = (payload) => {
  if (!isBrowser) return;
  const existing = document.head.querySelector(JSON_LD_SELECTOR);
  if (!payload || payload.length === 0) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  const script = existing ?? (() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-page-structured", "true");
    document.head.appendChild(el);
    return el;
  })();

  script.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload, null, 2);
};

const computeStructuredData = (
  defaults,
  structuredDataInput,
  origin
) => {
  const baseWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  };

  const baseWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${defaults.absoluteCanonical}#webpage`,
    url: defaults.absoluteCanonical,
    name: defaults.baseTitle,
    description: defaults.pageDescription,
    isPartOf: { "@id": `${origin}/#website` },
    primaryImageOfPage: defaults.absoluteImage,
    inLanguage: DEFAULT_LOCALE,
  };

  const provided = (() => {
    if (!structuredDataInput) return [];
    const resolved =
      typeof structuredDataInput === "function"
        ? structuredDataInput(defaults)
        : structuredDataInput;
    const arr = Array.isArray(resolved) ? resolved : [resolved];
    return arr.filter((entry) => entry && typeof entry === "object");
  })();

  const merged = [baseWebSite, baseWebPage, ...provided];

  const unique = [];
  const seen = new Set();
  merged.forEach((item) => {
    const key = item?.["@id"] || JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });
  return unique;
};

const truncateDescription = (value) => {
  const text = normaliseText(value, DEFAULT_DESCRIPTION);
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).trim()}...`;
};

const computeTitle = (title) => {
  const cleaned = normaliseText(title);
  return cleaned ? `${cleaned} | ${SITE_NAME}` : SITE_NAME;
};

export const usePageMetadata = ({
  title,
  description,
  keywords,
  canonical,
  image,
  robots = "index, follow",
  structuredData,
} = {}) => {
  const memoised = useMemo(() => {
    const pageTitle = computeTitle(title);
    const baseTitle = normaliseText(title) || SITE_NAME;
    const pageDescription = truncateDescription(description);
    const keywordString = normaliseText(keywords, DEFAULT_KEYWORDS);

    let canonicalUrl = normaliseText(canonical);
    if (!canonicalUrl) {
      canonicalUrl = isBrowser ? window.location.pathname : "/";
    }
    const absoluteCanonical = toAbsoluteUrl(canonicalUrl);

    const resolvedImage = image ? normaliseText(image) : DEFAULT_IMAGE;
    const absoluteImage = toAbsoluteUrl(resolvedImage);

       const origin = getOriginFromUrl(absoluteCanonical) || (isBrowser ? window.location.origin : "");

    const defaults = {
      pageTitle,
      baseTitle,
      pageDescription,
      keywordString,
      absoluteCanonical,
      absoluteImage,
      origin,
    };

    const structured = computeStructuredData(defaults, structuredData, origin);

    return {
      pageTitle,
      baseTitle,
      pageDescription,
      keywordString,
      absoluteCanonical,
      absoluteImage,
      robots,
      structured,
    };
   }, [title, description, keywords, canonical, image, robots, structuredData]);

  useEffect(() => {
    if (!isBrowser) return undefined;

    const {
      pageTitle,
      pageDescription,
      keywordString,
      absoluteCanonical,
      absoluteImage,
      robots: robotsValue,
      structured,
    } = memoised;

    document.title = pageTitle;
    updateMetaName("description", pageDescription);
    updateMetaName("keywords", keywordString);
    updateMetaName("robots", robotsValue);
    updateMetaName("twitter:card", "summary_large_image");
    updateMetaName("twitter:title", pageTitle);
    updateMetaName("twitter:description", pageDescription);
    updateMetaName("twitter:image", absoluteImage);
    updateMetaName("twitter:url", absoluteCanonical);

    updateMetaProperty("og:title", pageTitle);
    updateMetaProperty("og:description", pageDescription);
    updateMetaProperty("og:type", "website");
    updateMetaProperty("og:site_name", SITE_NAME);
    updateMetaProperty("og:url", absoluteCanonical);
    updateMetaProperty("og:image", absoluteImage);
    updateMetaProperty("og:image:secure_url", absoluteImage);
    updateMetaProperty("og:locale", DEFAULT_LOCALE);
    updateMetaProperty("og:image:alt", pageTitle);

    updateLink("canonical", absoluteCanonical);
    updateStructuredData(structured);

    const html = document.documentElement;
    if (html && !html.hasAttribute("lang")) {
      html.setAttribute("lang", DEFAULT_LOCALE.replace("_", "-"));
    }

    return undefined;
  }, [memoised]);
};

export default usePageMetadata;