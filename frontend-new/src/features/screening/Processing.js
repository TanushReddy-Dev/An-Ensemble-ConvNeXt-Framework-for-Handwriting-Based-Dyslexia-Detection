import { el, fragment } from "../../ui/view.js";
import { Link, Navigate } from "../../ui/navigation.js";
import { FileImage, Info, ArrowLeft } from "../../ui/icons.js";
import { PageTitle, ErrorNotice } from "../../components/ui/Common.js";
import { useWorkflow } from "./Workflow.js";
export default function Processing() {
  const { state, run, cancel } = useWorkflow();
  if (state.result) return el(Navigate, { to: "/result", replace: true });
  return el(
    fragment,
    null,
    el(
      Link,
      { className: "back-link", to: "/upload" },
      el(ArrowLeft, { size: 16 }),
      "Back to upload",
    ),
    el(
      PageTitle,
      {
        eyebrow: "Handwriting screening \u00B7 Processing",
        title: !state.file
          ? "No screening in progress."
          : state.status === "running"
            ? "A closer look is underway."
            : state.status === "canceled"
              ? "Request canceled."
              : state.status === "failed"
                ? "Let’s try that again."
                : "Ready for a closer look.",
      },
      state.file
        ? "Your handwriting image stays in view while the model returns its screening signal."
        : "Choose a handwriting image before starting a screening.",
    ),
    el(
      "div",
      { className: "processing-layout" },
      el(
        "div",
        { className: "processing-preview" },
        state.preview
          ? el("img", {
              src: state.preview,
              alt: "Handwriting image being screened",
            })
          : el(
              "div",
              { className: "processing-empty" },
              el(FileImage, { size: 64, weight: "thin" }),
              el("h2", null, "No image selected"),
              el("p", null, "Your image preview will appear here."),
            ),
        el(
          "div",
          { className: "processing-file" },
          el(FileImage, { size: 20 }),
          el(
            "span",
            null,
            state.file?.name || "Waiting for a handwriting image",
          ),
        ),
      ),
      el(
        "div",
        { className: "review-panel processing-status" },
        el(
          "span",
          { className: "tag neutral" },
          state.status === "running"
            ? "Request in progress"
            : "Screening service",
        ),
        el(
          "h2",
          null,
          state.status === "running"
            ? "Screening your image"
            : state.file
              ? "Your image is still available."
              : "Start with an image.",
        ),
        state.status === "running"
          ? el(
              fragment,
              null,
              el("div", {
                className: "indeterminate",
                role: "progressbar",
                "aria-label": "Screening in progress",
              }),
              el(
                "p",
                { role: "status" },
                "Waiting for the model response\u2026",
              ),
              el(
                "p",
                { className: "small muted" },
                "The first request may take longer while models load. There is no live server progress estimate.",
              ),
              el(
                "button",
                { className: "btn btn--secondary", onClick: cancel },
                "Cancel request",
              ),
            )
          : el(
              fragment,
              null,
              state.error && el(ErrorNotice, null, state.error),
              state.file
                ? el(
                    "button",
                    {
                      className: "btn btn--primary",
                      onClick: () => void run(),
                    },
                    state.status === "ready"
                      ? "Run screening"
                      : "Retry screening",
                  )
                : el(
                    Link,
                    { className: "btn btn--primary", to: "/upload" },
                    "Choose image",
                  ),
            ),
        el(
          "div",
          { className: "notice" },
          el(Info, { size: 20 }),
          el(
            "p",
            null,
            "You can return to other pages while this tab stays open. Canceling a browser request may not stop server processing.",
          ),
        ),
      ),
    ),
  );
}
