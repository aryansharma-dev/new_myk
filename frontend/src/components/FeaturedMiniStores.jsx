import {useEffect, useState} from "react";
import PropTypes from "prop-types";
import Title from "./Title";
import api from "../lib/api";

export default function FeaturedMiniStores({ limit = 8 }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setLoading(false);
        }
      }
    })();
   return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading || !stores.length) return null;

  return (
    <div className="my-10">
      <div className="text-center text-3xl py-8">
        <Title text1={"CREATOR"} text2={"MINI STORES"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover the newest styles and trends curated by TinyMillion - where fashion meets individuality.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {stores.map((s) => (
          <a key={s.slug} href={`/${s.slug}`} className="group border rounded-xl overflow-hidden hover:shadow transition">
            <div className="w-full h-32 md:h-40 bg-gray-100">
              {s.bannerUrl && (
                <img
                  src={s.bannerUrl}
                  alt={s.displayName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3 flex items-center gap-3">
              <img
                src={s.avatarUrl || "https://dummyimage.com/64x64/ddd/555&text=TM"}
                alt={s.displayName}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="font-medium truncate">{s.displayName}</div>
                {s.bio && <div className="text-xs text-gray-500 line-clamp-1">{s.bio}</div>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

FeaturedMiniStores.propTypes = {
  limit: PropTypes.number,
};
