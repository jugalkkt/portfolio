/**
 * Public origin for canonical URLs, the sitemap and Open Graph (the Vercel production
 * address). Set NEXT_PUBLIC_SITE_URL at build time to override.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jugal-kakkat.vercel.app"
).replace(/\/$/, "");
