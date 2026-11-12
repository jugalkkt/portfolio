import { expect, test } from "./fixtures";

const graph = "[data-skill-graph]";

/** Skill names currently lit (hover rule sets opacity 1 + signal colour). */
async function lit(page: import("@playwright/test").Page) {
  return page.$$eval(`${graph} [data-skill]`, (els) =>
    els
      .filter(
        (e) =>
          getComputedStyle(e).color === "rgb(79, 209, 232)" && getComputedStyle(e).opacity === "1",
      )
      .map((e) => e.getAttribute("data-skill")),
  );
}

test.describe("skill graph", () => {
  test("desktop: hover a project lights exactly its skills", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "graph is desktop-only");
    await page.goto("/");
    const svg = page.locator(graph);
    await svg.scrollIntoViewIfNeeded();
    await expect(svg).toBeVisible();

    const expected: Record<string, string[]> = {
      sherpa: ["LangGraph", "DeepEval", "Python", "Streamlit"],
      pathfinder: ["LangGraph", "Python", "Streamlit"],
      shrinx: ["Python", "FastAPI", "JWT Authentication", "Jinja2", "MongoDB"],
    };
    for (const [id, names] of Object.entries(expected)) {
      await page.locator(`${graph} [data-project="${id}"]`).hover();
      await expect.poll(async () => (await lit(page)).sort()).toEqual([...names].sort());
      await expect(page.locator(`${graph} [data-edge$=">${id}"]`)).toHaveCount(names.length);
    }

    // Hover a skill → its projects light up.
    await page.locator(`${graph} [data-skill="Python"]`).hover({ force: true }); // nodes drift
    await expect
      .poll(() =>
        page.$$eval(`${graph} [data-project]`, (els) =>
          els
            .filter((e) => getComputedStyle(e).opacity === "1")
            .map((e) => e.getAttribute("data-project")),
        ),
      )
      .toEqual(["sherpa", "pathfinder", "shrinx"]);

    // Rendered labels never overlap.
    const overlaps = await page.$$eval(`${graph} text`, (els) => {
      const rs = els.map((e) => [e.textContent, e.getBoundingClientRect()] as const);
      const out: string[] = [];
      for (let i = 0; i < rs.length; i++)
        for (let j = i + 1; j < rs.length; j++) {
          const [a, A] = rs[i];
          const [b, B] = rs[j];
          if (A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom)
            out.push(`${a} / ${b}`);
        }
      return out;
    });
    expect(overlaps).toEqual([]);
    await page.mouse.move(5, 5);
    await svg.screenshot({ path: "test-results/screens/skill-graph-desktop.png" });
  });

  test("mobile shows the grouped list only", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile layout");
    await page.goto("/");
    await expect(page.locator(graph)).toBeHidden();
    await expect(page.locator("#skills li")).toHaveCount(30);
  });

  test("reduced motion shows the list only", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop layout");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(graph)).toBeHidden();
    await expect(page.locator("#skills li").first()).toBeVisible();
  });
});

test("graph works without JavaScript", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop layout");
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.locator(graph).scrollIntoViewIfNeeded();
  await page.locator(`${graph} [data-project="pathfinder"]`).hover();
  await expect
    .poll(async () => (await lit(page)).sort())
    .toEqual(["LangGraph", "Python", "Streamlit"]);
  await ctx.close();
});
