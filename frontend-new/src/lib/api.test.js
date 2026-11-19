// @vitest-environment node
import {
  afterAll,
  beforeAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { screen, validateImage } from "./api.js";
import { fixture } from "../test/fixtures.js";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "http://127.0.0.1:8000"));
vi.mock("./supabase.js", () => ({ supabase: null }));
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe("screening requests", () => {
  it("submits one multipart image to the authoritative contract", async () => {
    let requests = 0;
    server.use(
      http.post("http://127.0.0.1:8000/api/v1/screen", async ({ request }) => {
        requests++;
        expect(new URL(request.url).searchParams.get("backbone")).toBe(
          "convnext_tiny",
        );
        expect(request.headers.get("content-type")).toMatch(
          /multipart\/form-data; boundary=/,
        );
        return HttpResponse.json(fixture);
      }),
    );
    expect(
      (await screen(new File(["image"], "page.png", { type: "image/png" })))
        .risk_score,
    ).toBe(0.64);
    expect(requests).toBe(1);
  });
  it("presents FastAPI validation failures rather than a success fallback", async () => {
    server.use(
      http.post("http://127.0.0.1:8000/api/v1/screen", () =>
        HttpResponse.json(
          { detail: [{ msg: "Image is required" }] },
          { status: 422 },
        ),
      ),
    );
    await expect(screen(new File(["x"], "page.png"))).rejects.toThrow(
      "Image is required",
    );
  });
  it("rejects an incomplete service response", async () => {
    server.use(
      http.post("http://127.0.0.1:8000/api/v1/screen", () =>
        HttpResponse.json({ risk_score: null }),
      ),
    );
    await expect(screen(new File(["x"], "page.png"))).rejects.toThrow(
      "incomplete or unexpected",
    );
  });
  it("rejects unsupported, empty, and oversized files before decoding", async () => {
    await expect(
      validateImage(new File([], "empty.png", { type: "image/png" })),
    ).rejects.toThrow("empty");
    await expect(
      validateImage(new File(["text"], "notes.txt", { type: "text/plain" })),
    ).rejects.toThrow("PNG");
    await expect(
      validateImage(
        new File([new Uint8Array(26 * 1024 * 1024)], "huge.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("25 MiB");
  });
});
