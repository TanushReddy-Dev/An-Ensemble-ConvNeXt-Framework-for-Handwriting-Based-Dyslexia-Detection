import { el } from "./view.js";
import { enterSurface } from "./motion.js";

export function tabKeys(event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(document.activeElement);
  if (index < 0) return;
  event.preventDefault();
  const position =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
          tabs.length;
  tabs[position].focus();
  tabs[position].click();
}

export function imageDialog({ title, close, children }) {
  return el(
    "dialog",
    {
      className: "dialog-content zoom-dialog",
      "data-show-modal": "",
      "aria-labelledby": "zoom-title",
      "aria-describedby": "zoom-description",
      onCancel(event) {
        event.preventDefault();
        event.currentTarget.close();
        close();
      },
      onClick(event) {
        if (event.target !== event.currentTarget) return;
        const rect = event.target.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        ) {
          event.currentTarget.close();
          close();
        }
      },
    },
    el("h2", { id: "zoom-title" }, title),
    el(
      "p",
      { id: "zoom-description", className: "sr-only" },
      "Enlarged handwriting image. Use browser zoom for closer inspection.",
    ),
    children,
  );
}

export function presentDialogs(root) {
  for (const dialog of root.querySelectorAll(
    "dialog[data-show-modal]:not([open])",
  )) {
    dialog.showModal();
    enterSurface(dialog, { duration: 250 });
  }
}
