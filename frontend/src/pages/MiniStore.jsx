import { useEffect, useState, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { useParams, Link, useLocation } from "react-router-dom";
import ShopContext from '../context/ShopContextInstance';
import { getPrimaryProductImage } from "../utils/productImages";
import Title from "../components/Title";
import usePageMetadata from "../hooks/usePageMetadata";
import MiniStoreDetailSkeleton from "../components/skeletons/MiniStoreDetailSkeleton";
import MiniStoreListSkeleton from "../components/skeletons/MiniStoreListSkeleton";

const RESERVED = new Set([
  "", "home", "about", "contact", "collection", "collections", "cart", "checkout",
  "privacy-policy", "terms", "return-refund", "faqs", "login", "signup",
  "admin", "api", "sitemap.xml", "robots.txt", "search", "account", "orders", "product", "store"
]);

export default function MiniStore({ limit = 8 }) {
  const { api } = useContext(ShopContext);
  const { slug } = useParams();
  const location = useLocation();
  const preloadedStore = location.state?.store;
  const [store, setStore] = useState(() => preloadedStore ?? null);
  const [loading, setLoading] = useState(() => (slug ? !preloadedStore : false));
  const [err, setErr] = useState("");
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const meta = useMemo(() => {
    const baseSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";
    const isDetail = Boolean(baseSlug);

    const storeName = String(store?.displayName || "").trim();
    const title = isDetail
      ? storeName
        ? `${storeName} Mini Store`
        : "Creator Mini Store"
      : "Creator Mini Stores";
    const description = isDetail
      ? store?.bio?.trim?.() ||
        (storeName
          ? `Shop curated looks and creator edits from ${storeName} on TinyMillion.`
          : "Explore curated products from TinyMillion creators.")
      : "Discover TinyMillion creator mini stores and shop limited edition outfits hand-picked by our community.";
    const keywords = isDetail
      ? `${storeName || "TinyMillion"} mini store, TinyMillion creator shops, curated looks`
      : "TinyMillion mini stores, creator shops, curated boutiques";
    const image = isDetail ? store?.bannerUrl || store?.avatarUrl : undefined;
    const canonical = isDetail ? `/${baseSlug}` : "/store";
    const structuredData = ({ absoluteCanonical, pageDescription, absoluteImage, baseTitle, origin }) => {
      if (isDetail) {
        const listItems = Array.isArray(store?.products)
          ? store.products
              .slice(0, 12)
              .map((product, index) => {
                const productId = product?._id || product?.id;
                if (!productId) return null;
                const productUrl = `${origin}/product/${productId}`;
                return {
                  "@type": "ListItem",
                  position: index + 1,
                  url: productUrl,
                  name: product?.name,
                };
              })
              .filter(Boolean)
          : [];

        const schemas = [
          {
            "@context": "https://schema.org",
            "@type": "Store",
            "@id": `${absoluteCanonical}#creator-store`,
            url: absoluteCanonical,
            name: storeName || baseTitle,
            description: store?.bio?.trim?.() || pageDescription,
            image: store?.bannerUrl || store?.avatarUrl || absoluteImage,
          },
        ];

        if (listItems.length > 0) {
          schemas.push({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "@id": `${absoluteCanonical}#store-products`,
            itemListElement: listItems,
          });
        }

        return schemas;
      }

      const storeItems = Array.isArray(stores)
        ? stores
            .slice(0, limit)
            .map((item, index) => {
              const slugValue = item?.slug || item?.customUrl;
              if (!slugValue) return null;
              return {
                "@type": "ListItem",
                position: index + 1,
                url: `${origin}/${slugValue}`,
                name: item?.displayName,
              };
            })
            .filter(Boolean)
        : [];

      return [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${absoluteCanonical}#mini-stores`,
          name: baseTitle,
          description: pageDescription,
          url: absoluteCanonical,
        },
        storeItems.length
          ? {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "@id": `${absoluteCanonical}#mini-store-list`,
              itemListOrder: "http://schema.org/ItemListOrderDescending",
              itemListElement: storeItems,
            }
          : null,
      ].filter(Boolean);
    };

    return { title, description, keywords, canonical, image, structuredData };
  }, [slug, store, stores, limit]);

  usePageMetadata(meta);

  // Individual store by slug
  useEffect(() => {
     const normalisedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";

    if (!normalisedSlug) {
      // On the main /store page we don't need individual store data
      setErr("");
      setStore(null);
      setLoading(false);
      return;
    }

    if (RESERVED.has(normalisedSlug)) {
      setErr("notfound");
      setStore(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const prefetchedMatches =
      preloadedStore?.slug?.toLowerCase?.() === normalisedSlug ||
      preloadedStore?.customUrl?.toLowerCase?.() === normalisedSlug;

    setErr("");
     if (prefetchedMatches) {
      setStore(preloadedStore);
      setLoading(false);
    } else {
      setStore(null);
      setLoading(true);
    }

    (async () => {
      try {
         // Namespace slug fetch to avoid admin route shadowing in Express.
        const { data } = await api.get(`/api/ministores/store/${normalisedSlug}`, {
          params: { productLimit: 24 },
        })
        if (!cancelled) {
          setStore(data);
          setErr("");
        }
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        const code = error?.response?.status;
        setErr(code === 404 ? "notfound" : "network");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
   }, [slug, api, preloadedStore]);

  // Ministores list fetch
  useEffect(() => {
    // Only fetch list when no slug (showing main mini stores page)
    if (slug) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/api/ministores", { params: { limit } });
        if (!cancelled) {
          setStores(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Mini stores load failed:", e);
        }
      } finally {
        if (!cancelled) {
          setStoresLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit, api, slug]);

  // CONDITIONAL RENDERING: Show individual store details if slug exists
  if (slug) {
    if (loading && !store) {
      return <MiniStoreDetailSkeleton />;
    }

    if (err === "notfound") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-4">The store you&rsquo;re looking for doesn&rsquo;t exist.</p>
            <Link to="/store" className="text-blue-600 hover:underline">← Back to Mini Stores</Link>
          </div>
        </div>
      );
    }

    if (err) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Store</h2>
            <p className="text-gray-600 mb-4">Something went wrong. Please try again.</p>
            <Link to="/store" className="text-blue-600 hover:underline">← Back to Mini Stores</Link>
          </div>
        </div>
      );
    }

    // Individual Store Detail View
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/store" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Mini Stores
          </Link>
        </div>

        {/* Store Banner */}
        {store?.bannerUrl && (
          <div className="w-full h-48 md:h-64 bg-gray-200">
            <img
              src={store.bannerUrl}
              alt={store.displayName}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Store Header */}
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-4 md:gap-6">
            {store?.avatarUrl && (
              <img
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-lg"
                src={store.avatarUrl}
                alt={store.displayName}
                loading="lazy"
                decoding="async"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{store?.displayName}</h1>
              {store?.bio && (
                <p className="text-sm md:text-base text-gray-600 mt-1">{store.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Products</h2>
          
          {(!store?.products || store.products.length === 0) ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No products available in this store yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {store.products.map((p) => {
                const image = getPrimaryProductImage(p) || "https://tinymillion.com/images/default-product.png";
                return (
                  <Link 
                    key={p?._id || p?.id} 
                    to={`/product/${p?._id || p?.id || ''}`} 
                    className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                  >
                    {image ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={image}
                          alt={p?.name || 'Product'}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 md:h-56 flex items-center justify-center bg-gray-100 text-xs text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="p-3">
                      <div className="text-sm font-medium line-clamp-2 text-gray-800 mb-1">
                        {p?.name || 'Product'}
                      </div>
                      {typeof p?.price === 'number' && !Number.isNaN(p.price) && (
                        <div className="text-base font-bold text-gray-900">₹{p.price.toLocaleString()}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN VIEW: Mini Stores List
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <Title text1={"CREATOR"} text2={"MINI STORES"} />
          <p className="w-full md:w-3/4 mx-auto text-xs sm:text-sm md:text-base text-gray-600 mt-4">
            Discover the newest styles and trends curated by TinyMillion - where fashion meets individuality.
          </p>
        </div>

        {storesLoading ? (
          <MiniStoreListSkeleton count={limit} />
        ) : stores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No mini stores available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
            {stores.map((s) => (
               <Link
                key={s.slug}
                to={`/${s.slug}`}
                state={{ store: s }} 
                className="group bg-white border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-full h-32 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                  {s.bannerUrl ? (
                    <img
                      src={s.bannerUrl}
                      alt={s.displayName}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src="https://tinymillion.com/images/default-banner.png"
                      alt="Default Banner"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3 flex items-center gap-3">
                  <img
                   src={s.avatarUrl || "https://tinymillion.com/images/default-avatar.png"}
                    alt={s.displayName}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-gray-900 group-hover:text-blue-600 transition-colors">
                      {s.displayName}
                    </div>
                    {s.bio && (
                      <div className="text-xs text-gray-500 line-clamp-1">{s.bio}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

MiniStore.propTypes = {
  limit: PropTypes.number,
};