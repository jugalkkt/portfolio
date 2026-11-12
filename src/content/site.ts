/**
 * Public origin for canonical URLs, the sitemap and Open Graph. PROPOSED until the Vercel
 * project name is approved in Phase 8; set NEXT_PUBLIC_SITE_URL at build time to override.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jugal-kakkat.vercel.app"
).replace(/\/$/, "");
