# TinyMillion Storefront SEO & Performance Audit

## Bundle & Asset Snapshot
- Vite production build (`npm run build`) produces a main bundle of **~290 kB** before compression (≈103 kB gzip) and a global stylesheet of **≈36 kB** (≈7.4 kB gzip).
- Hero and key marketing images dominate payload: `hero_img.png` (~1.7 MB), `about_img.png` (~1.2 MB), and `contact_img.png` (~1.0 MB).
- Third-party scripts are limited to Razorpay (conditionally loaded) and React Toastify; no additional analytics scripts were detected in the bundle output.

## Critical Rendering Path & Core Web Vitals Observations
- Before lazy loading, all route components were bundled together, delaying first render. Route-level `React.lazy` now defers non-critical code.
- Largest Contentful Paint (LCP) risk: the hero PNG exceeds 1 MB and is not preloaded as a modern format. It is also render-blocking for the homepage hero section.
- Cumulative Layout Shift (CLS) is low thanks to defined image dimensions; however, skeletons further stabilise perceived load during data fetches.
- First Input Delay / Interaction to Next Paint (INP) is primarily gated by initial JavaScript parsing; lighter routes from code-splitting and skeleton placeholders reduce main-thread contention.

## Recommended Optimisations
1. **Convert hero and marketing imagery to WebP/AVIF** and serve responsive sources (`<picture>`). Aim for sub-250 kB variants while retaining high-DPI fallbacks.
2. **Introduce image CDNs or Vite imagetools** for automatic resizing and compression of catalogue and store banners.
3. **Adopt route-aware preloading:** use `<link rel="prefetch">` for frequently navigated dynamic routes (e.g., `/collection`, `/store`) based on analytics.
4. **Audit Toastify usage**; replace long-lived toasts with lighter inline notifications where possible to reduce hydration cost.
5. **Defer Razorpay SDK** so it only loads when the payment option is required, minimising third-party script blocking.
6. **Measure Core Web Vitals in production** using Lighthouse CI or Web Vitals tracking to verify improvements and catch regressions.

## Action Plan
| Action | Owner | Effort | Notes |
| --- | --- | --- | --- |
| Compress hero, about, and contact imagery to WebP/AVIF with responsive breakpoints | Design + Frontend | 2 days | Prioritise homepage hero (largest LCP offender). |
| Add Vite imagetools or third-party CDN (e.g., Cloudinary) for catalogue thumbnails | Frontend Platform | 3 days | Automate resizing for MiniStore and product grids. |
| Defer Razorpay SDK load until user selects an online payment method | Frontend Checkout | 1 day | Improves thread idle time on Place Order flow. |
| Implement analytics-driven route prefetching (e.g., on hover) | Frontend Platform | 1.5 days | Use `router.prefetch` or dynamic import hints. |
| Introduce Web Vitals monitoring via Google Analytics 4 or Perfume.js | Growth Engineering | 1 day | Capture LCP/CLS/INP in production dashboards. |
| Review Toastify usage and migrate success messages to lightweight, accessible alerts | UX + Frontend | 1 day | Reduces JS execution and improves accessibility. |
| Evaluate lazy-hydration for non-critical homepage sections (Newsletter, Policy tiles) | Frontend Platform | 2 days | Further trims main-thread work post-LCP. |

## Quick Wins
- Swap current PNG hero assets for optimised WebP exports (≤250 kB) to immediately reduce LCP.
- Enable HTTP compression (gzip/brotli) for static assets if not already served by CDN.
- Preload critical font(s) used in hero typography to avoid flash of unstyled text.
- Inline critical CSS for the above-the-fold hero section or adopt Tailwind JIT `@apply` to trim unused utilities in the initial render.
- Continue using skeleton placeholders for data-heavy routes (MiniStore detail/list) to maintain perceived performance while API calls resolve.