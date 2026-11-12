import { expect, test, type Page } from "@playwright/test";
import { collectConsoleProblems } from "./console";

type Bridge = {
  screen: Float32Array;
  firstOutput: number;
  stats: { fps: number; activeEdges: number };
};

async function debugText(page: Page) {
  return (await page.getByTestId("hero-debug").textContent()) ?? "";
}

test.describe("hero inference network (A1)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "WebGL via SwiftShader in Chromium");

  test("canvas replaces the poster and runs without console errors", async ({ page }) => {
    const errors = collectConsoleProblems(page);

    await page.goto("/?debug=1&tier=high");
    await expect(page.locator("#top canvas")).toHaveCount(1, { timeout: 15_000 });
    await expect.poll(() => debugText(page), { timeout: 15_000 }).toMatch(/fps [1-9]/);
    expect(await debugText(page)).toContain("running");
    await page.waitForTimeout(1200);
    await page
      .locator("#top")
      .screenshot({ path: `test-results/screens/hero-live-${test.info().project.name}.png` });
    expect(errors).toEqual([]);
  });

  test("scene uses at most 5 draw calls", async ({ page }) => {
    // Medium tier: no post-processing, so gl.info counts only the scene's draws.
    await page.goto("/?debug=1&tier=medium");
    await expect.poll(() => debugText(page), { timeout: 15_000 }).toMatch(/fps [1-9]/);
    const calls = Number((await debugText(page)).match(/calls (\d+)/)?.[1]);
    expect(calls).toBeGreaterThan(0);
    expect(calls).toBeLessThanOrEqual(5);
  });

  test("output nodes show a label and navigate on click", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "hover is a fine-pointer interaction");
    await page.goto("/?debug=1&tier=high");
    await expect.poll(() => debugText(page), { timeout: 15_000 }).toMatch(/fps [1-9]/);

    // Pause so the network holds still while we aim at a node.
    await page.getByRole("button", { name: "Pause animations" }).first().click();
    await page.waitForTimeout(300);

    const target = await page.evaluate(() => {
      const b = (window as unknown as { __heroBridge: Bridge }).__heroBridge;
      const box = document
        .querySelector("#top canvas")!
        .parentElement!.parentElement!.getBoundingClientRect();
      const i = b.firstOutput; // "About"
      return { x: box.left + b.screen[i * 2], y: box.top + b.screen[i * 2 + 1] };
    });
    await page.mouse.move(target.x - 30, target.y);
    await page.mouse.move(target.x, target.y, { steps: 4 });
    await expect(page.getByText("About →")).toBeVisible();
    await page.screenshot({ path: "test-results/screens/hero-hover-output.png" });

    await page.mouse.click(target.x, target.y);
    await expect
      .poll(() =>
        page.evaluate(() => document.getElementById("about")!.getBoundingClientRect().top),
      )
      .toBeLessThan(200);
  });

  test("pause toggle settles the network", async ({ page }) => {
    await page.goto("/?debug=1&tier=high");
    await expect.poll(() => debugText(page), { timeout: 15_000 }).toMatch(/running/);
    const toggle = page.getByRole("button", { name: "Pause animations" }).last();
    await toggle.click();
    await expect.poll(() => debugText(page)).toContain("idle");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page
      .locator("#top")
      .screenshot({ path: `test-results/screens/hero-paused-${test.info().project.name}.png` });
    await toggle.click();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no WebGL; the static poster is shown", async ({ page }, testInfo) => {
    await page.goto("/?debug=1&tier=high");
    await page.waitForTimeout(1500);
    await expect(page.locator("#top canvas")).toHaveCount(0);
    await expect(page.locator("#top svg").first()).toBeVisible();
    expect(await debugText(page)).toContain("motion reduced");
    await page
      .locator("#top")
      .screenshot({ path: `test-results/screens/hero-reduced-${testInfo.project.name}.png` });
  });
});
