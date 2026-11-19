import { el } from "../../ui/view.js";
import { Link } from "../../ui/navigation.js";
import { Brand } from "./Common.js";

export default function ErrorPage({ failed = false }) {
  return el(
    "main",
    { id: "content", className: "workspace-error" },
    el(Brand),
    el(
      "div",
      { className: "workspace-error-body" },
      el(
        "p",
        { className: "mono workspace-error-code" },
        failed ? "500" : "404",
      ),
      el(
        "h1",
        { tabIndex: -1 },
        failed
          ? "The workspace could not open."
          : "This page isn't in the workspace.",
      ),
      el(
        "p",
        null,
        failed
          ? "Reload to retry. Reloading clears any unsaved screening work."
          : "The address may have changed. Return to the overview to find your next step.",
      ),
      el(
        "div",
        { className: "workspace-error-actions" },
        failed &&
          el(
            "button",
            { className: "btn btn--primary", onClick: () => location.reload() },
            "Reload workspace",
          ),
        el(
          Link,
          {
            to: "/",
            className: `btn ${failed ? "btn--secondary" : "btn--primary"}`,
          },
          "Back to overview",
        ),
      ),
    ),
    el("img", {
      className: "workspace-error-art",
      src: "/assets/brand/neurowrite-mark.webp",
      alt: "",
      width: 384,
      height: 384,
    }),
  );
}
