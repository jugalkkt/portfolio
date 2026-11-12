import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { copy } from "@/content/copy";
import { identity, skills } from "@/content/resume";
import { siteUrl } from "@/content/site";

test.describe("SEO and sharing (§9.4)", () => {
  test("metadata, Open Graph, Twitter card and icons", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(copy.siteTitle);
    const meta = (sel: string) => page.locator(sel).first().getAttribute("content");
    const description = await meta('meta[name="description"]');
    expect(description).toBe(copy.metaDescription);
    expect(description!.length).toBeLessThanOrEqual(155);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(`${siteUrl}/`);
    expect(await meta('meta[name="theme-color"]')).toBe("#06080C");
    expect(await meta('meta[property="og:image"]')).toBe(`${siteUrl}/og.jpg`);
    expect(await meta('meta[property="og:image:width"]')).toBe("1200");
    expect(await meta('meta[property="og:image:height"]')).toBe("630");
    expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");

    for (const path of ["/og.jpg", "/favicon.ico", "/favicon.svg", "/apple-touch-icon.png"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
    const og = await request.get("/og.jpg");
    expect((await og.body()).length).toBeLessThan(150 * 1024); // §9.1 image budget
  });

  test("JSON-LD Person is built from the resume", async ({ page }) => {
    await page.goto("/");
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const ld = JSON.parse(raw!);
    expect(ld["@type"]).toBe("Person");
    expect(ld.name).toBe(identity.name);
    expect(ld.jobTitle).toBe(identity.headline);
    expect(ld.email).toBe(`mailto:${identity.email.label}`);
    expect(ld.sameAs).toEqual([identity.github.href, identity.linkedin.href]);
    expect(ld.knowsAbout).toEqual(skills.flatMap((g) => g.items));
    expect(ld.affiliation.name).toBe("Indian Institute of Information Technology Kottayam");
  });

  test("robots.txt and sitemap.xml", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${siteUrl}/</loc>`);
  });

  test("/resume redirects to the PDF and is not indexed", async ({ page, request }) => {
    const html = await (await request.get("/resume/")).text();
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${identity.resumePdfPath}"`);
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    // Headless Chromium downloads PDFs instead of showing them: the refresh fires a download.
    const download = page.waitForEvent("download");
    await page.goto("/resume/").catch(() => {});
    expect((await download).url()).toContain(identity.resumePdfPath);
  });

  test("unknown routes get the 404 page", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res!.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found.");
    await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual(
      [],
    );
  });
});

test.describe("keyboard and touch (§9.2)", () => {
  test("every focusable element shows the focus ring", async ({ page }) => {
    await page.goto("/");
    // Colour transitions also animate outline/stroke colour; read the settled value.
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important}" });
    const seen = new Set<string>();
    const problems: string[] = [];
    for (let i = 0; i < 160; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        // SVG pipeline nodes draw their ring on the node rect instead of an outline.
        const svgRing = el.matches(".pipeline-node")
          ? getComputedStyle(el.querySelector("rect")!).stroke
          : null;
        return {
          key: `${el.tagName}|${el.getAttribute("href") ?? ""}|${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30)}|${Math.round(r.top + scrollY)}`,
          outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
          svgRing,
          visible: r.width > 0 && r.height > 0,
        };
      });
      if (!info) continue;
      if (seen.has(info.key)) break; // wrapped around
      seen.add(info.key);
      const ok = info.svgRing
        ? info.svgRing === "rgb(79, 209, 232)"
        : info.outline === "solid 2px rgb(79, 209, 232)";
      if (!ok || !info.visible) problems.push(`${info.key} → ${info.svgRing ?? info.outline}`);
    }
    expect(seen.size).toBeGreaterThan(20);
    expect(problems).toEqual([]);
  });

  test("interactive elements are at least 44 × 44 px", async ({ page }) => {
    await page.goto("/");
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("a[href], button")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") return false;
          if (el.closest(".sr-only, [hidden]") || el.matches(".skip-link")) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.width < 44 || r.height < 44);
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${el.tagName} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`;
        }),
    );
    expect(small).toEqual([]);
  });
});

test.describe("responsive widths (§9.3)", () => {
  for (const [w, h] of [
    [360, 740],
    [390, 844],
    [844, 390], // landscape phone
    [768, 1024],
    [1024, 768],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ]) {
    test(`${w}×${h}: no horizontal scroll, hero fits`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "runs its own viewports");
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
      await page.screenshot({ path: `test-results/screens/width-${w}x${h}.png` });
    });
  }
});
