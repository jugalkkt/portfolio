import { expect, test } from "@playwright/test";
import { collectConsoleProblems } from "./console";

test.describe("particle flow (A2)", () => {
  test("runs page-wide on desktop and reports FPS while scrolling", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    const errors = collectConsoleProblems(page);
    await page.goto("/?debug=1&tier=high");
    await expect(page.locator("canvas[data-particle-flow]")).toHaveCount(1);
    await expect(page.locator("canvas")).toHaveCount(2); // ≤ 2 WebGL contexts (§9.1)
    await expect
      .poll(() => page.getByTestId("particle-debug").textContent(), { timeout: 10_000 })
      .toMatch(/fps \d+/);

    // Scroll the whole page; sample the A2 readout on the way down.
    const samples: string[] = [];
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(250);
      samples.push((await page.getByTestId("particle-debug").textContent()) ?? "");
    }
    testInfo.annotations.push({
      type: "particle fps while scrolling",
      description: samples.join(" | "),
    });
    await page.evaluate(() =>
      window.scrollTo(0, document.getElementById("projects")!.offsetTop - 200),
    );
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/screens/flow-projects-desktop.png" });
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/screens/flow-handoff-desktop.png" });
    expect(errors).toEqual([]);
  });

  test("is off on phones", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile only");
    await page.goto("/?debug=1");
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas[data-particle-flow]")).toHaveCount(0);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("is off", async ({ page }) => {
      await page.goto("/?debug=1&tier=high");
      await page.waitForTimeout(1500);
      await expect(page.locator("canvas[data-particle-flow]")).toHaveCount(0);
      await expect(page.locator("canvas")).toHaveCount(0);
    });
  });
});

test.describe("layer rail (A3)", () => {
  test("marks the current section and links to each layer", async ({ page }, testInfo) => {
    const rail = page.getByRole("navigation", { name: "Layer index" });
    await page.goto("/");
    if (testInfo.project.name === "mobile") {
      await expect(rail).toBeHidden();
      return;
    }
    await expect(rail.getByRole("link")).toHaveCount(7);
    await expect(rail.locator('[aria-current="true"]')).toHaveAttribute(
      "aria-label",
      "INPUT: Home",
    );

    await rail.getByRole("link", { name: "L3 · SKILLS: Skills" }).click();
    await expect(rail.locator('[aria-current="true"]')).toHaveAttribute(
      "aria-label",
      "L3 · SKILLS: Skills",
    );

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(rail.locator('[aria-current="true"]')).toHaveAttribute(
      "aria-label",
      "OUTPUT: Contact",
    );

    await page.mouse.click(10, 10); // drop focus from the clicked link
    const projects = rail.getByRole("link", { name: "L2 · PROJECTS: Projects" });
    await projects.hover();
    await expect(projects.getByText("L2 · PROJECTS")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: "test-results/screens/rail-desktop.png",
      clip: { x: 1240, y: 240, width: 200, height: 420 },
    });
  });
});
