

const shimmer = "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";

const RouteSkeleton = () => (
  <section
    role="status"
    aria-live="polite"
    aria-label="Loading page content"
    className="min-h-[50vh] py-12"
  >
    <p className="sr-only">Loading page content…</p>
    <div className="mx-auto max-w-4xl space-y-6 px-4 animate-pulse">
      <div className={`h-8 w-3/4 rounded-md ${shimmer}`} aria-hidden="true" />
      <div className={`h-4 w-full rounded-md ${shimmer}`} aria-hidden="true" />
      <div className={`h-4 w-5/6 rounded-md ${shimmer}`} aria-hidden="true" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3" aria-hidden="true">
            <div className={`h-32 rounded-lg ${shimmer}`} />
            <div className={`h-4 w-3/4 rounded-md ${shimmer}`} />
            <div className={`h-4 w-1/2 rounded-md ${shimmer}`} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default RouteSkeleton;