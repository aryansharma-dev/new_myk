import PropTypes from "prop-types";

const shimmer = "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";

const MiniStoreListSkeleton = ({ count = 10 }) => (
  <section
    role="status"
    aria-live="polite"
    aria-label="Loading creator mini stores"
    className="min-h-[50vh]"
  >
    <p className="sr-only">Loading creator mini stores…</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-white p-3 space-y-3" aria-hidden="true">
          <div className={`h-32 md:h-40 w-full rounded-lg ${shimmer}`} />
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${shimmer}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 rounded-md ${shimmer}`} />
              <div className={`h-3 w-2/3 rounded-md ${shimmer}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

MiniStoreListSkeleton.propTypes = {
  count: PropTypes.number,
};

export default MiniStoreListSkeleton;