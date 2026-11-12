import { expect, test } from "@playwright/test";
import { collectConsoleProblems } from "./console";

const sections = ["top", "about", "projects", "skills", "experience", "education", "contact"];

test("home page renders every section without console errors", async ({ page }, testInfo) => {
  const errors = collectConsoleProblems(page);

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

  for (const id of sections) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `test-results/screens/${testInfo.project.name}-${id}.png` });
  }
  const graphs = page.locator("#projects svg[role=img]:visible");
  for (let i = 0; i < (await graphs.count()); i++) {
    await graphs
      .nth(i)
      .screenshot({ path: `test-results/screens/${testInfo.project.name}-graph-${i}.png` });
  }
  await page.screenshot({
    path: `test-results/screens/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("resume PDF is served", async ({ request }) => {
  const res = await request.get("/Jugal_Kakkat_Resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/pdf");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("all content and links are present", async ({ page }) => {
    await page.goto("/");
    for (const text of [
      "Sherpa",
      "Pathfinder",
      "Shrinx",
      "424 unit tests",
      "Zephyr RTOS",
      "Technical Club Mentor",
      "Embedded Software Intern",
      "2023 – Present",
      "HackerRank SQL (Intermediate)",
      "jugalkakkat@gmail.com",
    ]) {
      await expect(
        page.getByText(text, { exact: false }).filter({ visible: true }).first(),
      ).toBeVisible();
    }
    await expect(page.locator('a[href="https://sherpa-study.streamlit.app"]')).toHaveCount(1);
    await expect(page.locator('a[href="tel:+917592028073"]')).toHaveCount(1);
  });
});
