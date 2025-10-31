import PropTypes from "prop-types";

const shimmer = "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";

const MiniStoreDetailSkeleton = ({ showProducts = true }) => (
  <section
    role="status"
    aria-live="polite"
    aria-label="Loading mini store details"
    className="min-h-screen bg-gray-50"
  >
    <p className="sr-only">Loading mini store details…</p>
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 animate-pulse">
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className={`h-5 w-5 rounded-full ${shimmer}`} />
        <div className={`h-4 w-32 rounded-md ${shimmer}`} />
      </div>
      <div className={`h-48 md:h-64 w-full rounded-xl ${shimmer}`} aria-hidden="true" />
      <div className="flex items-center gap-4" aria-hidden="true">
        <div className={`h-20 w-20 rounded-full border-4 border-white ${shimmer}`} />
        <div className="space-y-3">
          <div className={`h-6 w-40 rounded-md ${shimmer}`} />
          <div className={`h-4 w-64 rounded-md ${shimmer}`} />
        </div>
      </div>
      {showProducts && (
        <div className="space-y-4" aria-hidden="true">
          <div className={`h-5 w-44 rounded-md ${shimmer}`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className={`h-48 md:h-56 w-full rounded-lg ${shimmer}`} />
                <div className={`h-4 w-3/4 rounded-md ${shimmer}`} />
                <div className={`h-4 w-1/2 rounded-md ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);

MiniStoreDetailSkeleton.propTypes = {
  showProducts: PropTypes.bool,
};

export default MiniStoreDetailSkeleton;