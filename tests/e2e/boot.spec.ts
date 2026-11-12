import { expect, test } from "@playwright/test";

// The real first visit: no fixture, so sessionStorage starts empty.
test.describe("boot screen", () => {
  test("plays once per tab session, then lifts", async ({ page }) => {
    await page.goto("/");
    const boot = page.locator(".boot");
    await expect(boot).toBeVisible();
    await expect(boot).toHaveAttribute("aria-hidden", "true");
    await expect(boot.getByText("Jugal Kakkat")).toBeVisible();
    await page.screenshot({ path: `test-results/screens/boot-${test.info().project.name}.png` });

    // Never blocks input, even while it is up.
    expect(await boot.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");

    await expect(boot).toBeHidden({ timeout: 4_000 });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-intro", "off");
    await expect(boot).toBeHidden();
  });

  test("lifts on its own without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".boot")).toBeVisible();
    await expect(page.locator(".boot")).toBeHidden({ timeout: 4_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.close();
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("is skipped", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".boot")).toBeHidden();
    });
  });

  test("is skipped when animations are paused", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("jk:motion-paused", "1"));
    await page.goto("/");
    await expect(page.locator(".boot")).toBeHidden();
  });

  test("is not on the 404 page", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.locator(".boot")).toHaveCount(0);
  });
});
