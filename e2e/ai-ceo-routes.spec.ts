import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

/** Every AI CEO subroute, its sidebar entry and the heading it must render. */
export const AI_CEO_ROUTES: { path: string; heading: string; navLabel: string }[] = [
  { path: "/ai-ceo", heading: "AI CEO Dashboard", navLabel: "Dashboard" },
  { path: "/ai-ceo/live-monitor", heading: "Live Action Monitor", navLabel: "Live Action Monitor" },
  { path: "/ai-ceo/decision-engine", heading: "Decision Engine", navLabel: "Decision Engine" },
  { path: "/ai-ceo/approvals", heading: "Approval Suggestions", navLabel: "Approval Suggestions" },
  { path: "/ai-ceo/risk", heading: "Risk & Compliance", navLabel: "Risk & Compliance" },
  {
    path: "/ai-ceo/performance",
    heading: "Performance Intelligence",
    navLabel: "Performance Intelligence",
  },
  { path: "/ai-ceo/predictions", heading: "Predictive Insights", navLabel: "Predictive Insights" },
  { path: "/ai-ceo/reports", heading: "AI Reports", navLabel: "AI Reports" },
  { path: "/ai-ceo/learning", heading: "System Learning Log", navLabel: "System Learning Log" },
  { path: "/ai-ceo/settings", heading: "Settings", navLabel: "Settings (Read-Only)" },
];

/** Collect console errors and uncaught page errors for the life of a page. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("AI CEO subroutes render", () => {
  for (const { path, heading } of AI_CEO_ROUTES) {
    test(`${path} renders "${heading}" with no console errors`, async ({ page }) => {
      const errors = watchErrors(page);

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} HTTP status`).toBe(200);

      // Section heading plus the shared shell chrome must both be present.
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Live Action Monitor", exact: true }),
      ).toBeVisible();

      // Hydration completed (no mismatch wipes) and nothing threw.
      await page.waitForTimeout(500);
      expect(errors, `${path} console/page errors`).toEqual([]);
    });
  }
});

test.describe("legacy paths redirect into the CEO module", () => {
  for (const path of ["/", "/owner", "/softwarewala"]) {
    test(`${path} redirects to /ai-ceo`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/ai-ceo$/);
      await expect(page.getByRole("heading", { level: 1, name: "AI CEO Dashboard" })).toBeVisible();
    });
  }
});

test("sidebar navigation reaches every section without a full reload", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/ai-ceo", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1, name: "AI CEO Dashboard" })).toBeVisible();

  for (const { heading, navLabel, path } of AI_CEO_ROUTES.slice(1)) {
    // Retry the click until the client router has hydrated and handles it.
    await expect(async () => {
      await page.getByRole("button", { name: navLabel, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }

  expect(errors, "console/page errors during navigation").toEqual([]);
});
