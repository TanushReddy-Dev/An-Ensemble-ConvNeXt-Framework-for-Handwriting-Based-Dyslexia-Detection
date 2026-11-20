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
  const mark = page.locator(".nav .brand-mark");
  await expect(mark).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(mark).toHaveCSS("background-image", /prism-symbol\.webp/);
  await page
    .getByRole("link", { name: "Sign in", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Sign in | PRISM");
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
      'link[rel="icon"][href="/favicon.ico"]',
      'link[rel="apple-touch-icon"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]) {
      const asset = page.locator(selector);
      const source = selector.startsWith("meta") ? "content" : "href";
      const path = await asset.getAttribute(source);
      expect(path).toBeTruthy();
      expect(
        (await page.request.get(new URL(path, page.url()).href)).ok(),
      ).toBe(true);
    }
    const manifestPath = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    const manifest = await (
      await page.request.get(new URL(manifestPath, page.url()).href)
    ).json();
    expect(manifest).toMatchObject({ name: "PRISM", start_url: "/" });
    expect(manifest.icons.map(({ sizes }) => sizes)).toEqual([
      "192x192",
      "512x512",
    ]);
    for (const icon of manifest.icons) {
      const response = await page.request.get(
        new URL(icon.src, page.url()).href,
      );
      expect(response.ok()).toBe(true);
      const body = await response.body();
      expect(`${body.readUInt32BE(16)}x${body.readUInt32BE(20)}`).toBe(
        icon.sizes,
      );
    }
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Handwriting screening for educators.",
    );
    const artwork = page.getByRole("img", { name: /handwriting sample sheet/ });
    await expect(page.getByRole("slider")).toBeHidden();
    await expect(page.locator(".lens-treatment")).toBeVisible();
    await expect
      .poll(() =>
        artwork.evaluate((img) =>
          img.naturalWidth > 0 ? new URL(img.currentSrc).pathname : "",
        ),
      )
      .toMatch(/^\/assets\/images\/landing-(640|768|1024)\.webp$/);
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

test("the landing demo supports the lens, workflow steps, and explanation views", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const lens = page.locator("[data-review-lens]");
  const slider = lens.getByRole("slider");
  await expect(slider).toHaveValue("50");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("51");
  await expect(lens).toHaveCSS("--lens-edge", "49%");
  await lens.getByRole("button", { name: "Original" }).click();
  await expect(slider).toHaveValue("0");
  await expect(lens.locator(".lens-divider")).toBeHidden();
  await lens.getByRole("button", { name: "Review" }).click();
  await expect(slider).toHaveValue("100");
  const steps = page.getByRole("group", { name: "Screening workflow" });
  await steps.getByRole("button", { name: "Screen", exact: true }).click();
  await expect(
    page.getByText("Screen the sample", { exact: true }),
  ).toBeVisible();
  await steps.getByRole("button", { name: "Review", exact: true }).click();
  await expect(
    page.getByText("Review the result", { exact: true }),
  ).toBeVisible();
  await steps.getByRole("button", { name: "Choose image" }).click();
  await expect(
    page.getByText("Choose a handwriting image", { exact: true }),
  ).toBeVisible();
  const views = page.getByRole("group", { name: "Explanation views" });
  await views.getByRole("button", { name: "Grad-CAM" }).click();
  await expect(page.locator(".explanation-regions")).toBeVisible();
  await views.getByRole("button", { name: "Stroke attribution" }).click();
  await expect(page.locator(".explanation-strokes")).toBeVisible();
  await expect(page.locator(".explanation-regions")).toBeHidden();
});

test("the built error pages load the logo and offer recovery without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    for (const [code, title] of [
      [404, "This page isn't in the workspace."],
      [500, "The workspace could not open."],
    ]) {
      await page.goto(`http://127.0.0.1:5175/${code}.html`);
      await expect(
        page.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Back to overview" }),
      ).toHaveAttribute("href", "/");
      await expect
        .poll(() =>
          page
            .locator(".workspace-error-art")
            .evaluate((img) => img.naturalWidth),
        )
        .toBe(384);
      await page.screenshot({ path: `shots/error-${code}-390.png` });
    }
  } finally {
    await context.close();
  }
});

test("the workspace offers recovery when a route render fails", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const create = Document.prototype.createElement;
    let failed = false;
    Document.prototype.createElement = function (tag, options) {
      if (tag === "main" && !failed) {
        failed = true;
        throw new Error("Synthetic route render failure");
      }
      return create.call(this, tag, options);
    };
  });
  await page.goto("/forced-render-test");
  await expect(
    page.getByRole("heading", { name: "The workspace could not open." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reload workspace" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The workspace could not open." }),
  ).toBeFocused();
  await page.screenshot({ path: "shots/error-runtime-1280.png" });
  await page.getByRole("link", { name: "Back to overview" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:5175/");
});
