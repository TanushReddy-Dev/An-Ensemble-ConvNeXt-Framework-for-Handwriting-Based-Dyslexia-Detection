import { el, fragment, viewState } from "../../ui/view.js";
import { viewValue } from "../../ui/view.js";
import { useNavigate } from "../../ui/navigation.js";
import {
  UploadSimple,
  ImageSquare,
  Trash,
  CheckCircle,
  Info,
  FileImage,
} from "../../ui/icons.js";
import { PageTitle, ErrorNotice, Busy } from "../../components/ui/Common.js";
import { useWorkflow } from "./Workflow.js";
import { validateImage } from "../../lib/api.js";
import { message } from "../../lib/contracts.js";
export default function Upload() {
  const workflow = useWorkflow();
  const { state } = workflow;
  const navigate = useNavigate();
  const input = viewValue("uploadInput", () => ({ current: null }));
  const selected = viewValue("uploadSelection", () => ({ current: 0 }));
  const [error, setError] = viewState("Upload:error", "");
  const [validating, setValidating] = viewState("Upload:validating", false);
  const [drag, setDrag] = viewState("Upload:drag", false);
  const [dimensions, setDimensions] = viewState("Upload:dimensions", "");
  async function choose(file) {
    if (!file) return;
    if (state.status === "running") {
      setError("Cancel the active request before choosing another image.");
      return;
    }
    const ticket = ++selected.current;
    setValidating(true);
    setError("");
    try {
      const size = await validateImage(file);
      if (ticket === selected.current) {
        workflow.choose(file);
        setDimensions(`${size.width} × ${size.height} px`);
      }
    } catch (e) {
      if (ticket === selected.current) setError(message(e));
    } finally {
      if (ticket === selected.current) setValidating(false);
      if (input.current?.isConnected) input.current.value = "";
    }
  }
  return el(
    fragment,
    null,
    el(
      PageTitle,
      { eyebrow: "A closer look starts here", title: "New screening" },
      "Choose a clear handwriting image. You can review it before anything is sent.",
    ),
    el(
      "div",
      { className: "workflow-steps", "aria-label": "Screening steps" },
      el("span", { className: "active" }, "Choose image"),
      el("span", null, "Run screening"),
      el("span", null, "Review result"),
    ),
    el(
      "div",
      { className: "upload-layout" },
      el(
        "div",
        { className: "upload-main" },
        el("input", {
          ref: input,
          type: "file",
          className: "sr-only",
          tabIndex: -1,
          accept: "image/png,image/jpeg,image/webp,image/bmp",
          onChange: (e) => choose(e.target.files?.[0]),
          "aria-label": "Handwriting image",
        }),
        el(
          "div",
          {
            className: `dropzone ${drag ? "dragging" : ""} ${state.file ? "has-image" : ""}`,
            onDragOver: (e) => {
              e.preventDefault();
              setDrag(true);
            },
            onDragLeave: () => setDrag(false),
            onDrop: (e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files.length > 1) {
                setError("Choose one image at a time.");
                return;
              }
              void choose(e.dataTransfer.files[0]);
            },
          },
          state.file
            ? el(
                fragment,
                null,
                el(
                  "div",
                  { className: "preview-toolbar" },
                  el(
                    "span",
                    null,
                    el(FileImage, { size: 18 }),
                    "Image preview",
                  ),
                  el(
                    "button",
                    {
                      className: "icon-button",
                      "aria-label": "Remove selected image",
                      disabled: state.status === "running",
                      onClick: () => {
                        selected.current++;
                        workflow.clear();
                        setDimensions("");
                      },
                    },
                    el(Trash, { size: 20 }),
                  ),
                ),
                el("img", {
                  src: state.preview,
                  alt: "Selected handwriting image for screening",
                }),
              )
            : el(
                fragment,
                null,
                el(
                  "span",
                  { className: "upload-icon" },
                  el(UploadSimple, { size: 32, weight: "light" }),
                ),
                el("h2", null, "Give the handwriting a closer look."),
                el(
                  "p",
                  null,
                  "Drag an image here, or choose one from your device.",
                ),
                el(
                  "button",
                  {
                    className: "btn btn--primary",
                    disabled: validating,
                    onClick: () => input.current?.click(),
                  },
                  validating
                    ? el(Busy, null, "Checking image\u2026")
                    : "Choose image",
                ),
                el(
                  "span",
                  { className: "file-types" },
                  "PNG, JPEG, WebP or BMP \u00B7 Up to 25 MiB",
                ),
              ),
        ),
        state.file &&
          el(
            "div",
            { className: "file-meta" },
            el(ImageSquare, { size: 24 }),
            el(
              "div",
              null,
              el("strong", null, state.file.name),
              el(
                "small",
                null,
                (state.file.size / 1048576).toFixed(2),
                " MiB",
                dimensions && ` · ${dimensions}`,
              ),
            ),
            el(
              "button",
              {
                className: "text-link",
                disabled: validating || state.status === "running",
                onClick: () => input.current?.click(),
              },
              "Change image",
            ),
          ),
        error && el(ErrorNotice, null, error),
        el(
          "div",
          { className: "image-tips" },
          el("h3", null, "A good image helps."),
          el(
            "div",
            null,
            el(
              "p",
              null,
              el(CheckCircle, { size: 18 }),
              "Use a clear, evenly lit page.",
            ),
            el(
              "p",
              null,
              el(CheckCircle, { size: 18 }),
              "Keep the handwriting in focus.",
            ),
            el(
              "p",
              null,
              el(CheckCircle, { size: 18 }),
              "Avoid glare and heavy shadows.",
            ),
          ),
        ),
      ),
      el(
        "aside",
        { className: "review-panel" },
        el(
          "div",
          { className: "panel-heading" },
          el("h2", null, "Before you begin"),
          el("span", { className: "tag neutral" }, "Page screening"),
        ),
        el(
          "p",
          null,
          "One image. A screening signal, fold disagreement, and available model explanations.",
        ),
        el(
          "label",
          { htmlFor: "subject" },
          "Subject identifier ",
          el("span", { className: "muted" }, "(optional)"),
          el("input", {
            id: "subject",
            value: state.subject,
            onChange: (e) => workflow.subject(e.target.value),
            maxLength: 120,
            placeholder: "An identifier you recognize",
          }),
        ),
        el(
          "small",
          null,
          "Use an identifier instead of a full student name where possible.",
        ),
        el(
          "div",
          { className: "notice" },
          el(Info, { size: 20 }),
          el(
            "p",
            null,
            "This is an experimental screening tool. A qualified professional must conduct any formal assessment.",
          ),
        ),
        el(
          "button",
          {
            className: "btn btn--primary",
            disabled: !state.file || validating || state.status === "running",
            onClick: () => {
              navigate("/processing");
              void workflow.run();
            },
          },
          "Run screening",
        ),
        el(
          "p",
          { className: "small muted" },
          "Selecting an image does not upload it. It is sent when you run screening.",
        ),
        state.status === "running" &&
          el(
            "button",
            { className: "text-link", onClick: () => navigate("/processing") },
            "Return to active screening",
          ),
      ),
    ),
  );
}
