import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const { VITE_SITE_URL: siteUrl } = loadEnv(
    mode,
    process.cwd(),
    "VITE_SITE_URL",
  );
  const site = siteUrl ? new URL(siteUrl) : null;
  if (
    site &&
    (!["https:", "http:"].includes(site.protocol) ||
      site.href !== site.origin + "/")
  ) {
    throw new Error(
      "VITE_SITE_URL must be an HTTP(S) origin without a path or credentials.",
    );
  }

  return {
    plugins: site
      ? [
          {
            name: "neurowrite-site-metadata",
            transformIndexHtml(html) {
              return {
                html: html.replaceAll(
                  'content="/assets/images/landing-share.jpg"',
                  `content="${new URL("/assets/images/landing-share.jpg", site).href}"`,
                ),
                tags: [
                  { tag: "link", attrs: { rel: "canonical", href: site.href } },
                  {
                    tag: "meta",
                    attrs: { property: "og:url", content: site.href },
                  },
                ],
              };
            },
          },
        ]
      : [],
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.js"],
      clearMocks: true,
    },
    build: { sourcemap: false },
  };
});
