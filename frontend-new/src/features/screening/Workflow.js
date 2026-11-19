import { redraw } from "../../ui/view.js";
import { screen } from "../../lib/api.js";
import { message } from "../../lib/contracts.js";

const initial = () => ({
  id: crypto.randomUUID(),
  file: null,
  preview: "",
  subject: "",
  result: null,
  status: "idle",
  error: "",
  saved: false,
});
let state = initial();
let active;
let generation = 0;

function change(next) {
  state = next;
  redraw();
}

export function clearWorkflow() {
  generation++;
  active?.abort();
  active = null;
  if (state.preview) URL.revokeObjectURL(state.preview);
  change(initial());
}

window.addEventListener("beforeunload", (event) => {
  if (!state.file || state.saved) return;
  event.preventDefault();
  event.returnValue = "";
});

async function run() {
  if (!state.file || active) return;
  const controller = new AbortController();
  active = controller;
  const ticket = generation;
  const file = state.file;
  change({
    ...state,
    id: state.result ? crypto.randomUUID() : state.id,
    status: "running",
    error: "",
    result: null,
    saved: false,
  });
  try {
    const result = await screen(file, controller.signal);
    if (ticket === generation && !controller.signal.aborted) {
      change({ ...state, result, status: "succeeded" });
    }
  } catch (error) {
    if (ticket === generation) {
      change({
        ...state,
        status: controller.signal.aborted ? "canceled" : "failed",
        error: controller.signal.aborted
          ? "The browser request was canceled. The server may still be processing."
          : message(error),
      });
    }
  } finally {
    if (active === controller) active = null;
  }
}

export function useWorkflow() {
  const id = state.id;
  const ticket = generation;
  return {
    state,
    run,
    clear: clearWorkflow,
    choose(file) {
      if (ticket !== generation) return;
      clearWorkflow();
      change({
        ...state,
        file,
        preview: URL.createObjectURL(file),
        status: "ready",
      });
    },
    cancel: () => active?.abort(),
    subject: (subject) => {
      state.subject = subject;
    },
    markSaved() {
      if (state.id === id) change({ ...state, saved: true });
    },
  };
}
