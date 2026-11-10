import { expect, test } from "@playwright/test";

test("home page renders the owner's name and title", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page).toHaveTitle("Jugal Kakkat — Aspiring Agentic AI Engineer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jugal Kakkat");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bodyBg).toBe("rgb(6, 8, 12)");

  const noHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noHorizontalScroll).toBe(true);

  await page.screenshot({
    path: `test-results/screens/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
