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
    await expect(
      page.getByRole("button", { name: "Pause handwriting illustration" }),
    ).toBeHidden();
    await expect(page.locator("[data-scan-review]")).toHaveCSS("opacity", "1");
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

test("the hero scan repeats in view and stops when paused or offscreen", async ({
  page,
}) => {
  await page.goto("/");
  const pause = page.getByRole("button", {
    name: "Pause handwriting illustration",
  });
  const resume = page.getByRole("button", {
    name: "Resume handwriting illustration",
  });
  const sweep = page.locator("[data-scan-pass]");
  const animationCount = () =>
    sweep.evaluate((element) => element.getAnimations().length);
  await expect(pause).toBeVisible();
  await expect
    .poll(() =>
      sweep.evaluate((element) => {
        const [animation] = element.getAnimations();
        return animation
          ? Number(animation.currentTime) -
              Number(animation.effect.getTiming().duration)
          : -1;
      }),
    )
    .toBeGreaterThan(200);

  await pause.click();
  await expect(resume).toBeVisible();
  await expect.poll(animationCount).toBe(0);
  await expect(page.locator("[data-scan-review]")).toHaveCSS("opacity", "1");
  await resume.click();
  await expect.poll(animationCount).toBe(1);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(animationCount).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(animationCount).toBe(1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(pause).toBeHidden();
  await expect.poll(animationCount).toBe(0);
  await expect(page.locator("[data-scan-review]")).toHaveCSS("opacity", "1");
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
