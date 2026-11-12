import { test as base } from "@playwright/test";

/**
 * Every spec starts as a repeat visit, so the boot screen (layout head script) is skipped
 * and doesn't cover the page. tests/e2e/boot.spec.ts covers the boot screen itself.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("jk:intro", "1");
      } catch {}
    });
    await provide(page);
  },
});

export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
