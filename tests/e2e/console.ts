import type { Page } from "@playwright/test";

/**
 * Headless Chromium (SwiftShader) logs this driver note when it reads WebGL frames back
 * for screenshots; the app never calls readPixels. Everything else is a real problem.
 */
const DRIVER_NOTE =
  /^\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, .*\): GPU stall due to ReadPixels/;

/** Collects console errors/warnings and uncaught exceptions for a page. */
export function collectConsoleProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (m) => {
    if ((m.type() === "error" || m.type() === "warning") && !DRIVER_NOTE.test(m.text())) {
      problems.push(m.text());
    }
  });
  page.on("pageerror", (e) => problems.push(e.message));
  return problems;
}
