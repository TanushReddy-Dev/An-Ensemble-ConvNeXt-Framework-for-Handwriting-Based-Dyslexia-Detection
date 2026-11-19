import { test, expect } from "@playwright/test";
import { fixture, png } from "../src/test/fixtures.js";
const id = "11111111-1111-4111-8111-111111111111";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "reviewer@example.test",
  user_metadata: { name: "Test reviewer" },
  app_metadata: { provider: "email" },
  created_at: "2026-01-01T00:00:00Z",
};
const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.test-signature`;
async function setup(page) {
  await page.route("http://127.0.0.1:54321/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/v1/token"))
      return route.fulfill({
        json: {
          access_token: token,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "test-refresh",
          user,
        },
      });
    if (url.includes("/auth/v1/user")) return route.fulfill({ json: user });
    if (url.includes("/auth/v1/logout")) return route.fulfill({ status: 204 });
    return route.fulfill({ json: [], headers: { "content-range": "0-0/0" } });
  });
}
async function login(page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("reviewer@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Every page deserves a closer look." }),
  ).toBeVisible();
}
async function upload(page) {
  await page.goto("/upload");
  await expect(
    page.getByRole("heading", { name: "New screening", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `shots/app-upload-${page.viewportSize().width}.png`,
    fullPage: true,
  });
  await page.getByLabel("Handwriting image", { exact: true }).setInputFiles({
    name: "handwriting.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(
    page.getByRole("button", { name: "Run screening", exact: true }),
  ).toBeEnabled();
}
const browserErrors = new WeakMap();

test("page fades and the sidebar highlight follow pointer navigation", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The mobile sidebar closes after choosing a page.");
  await login(page);
  await page.evaluate(() => {
    window.navigationMotion = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      if (this.matches("#content, .sidebar-indicator")) {
        window.navigationMotion.push({
          target: this.id || this.className,
          frames,
        });
      }
      if (this.matches(".sidebar-indicator")) {
        animation.pause();
        animation.currentTime = 75;
        window.sidebarTransition = animation;
      }
      return animation;
    };
  });
  const sidebar = page.locator(".sidebar");
  await sidebar.getByRole("link", { name: "Screening history" }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(
    sidebar.getByRole("link", { name: "Screening history" }),
  ).toHaveAttribute("aria-current", "page");
  const motion = await page.evaluate(() => window.navigationMotion.splice(0));
  expect(motion.map((event) => event.target)).toEqual([
    "sidebar-indicator",
    "content",
  ]);
  expect(motion[0].frames[0].transform).not.toEqual(
    motion[0].frames[1].transform,
  );
  await page.screenshot({ path: "shots/sidebar-handoff-1280.png" });
  await page.evaluate(() => window.sidebarTransition.finish());

  await sidebar.getByRole("link", { name: "Settings" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);
  expect(await page.evaluate(() => window.navigationMotion)).toEqual([]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await sidebar.getByRole("link", { name: "Overview" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => window.navigationMotion)).toEqual([]);
});
test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await setup(page);
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});
test("landing actions animate the actual destination on desktop and mobile", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Handwriting screening for educators.",
  );
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close menu" }).click();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    window.accountTransitions = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, timing) {
      const animation = animate.call(this, frames, timing);
      if (this.matches(".auth-layout")) {
        window.accountTransitions.push(animation);
        animation.pause();
        animation.currentTime = 55;
      }
      return animation;
    };
  });
  await page.getByRole("link", { name: "Start a screening" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  const progress = await page.locator(".auth-layout").evaluate((node) => ({
    transform: getComputedStyle(node).transform,
    state: history.state,
  }));
  expect(progress.transform).not.toBe("none");
  expect(progress.state).toEqual({ from: "/upload" });
  await page.screenshot({
    path: `shots/landing-handoff-${page.viewportSize().width}.png`,
  });
  await page.evaluate(() => window.accountTransitions[0].finish());
  await page.goBack();
  await expect(page.locator(".public-page")).toBeVisible();
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Sign in", exact: true })
      .click();
  } else {
    await page
      .getByRole("link", { name: "Sign in", exact: true })
      .first()
      .click();
  }
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => window.accountTransitions.length)).toBe(2);
  await page.evaluate(() => window.accountTransitions[1].finish());
});
test("screen once, retry save with same ID, view missing overlay, and download a PDF", async ({
  page,
}) => {
  let screens = 0;
  const saves = [];
  await page.route("**/api/v1/screen?*", (route) => {
    screens++;
    return route.fulfill({ json: fixture });
  });
  await page.route("**/rest/v1/screenings*", async (route) => {
    if (route.request().method() === "POST") {
      saves.push(route.request().postDataJSON());
      return saves.length === 1
        ? route.fulfill({ status: 503, json: { message: "Test save failure" } })
        : route.fulfill({ status: 201, json: null });
    }
    return route.fulfill({ json: [], headers: { "content-range": "0-0/0" } });
  });
  await page.route("**/api/v1/report", (route) =>
    route.fulfill({
      contentType: "application/pdf",
      body: "%PDF-1.4\nTest report\n%%EOF",
    }),
  );
  await login(page);
  await upload(page);
  await page
    .getByRole("button", { name: "Run screening", exact: true })
    .click();
  await expect(
    page.locator(".score").getByText("64.0%", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Potential dyslexia" }),
  ).toBeVisible();
  const enlarge = page.getByRole("button", { name: "Enlarge selected image" });
  await enlarge.click();
  await expect(page.getByRole("dialog", { name: "Original" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(enlarge).toBeFocused();
  const original = page.getByRole("tab", { name: "Original", exact: true });
  await original.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Grad-CAM", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  expect(
    await page
      .getByRole("tabpanel")
      .evaluate((panel) => panel.getAnimations().length),
  ).toBe(0);
  await original.click();
  await page.evaluate(() => {
    window.previewTransitions = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (this.matches('[role="tabpanel"]'))
        window.previewTransitions.push(this.id);
      return animate.call(this, frames, options);
    };
  });
  await page.getByRole("tab", { name: "Grad-CAM", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Grad-CAM is unavailable." }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.previewTransitions)).toEqual([
    await page.getByRole("tabpanel").getAttribute("id"),
  ]);
  await page.getByRole("button", { name: "Save result", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry save" })).toBeVisible();
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect(page.getByText("Result saved to history")).toBeVisible();
  expect(screens).toBe(1);
  expect(saves).toHaveLength(2);
  expect(saves[0].id).toBe(saves[1].id);
  expect(saves[0].category).toBe("Elevated");
  expect(saves[0].original_image_base64).toBeNull();
  await page
    .getByRole("link", { name: "Generate report", exact: true })
    .click();
  await expect(page).toHaveURL(/\/report$/);
  await expect(
    page.getByRole("heading", { name: "Screening report", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".report-options")).toContainText(
    "runs screening again",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Generate report", exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain("NeuroWrite");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter(
        (k) => k.includes("history") || k.includes("screening"),
      ),
    ),
  ).toHaveLength(0);
});
test("request failure preserves the image and refresh recovers honestly", async ({
  page,
}) => {
  await page.route("**/api/v1/screen?*", (route) =>
    route.fulfill({ status: 500, json: { detail: "Test inference failure" } }),
  );
  await login(page);
  await upload(page);
  await page
    .getByRole("button", { name: "Run screening", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Test inference failure");
  await expect(
    page.getByRole("button", { name: "Retry screening" }),
  ).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "No screening in progress.",
    }),
  ).toBeVisible();
});
test("settings and sign-out clear the private workspace", async ({
  page,
  isMobile,
}) => {
  await login(page);
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Text size", exact: true })
    .selectOption("large");
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-reading-size",
    "large",
  );
  if (isMobile)
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page.goto("/history");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});
test("retained image and owner-scoped saved detail survive a reload", async ({
  page,
}) => {
  let saved = null;
  await page.route("**/api/v1/screen?*", (route) =>
    route.fulfill({
      json: {
        ...fixture,
        risk_score: 0.34,
        risk_percentage: 34,
        risk_category: "Typical",
        screening_classification:
          "No Elevated Screening Signal Detected (Typical Pattern)",
        uncertainty_band: { low: 0.3, high: 0.4, std: 0.04, spread: 0.1 },
        per_fold_predictions: [0.3, 0.32, 0.34, 0.34, 0.4],
      },
    }),
  );
  await page.route("**/rest/v1/screenings*", (route) => {
    expect(
      new URL(route.request().url()).searchParams.get("user_id") ||
        (route.request().method() === "POST" ? `eq.${id}` : ""),
    ).toBe(`eq.${id}`);
    if (route.request().method() === "POST") {
      saved = {
        ...route.request().postDataJSON(),
        created_at: "2026-11-19T09:00:00Z",
      };
      return route.fulfill({ status: 201, json: null });
    }
    if (new URL(route.request().url()).searchParams.has("id"))
      return route.fulfill({ json: saved });
    return route.fulfill({
      json: saved ? [saved] : [],
      headers: { "content-range": "0-0/1" },
    });
  });
  await login(page);
  await upload(page);
  await page
    .getByRole("button", { name: "Run screening", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Normal" }),
  ).toBeVisible();
  await expect(page.getByText(/does not rule out dyslexia/)).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Retain original and explanation images" })
    .check();
  await page.getByRole("button", { name: "Save result", exact: true }).click();
  await expect(page.getByText("Result saved to history")).toBeVisible();
  expect(saved.category).toBe("Typical");
  expect(saved["original_image_base64"]).toContain("data:image/png;base64,");
  await page.goto("/history");
  await expect(
    page.getByRole("link", { name: /handwriting.png.*Normal/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: /handwriting.png/ }).click();
  await expect(
    page.getByText("Saved screening", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Normal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Original view of the handwriting image",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Attention", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `shots/app-result-${page.viewportSize().width}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("invalid credentials, signup confirmation, and password recovery show real response states", async ({
  page,
}) => {
  await page.route("**/auth/v1/token*", (route) =>
    route.fulfill({
      status: 400,
      json: {
        msg: "Invalid login credentials",
        error_code: "invalid_credentials",
      },
    }),
  );
  await page.goto("/login");
  await page.getByLabel("Email address").fill("reviewer@example.test");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid login credentials",
  );
  await page.route("**/auth/v1/signup*", (route) =>
    route.fulfill({ json: { user, session: null } }),
  );
  await page.goto("/signup");
  await page.getByLabel("Name", { exact: true }).fill("Test reviewer");
  await page.getByLabel("Email address").fill("reviewer@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await page.route("**/auth/v1/recover*", (route) =>
    route.fulfill({ json: {} }),
  );
  await page.goto("/forgot-password");
  await expect(page.locator(".auth-photo")).toHaveCount(0);
  await page.getByLabel("Email address").fill("reviewer@example.test");
  await page.getByRole("button", { name: "Send recovery link" }).click();
  await expect(page.getByRole("status")).toContainText("password reset link");
  await page.screenshot({
    path: `shots/recovery-${page.viewportSize().width}.png`,
    animations: "disabled",
  });
});
test("the original page URLs remain separate and account navigation uses the new designs", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.locator(".auth-login")).toBeVisible();
  await expectRouteArtwork(page, ".auth-photo img", "login");
  await page.screenshot({
    path: `shots/login-${page.viewportSize().width}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.locator(".auth-signup")).toBeVisible();
  await expectRouteArtwork(page, ".auth-photo img", "signup");
  await expect(page.getByLabel("Institution", { exact: false })).toBeVisible();
  await page.screenshot({
    path: `shots/signup-${page.viewportSize().width}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
  await login(page);
  const pages = [
    ["/dashboard", "Every page deserves a closer look."],
    ["/upload", "New screening"],
    ["/processing", "No screening in progress."],
    ["/result", "No screening result loaded."],
    ["/history", "Screening history"],
    ["/report", "Screening report"],
    ["/settings", "Settings"],
  ];
  for (const [path, title] of pages) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    if (path === "/dashboard") {
      await expectRouteArtwork(page, ".overview-image img", "dashboard");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `shots/page-${path.slice(1)}-${page.viewportSize().width}.png`,
      fullPage: true,
    });
  }
});
async function expectRouteArtwork(page, selector, name) {
  const artwork = page.locator(selector);
  await expect(artwork).toHaveAttribute("alt", "");
  await expect
    .poll(() =>
      artwork.evaluate((img) =>
        img.naturalWidth > 0 ? new URL(img.currentSrc).pathname : "",
      ),
    )
    .toMatch(new RegExp(`^/assets/images/${name}-(640|1024)\\.webp$`));
}
test("public, account, and workspace routes reflow from 320px to desktop", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "This test sets each viewport explicitly.");
  test.setTimeout(120_000);
  const viewports = [
    { width: 320, height: 640 },
    { width: 640, height: 900 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ];
  const publicRoutes = [
    ["/", "Handwriting screening for educators."],
    ["/login", "Welcome back."],
    ["/signup", "Create your workspace."],
    ["/forgot-password", "Reset your password."],
    ["/reset-password", "Choose a new password."],
    ["/auth/callback", "Check your sign-in link"],
    ["/missing", "This page isn't in the workspace."],
  ];
  const workspaceRoutes = [
    ["/dashboard", "Every page deserves a closer look."],
    ["/upload", "New screening"],
    ["/processing", "No screening in progress."],
    ["/result", "No screening result loaded."],
    ["/history", "Screening history"],
    ["/report", "Screening report"],
    ["/settings", "Settings"],
  ];
  const checkLayout = async (routes) => {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const [path, heading] of routes) {
        await test.step(`${path} at ${viewport.width}px`, async () => {
          await page.goto(path);
          await expect(
            page.getByRole("heading", { level: 1, name: heading }),
          ).toBeVisible();
          const overflow = await page.evaluate(() => ({
            document: document.documentElement.scrollWidth - innerWidth,
            panels: [
              ...document.querySelectorAll(
                ".record-row, .review-panel, .report-document, .settings-section, .result-overview",
              ),
            ]
              .filter(
                (element) => element.scrollWidth > element.clientWidth + 1,
              )
              .map((element) => element.className),
          }));
          expect.soft(overflow.document).toBeLessThanOrEqual(1);
          expect.soft(overflow.panels).toEqual([]);
          await page.screenshot({
            path: `shots/responsive/${path.slice(1).replaceAll("/", "-") || "landing"}-${viewport.width}.png`,
            animations: "disabled",
          });
        });
      }
    }
  };
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  const signIn = menu.getByRole("link", { name: "Sign in" });
  await signIn.scrollIntoViewIfNeeded();
  await expect(signIn).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: "shots/responsive/landscape-menu-844.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(menu).toHaveCount(0);
  await expect(page.locator(".public-page main")).not.toHaveAttribute("inert");
  await checkLayout(publicRoutes);
  await login(page);
  await page.setViewportSize({ width: 844, height: 390 });
  const openNav = page.getByRole("button", { name: "Open navigation" });
  await openNav.click();
  await expect(page.locator(".app-main")).toHaveAttribute("inert", "");
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator(".app-main")).not.toHaveAttribute("inert");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(openNav).toBeVisible();
  const filename = `handwriting-${"long-sample-".repeat(6)}.png`;
  const saved = {
    ...fixture,
    id,
    subject: filename,
    filename,
    category: "Elevated",
    created_at: "2026-11-19T09:00:00Z",
  };
  await page.route("**/rest/v1/screenings*", (route) => {
    const isDetail = new URL(route.request().url()).searchParams.has("id");
    return route.fulfill({
      json: isDetail ? saved : [saved],
      headers: { "content-range": "0-0/1" },
    });
  });
  await checkLayout([
    ...workspaceRoutes,
    [`/result/${id}`, "Potential dyslexia"],
  ]);
});
test("upload, processing, and result have their own URLs without duplicate inference", async ({
  page,
}) => {
  let release;
  let requests = 0;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/screen?*", async (route) => {
    requests++;
    await hold;
    await route.fulfill({
      json: {
        ...fixture,
        gradcam_overlay_base64: `data:image/png;base64,${png}`,
        uncertainty_band: { low: 0.09, high: 0.999, std: 0.32, spread: 0.909 },
        per_fold_predictions: [0.09, 0.51, 0.7, 0.901, 0.999],
      },
    });
  });
  await login(page);
  await upload(page);
  await page
    .getByRole("button", { name: "Run screening", exact: true })
    .click();
  await expect(page).toHaveURL(/\/processing$/);
  await expect(
    page.getByRole("heading", { name: "A closer look is underway." }),
  ).toBeVisible();
  await page.screenshot({
    path: `shots/active-processing-${page.viewportSize().width}.png`,
    animations: "disabled",
  });
  release();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.locator(".score")).toContainText("64.0%");
  await page.screenshot({
    path: `shots/active-result-${page.viewportSize().width}.png`,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: "Grad-CAM", exact: true }).click();
  const explanation = page.getByRole("tabpanel", { name: "Grad-CAM" });
  await expect(explanation.getByText("Relative contribution")).toBeVisible();
  await expect(explanation).toContainText(
    "Model folds disagreed · 9.0% – 99.9%",
  );
  await expect(explanation).toContainText("first model fold");
  await explanation.screenshot({
    path: `shots/gradcam-panel-${page.viewportSize().width}.png`,
    animations: "disabled",
  });
  expect(requests).toBe(1);
  await page
    .getByRole("link", { name: "Generate report", exact: true })
    .click();
  await expect(page).toHaveURL(/\/report$/);
  await expect(page.locator(".report-document")).toContainText(
    "Current screening reference",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.locator(".score")).toContainText("64.0%");
  await page.goBack();
  await expect(page).toHaveURL(/\/upload$/);
  await expect(
    page.getByRole("img", { name: "Selected handwriting image for screening" }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/result$/);
  expect(requests).toBe(1);
});
