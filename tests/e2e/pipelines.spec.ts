import { expect, test, type Page } from "@playwright/test";
import { collectConsoleProblems } from "./console";

// Low tier: lightest hero, no particle field — keeps headless frame rates usable.
const URL = "/?debug=1&tier=low";

const visibleGraph = (page: Page, project: string) =>
  page.locator(`svg[data-pipeline="${project}"]:visible`);

async function reveal(page: Page, project: string) {
  const g = visibleGraph(page, project);
  await g.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  return g;
}

test.describe("pipeline diagrams (A4)", () => {
  test("Sherpa: tokens run and the HITL gate shows approval", async ({ page }) => {
    const errors = collectConsoleProblems(page);
    await page.goto(URL);
    const g = await reveal(page, "sherpa");
    await expect(g.locator("[data-fx] circle").first()).toBeAttached({ timeout: 15_000 });
    await expect(g.locator("[data-fx] text", { hasText: "✓ approved" })).toBeAttached({
      timeout: 30_000,
    });
    await g.screenshot({
      path: `test-results/screens/pipeline-sherpa-${test.info().project.name}.png`,
    });
    expect(errors).toEqual([]);
  });

  test("Pathfinder: the search budget counts down in graph state", async ({ page }) => {
    await page.goto(URL);
    const g = await reveal(page, "pathfinder");
    const budget = g.locator('[data-node="budget"] [data-node-label]');
    await expect(budget).toHaveText("budget 8/8 · graph state", { timeout: 15_000 });
    await expect(budget).toHaveText("budget 7/8 · graph state", { timeout: 30_000 });
    await g.screenshot({
      path: `test-results/screens/pipeline-pathfinder-${test.info().project.name}.png`,
    });
  });

  test("Shrinx: bcrypt works while a second request passes through", async ({ page }) => {
    await page.goto(URL);
    const g = await reveal(page, "shrinx");
    await expect(g.locator("[data-fx] rect[stroke-dasharray]")).toBeAttached({ timeout: 20_000 });
    await g.screenshot({
      path: `test-results/screens/pipeline-shrinx-${test.info().project.name}.png`,
    });
  });

  test("stat chips count up to the exact resume figures", async ({ page }) => {
    await page.goto(URL);
    // Near (not at) the projects section: the lazy enhancer loads, chips are still off-screen.
    await page.locator("#about").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-pipeline-root] > div[aria-hidden]").first()).toBeAttached({
      timeout: 15_000,
    });
    // Before a chip is reached it waits at 0 — proves the count-up actually runs.
    const unit = page.locator("#projects [data-stat]", { hasText: "424 unit tests" }).first();
    await expect(unit.locator("[data-stat-num]")).toHaveText("0", { timeout: 15_000 });
    // And edges not yet reached are hidden for their draw-in.
    const undrawn = await page
      .locator('svg[data-pipeline="shrinx"]:visible [data-edge]')
      .first()
      .evaluate((p) => (p as SVGPathElement).style.strokeDashoffset);
    expect(Number(undrawn)).toBeGreaterThan(0);
    const chips = page.locator("#projects [data-stat]");
    const n = await chips.count();
    for (let i = 0; i < n; i++) {
      await chips.nth(i).scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(500);
    for (let i = 0; i < n; i++) {
      const chip = chips.nth(i);
      const truth = await chip.locator(".sr-only").textContent();
      await expect(chip.locator('[aria-hidden="true"]')).toHaveText(truth!, { timeout: 15_000 });
      await expect(chip).toHaveCSS("opacity", "1");
    }
  });

  test("node tooltips open on keyboard focus and close on Escape", async ({ page }) => {
    await page.goto(URL);
    await reveal(page, "sherpa");
    const node = visibleGraph(page, "sherpa").locator('[data-node="sandbox"]');
    await expect
      .poll(() => page.locator("[data-pipeline-root] > div[aria-hidden]").count(), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
    await node.focus();
    const tip = page.locator("[data-pipeline-root] > div[aria-hidden]").first();
    await expect(tip).toHaveText(/2-layer sandbox \(AST allowlist/);
    await expect(tip).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(tip).toHaveCSS("opacity", "0");
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("graphs are fully drawn with no tokens; stats show final values", async ({ page }) => {
      await page.goto(URL);
      const g = await reveal(page, "sherpa");
      await page.waitForTimeout(2000);
      await expect(g.locator("[data-fx] > *")).toHaveCount(0);
      const hidden = await g
        .locator("[data-edge]")
        .evaluateAll(
          (ps) =>
            ps.filter(
              (p) =>
                (p as SVGPathElement).style.strokeDashoffset ||
                (p as SVGPathElement).style.opacity === "0",
            ).length,
        );
      expect(hidden).toBe(0);
      const chip = page.locator("#projects [data-stat]", { hasText: "424 unit tests" }).first();
      await expect(chip.locator('[aria-hidden="true"]')).toHaveText("424 unit tests");
    });
  });
});
