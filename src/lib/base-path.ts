/**
 * Base path prefix applied when the app is statically exported for a GitHub
 * Pages project site (e.g. "/searchpoint.tech"). Empty string in normal
 * server deployments, so `${basePath}/images/x.png` degrades to `/images/x.png`.
 *
 * Only needed for raw asset URLs (`<source>`, `fetch`, CSS url()). next/link,
 * next/image and metadata icons pick up basePath automatically.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
