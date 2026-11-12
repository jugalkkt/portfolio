import { expect, test, type Page } from "./fixtures";
import { copy } from "@/content/copy";
import { collectConsoleProblems } from "./console";

const desktopOnly = (name: string) => test.skip(name !== "desktop", "desktop layout");

/** Scrolls without smooth-scrolling so IntersectionObservers fire deterministically. */
async function jumpTo(page: Page, selector: string, offset = 0.3) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string)!;
      const top = el.getBoundingClientRect().top + window.scrollY - innerHeight * (off as number);
      window.scrollTo({ top, behavior: "instant" });
    },
    [selector, offset],
  );
}

/** CSS animations still running (WebGL/canvas loops are checked separately). */
const runningCss = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      // One-off transitions (e.g. the hero poster cross-fade) end on their own; only
      // animations can keep moving.
      .filter((a) => a.playState === "running" && !(a instanceof CSSTransition))
      .map((a) => {
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
        return `${(a as CSSAnimation).animationName ?? "transition"} on ${t?.className}`;
      }),
  );

test.describe("phase 6 motion (full)", () => {
  test("tagline streams token by token but is real text from the start", async ({ page }) => {
    await page.goto("/");
    const tagline = page.locator("[data-stream]");
    expect((await tagline.textContent())!.trim()).toBe(copy.hero.tagline);
    expect(await page.locator(".stream-token").count()).toBe(copy.hero.tagline.split(" ").length);
    // Last token ends visible; its caret has blinked out.
    const last = page.locator(".stream-token.is-last");
    await expect(last).toHaveCSS("opacity", "1", { timeout: 6000 });
    await expect(last.locator(".stream-caret")).toHaveCSS("opacity", "0", { timeout: 6000 });
  });

  test("kickers decode to the exact layer label", async ({ page }) => {
    await page.goto("/");
    const kicker = page.locator("#skills [data-decode]");
    await expect(page.locator("#skills [data-layer-label] .sr-only")).toHaveText("L3 · SKILLS");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
    await page.waitForTimeout(300);
    await jumpTo(page, "#skills");
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      seen.add((await kicker.textContent())!);
      await page.waitForTimeout(40);
    }
    await expect(kicker).toHaveText("L3 · SKILLS");
    expect(seen.size, `frames: ${[...seen].join(" | ")}`).toBeGreaterThan(1);
  });

  test("below-the-fold content reveals once when reached", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
    const card = page.locator("#education [data-reveal]").last();
    await expect(card).toHaveClass(/reveal-pending/);
    await expect(page.locator("#top .reveal-pending")).toHaveCount(0);
    await jumpTo(page, "#education", 0.1);
    await expect(card).not.toHaveClass(/reveal-pending/);
    await expect(card).toHaveCSS("opacity", "1");
  });

  test("timeline fill follows scroll and lights the nodes it reaches", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
    const fill = page.locator("[data-trace-fill]");
    await jumpTo(page, "[data-trace]", 0.6 - 0.1); // signal line is 10 % into the timeline
    await expect.poll(() => fill.evaluate((e) => e.style.transform)).toMatch(/scaleY\(0\.\d+\)/);
    await expect(page.locator(".trace-node.is-lit")).toHaveCount(1);
    await jumpTo(page, "#contact", 0.1);
    await expect.poll(() => fill.evaluate((e) => e.style.transform)).toBe("scaleY(1)");
    await expect(page.locator(".trace-node.is-lit")).toHaveCount(2);
  });

  test("contact nodes converge into the output node, which then pulses", async ({
    page,
  }, testInfo) => {
    const problems = collectConsoleProblems(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
    await jumpTo(page, "#contact", 0.1);
    const lit = () =>
      page.locator("[data-converge]").evaluate((c: HTMLCanvasElement) => {
        // Read through a copy so the test itself doesn't trigger a readback warning.
        const o = new OffscreenCanvas(c.width, c.height).getContext("2d", {
          willReadFrequently: true,
        })!;
        o.drawImage(c, 0, 0);
        const d = o.getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return n;
      });
    await expect.poll(lit, { timeout: 4000 }).toBeGreaterThan(200);
    const node = page.locator("[data-output-node]");
    await expect(node).toHaveClass(/is-pulsing/, { timeout: 6000 });
    expect(await lit()).toBe(0); // the canvas stops drawing once converged
    if (testInfo.project.name === "desktop") {
      await page.locator("[data-email-link]").hover();
      await expect(node).toHaveClass(/is-hit/, { timeout: 2000 });
    }
    await page.locator("#contact").screenshot({
      path: `test-results/screens/contact-${testInfo.project.name}.png`,
    });
    expect(problems).toEqual([]);
  });

  test("cards light up around the pointer; primary CTA leans toward it", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo.project.name);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
    const cta = page.locator("[data-magnetic]");
    const box = (await cta.boundingBox())!;
    await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
    await expect.poll(() => cta.evaluate((e) => e.style.translate)).toMatch(/^[\d.]+px [\d.]+px$/);
    const offs = (await cta.evaluate((e) => e.style.translate)).match(/[\d.]+/g)!.map(Number);
    for (const o of offs) expect(o).toBeLessThanOrEqual(4);

    const card = page.locator("#education [data-glow]").first();
    await jumpTo(page, "#education", 0.1);
    const cb = (await card.boundingBox())!;
    await page.mouse.move(cb.x + 40, cb.y + 30);
    await expect.poll(() => card.evaluate((e) => e.style.getPropertyValue("--mx"))).toBe("40px");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything is static and fully visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await expect(page.locator(".stream-token").first()).toHaveCSS("opacity", "1");
    await expect(page.locator(".stream-caret").first()).toHaveCSS("opacity", "0");
    await expect(page.locator(".reveal-pending")).toHaveCount(0);
    await jumpTo(page, "[data-trace]", 0.2);
    await page.waitForTimeout(300);
    expect(await page.locator("[data-trace-fill]").evaluate((e) => e.style.transform)).toBe("");
    await jumpTo(page, "#contact", 0.1);
    await page.waitForTimeout(1500);
    await expect(page.locator("[data-output-node]")).not.toHaveClass(/is-pulsing/);
    await expect(page.locator("#skills [data-decode]")).toHaveText("L3 · SKILLS");
    expect(await runningCss(page)).toEqual([]);
  });
});

test.describe("pause toggle", () => {
  test("a saved pause applies before first paint: the tagline never animates", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("jk:motion-paused", "1"));
    await page.goto("/");
    const early = await page.evaluate(() => document.documentElement.dataset.motion);
    expect(early).toBe("paused");
    await expect(page.locator(".stream-token").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator(".reveal-pending")).toHaveCount(0);
  });

  test("pausing mid-page stops every CSS animation and the contact canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "running");
    await jumpTo(page, "#contact", 0.1);
    await page.waitForTimeout(700); // convergence is mid-flight
    await page.getByRole("button", { name: "Pause animations" }).last().click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
    await page.waitForTimeout(400); // let in-flight transitions settle
    expect(await runningCss(page)).toEqual([]);
    const frame = () =>
      page
        .locator("[data-converge]")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL().length + ":" + c.toDataURL().slice(-64));
    const a = await frame();
    await page.waitForTimeout(500);
    expect(await frame()).toBe(a);
    await expect(page.locator(".reveal-pending")).toHaveCount(0);
  });
});
