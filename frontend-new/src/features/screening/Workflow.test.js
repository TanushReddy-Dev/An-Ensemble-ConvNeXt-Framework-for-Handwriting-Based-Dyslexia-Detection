import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { clearWorkflow, useWorkflow } from "./Workflow.js";
import { fixture } from "../../test/fixtures.js";
import { screen } from "../../lib/api.js";

vi.mock("../../lib/api.js", () => ({ screen: vi.fn() }));

let finish;
beforeEach(() => {
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn(() => "blob:test");
      static revokeObjectURL = vi.fn();
    },
  );
  screen.mockImplementation(
    (_file, signal) =>
      new Promise((resolve, reject) => {
        finish = resolve;
        signal.addEventListener("abort", () =>
          reject(new DOMException("Canceled", "AbortError")),
        );
      }),
  );
  useWorkflow().choose(new File(["x"], "page.png", { type: "image/png" }));
});

afterEach(() => {
  clearWorkflow();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("guards duplicate submits while preserving the selected image for retry", async () => {
  const pending = useWorkflow().run();
  await useWorkflow().run();
  expect(screen).toHaveBeenCalledTimes(1);
  expect(useWorkflow().state.status).toBe("running");
  useWorkflow().cancel();
  await pending;
  expect(useWorkflow().state.status).toBe("canceled");
  expect(useWorkflow().state.error).toContain("server may still be processing");
  const retry = useWorkflow().run();
  expect(screen).toHaveBeenCalledTimes(2);
  finish(fixture);
  await retry;
  expect(useWorkflow().state.status).toBe("succeeded");
});

it("creates a new unsaved record for a rerun after a completed saved screening", async () => {
  const first = useWorkflow().run();
  finish(fixture);
  await first;
  const oldId = useWorkflow().state.id;
  useWorkflow().markSaved();
  expect(useWorkflow().state.saved).toBe(true);
  const again = useWorkflow().run();
  expect(useWorkflow().state.saved).toBe(false);
  expect(useWorkflow().state.id).not.toBe(oldId);
  finish(fixture);
  await again;
});
