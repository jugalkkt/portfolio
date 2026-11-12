# Jugal Kakkat — portfolio

Personal site of Jugal Kakkat, built as a single static page with a neural-network theme:
a live inference network in the hero, particle flow behind the page, animated project
pipelines, a skill graph and a signal-trace timeline. Every section is plain HTML first;
the motion and WebGL are enhancements that switch off for reduced motion, paused
animations, slow devices and browsers without a GPU.

Live: <https://jugal-kakkat.vercel.app>

## Stack

Next.js (App Router, static export) · React · TypeScript · Tailwind CSS v4 ·
three.js with @react-three/fiber · Vitest · Playwright + axe.

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static site in out/
node scripts/serve-out.mjs 4173   # serve out/ locally, gzip on, like production
```

## Editing content

All facts live in one file; nothing else on the page is hand-typed.

| What                                             | Where                                                       |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Name, links, projects, experience, skills, dates | `src/content/resume.ts`                                     |
| Headlines, taglines, button labels, meta text    | `src/content/copy.ts`                                       |
| Section order, nav and layer labels              | `src/content/sections.ts`                                   |
| Project pipeline diagrams                        | `src/content/pipelines.ts`                                  |
| Which skills link to which project in the graph  | `src/content/skillGraph.ts`                                 |
| Resume PDF / portrait                            | `public/Jugal_Kakkat_Resume.pdf`, `public/portrait.webp`    |
| Site address (canonical, sitemap, social image)  | `src/content/site.ts` or the `NEXT_PUBLIC_SITE_URL` env var |

After changing skills or graph links, regenerate the graph layout (a unit test fails if
it is stale):

```bash
npm run build:skill-graph
```

After changing the name or headline, regenerate the social image and icons:

```bash
npm run build:brand
```

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test             # unit tests
npm run build && npm run test:e2e   # browser tests on 390 px and 1440 px
E2E_BASE_URL=https://jugal-kakkat.vercel.app npm run test:e2e   # same tests, live site
```

Append `?debug=1` to the URL for frame-rate readouts, and `&tier=high|medium|low` to pin
the 3D quality tier.

## Deploy

The site is a static export hosted on Vercel. Pushing to `main` deploys to production;
other branches get preview URLs. No environment variables are required; set
`NEXT_PUBLIC_SITE_URL` only if the site moves to a different address.
