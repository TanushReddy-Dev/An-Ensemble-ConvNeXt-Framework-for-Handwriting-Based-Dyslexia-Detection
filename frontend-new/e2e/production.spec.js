import { test, expect } from "@playwright/test";
test("the production landing page enhances cleanly and real routes open", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".public-page")).toHaveAttribute(
    "data-taste-ready",
    "",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Handwriting screening for educators.",
  );
  await page
    .getByRole("link", { name: "Sign in", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Sign in | NeuroWrite AI");
  expect(errors).toEqual([]);
});
test("the production overview has useful content with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5175/");
    for (const selector of [
      'link[rel="icon"][type="image/svg+xml"]',
      'link[rel="icon"][sizes="32x32"]',
      'link[rel="apple-touch-icon"]',
      'meta[property="og:image"]',
    ]) {
      const asset = page.locator(selector);
      const source = selector.startsWith("meta") ? "content" : "href";
      const path = await asset.getAttribute(source);
      expect(path).toBeTruthy();
      expect(
        (await page.request.get(new URL(path, page.url()).href)).ok(),
      ).toBe(true);
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Handwriting screening for educators.",
    );
    const artwork = page.getByRole("img", { name: /ruled sheet/ });
    await expect
      .poll(() =>
        artwork.evaluate((img) =>
          img.naturalWidth > 0 ? new URL(img.currentSrc).pathname : "",
        ),
      )
      .toMatch(/^\/assets\/images\/landing-(640|1024)\.webp$/);
    await expect(
      page.getByRole("heading", { name: "Screening questions." }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Start a screening" }).first(),
    ).toHaveAttribute("href", "/upload");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await context.close();
  }
});
