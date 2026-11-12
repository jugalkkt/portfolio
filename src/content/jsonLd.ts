import { education, identity, skills } from "./resume";
import { siteUrl } from "./site";

/** schema.org Person (§9.4), built only from resume.ts. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: identity.name,
    jobTitle: identity.headline,
    url: `${siteUrl}/`,
    image: `${siteUrl}/portrait.webp`,
    email: `mailto:${identity.email.label}`,
    affiliation: {
      "@type": "CollegeOrUniversity",
      name: education[0].institution,
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: education[0].institution,
    },
    sameAs: [identity.github.href, identity.linkedin.href],
    knowsAbout: skills.flatMap((g) => g.items),
  };
}
