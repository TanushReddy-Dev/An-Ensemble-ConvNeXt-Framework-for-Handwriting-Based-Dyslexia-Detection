import { el, fragment, viewState } from "../../ui/view.js";
import { Link, useSearchParams } from "../../ui/navigation.js";
import { useMutation, useQuery } from "../../ui/queries.js";
import {
  ArrowLeft,
  DownloadSimple,
  Info,
  CheckCircle,
} from "../../ui/icons.js";
import {
  Busy,
  ErrorNotice,
  Loading,
  PageTitle,
} from "../../components/ui/Common.js";
import { useWorkflow } from "./Workflow.js";
import { useAuth } from "../auth/AuthProvider.js";
import { detail } from "../../lib/records.js";
import { report, validateImage } from "../../lib/api.js";
import {
  categoryFor,
  disclaimer,
  message,
  percent,
  screeningOutcome,
} from "../../lib/contracts.js";
export default function Report() {
  const { state } = useWorkflow();
  const { session } = useAuth();
  const [params] = useSearchParams();
  const record = params.get("record");
  const [student, setStudent] = viewState("Report:student", "");
  const [examiner, setExaminer] = viewState("Report:examiner", "");
  const [replacement, setReplacement] = viewState("Report:replacement", null);
  const [fileError, setFileError] = viewState("Report:fileError", "");
  const [validating, setValidating] = viewState("Report:validating", false);
  const saved = useQuery({
    queryKey: ["screening", session.user.id, record],
    queryFn: () => detail(session.user.id, record),
    enabled: Boolean(record),
  });
  const result = record ? saved.data : state.result;
  const original = record ? saved.data?.original_image_base64 : state.preview;
  const file = record ? replacement : state.file || replacement;
  const sourceName = record ? saved.data?.filename : state.file?.name;
  const back = record ? `/result/${encodeURIComponent(record)}` : "/result";
  const generation = useMutation("generate-report", {
    mutationFn: async () => {
      let source = file;
      if (!source && original) {
        const blob = await (await fetch(original)).blob();
        source = new File([blob], "retained-handwriting.png", {
          type: blob.type,
        });
      }
      if (!source)
        throw new Error("Choose a handwriting image to generate a report.");
      await report(
        source,
        student,
        examiner,
        result?.backbone || "convnext_tiny",
      );
    },
    retry: false,
  });
  async function selectFile(next) {
    if (!next) return;
    setValidating(true);
    setFileError("");
    setReplacement(null);
    try {
      await validateImage(next);
      setReplacement(next);
    } catch (e) {
      setFileError(message(e));
    } finally {
      setValidating(false);
    }
  }
  if (record && saved.isPending)
    return el(Loading, { text: "Opening report details\u2026" });
  if (record && (saved.error || !saved.data))
    return el(
      fragment,
      null,
      el(
        PageTitle,
        { title: "This screening is unavailable." },
        "Open a saved result from history or start with a new image.",
      ),
      saved.error && el(ErrorNotice, null, message(saved.error)),
      el(
        Link,
        { className: "btn btn--secondary", to: "/history" },
        "Back to history",
      ),
    );
  return el(
    fragment,
    null,
    el(
      Link,
      { className: "back-link", to: result ? back : "/upload" },
      el(ArrowLeft, { size: 16 }),
      result ? "Back to result" : "Back to upload",
    ),
    el(
      PageTitle,
      {
        eyebrow: "A record for professional review",
        title: "Screening report",
      },
      "Add the report details, review what is included, and download a PDF from the screening service.",
    ),
    el(
      "div",
      { className: "report-layout" },
      el(
        "section",
        {
          className: "report-document",
          "aria-label": "Screening report preview",
        },
        el(
          "div",
          { className: "report-document-head" },
          el("span", {
            className: "brand-mark",
            "aria-hidden": "true",
          }),
          el(
            "span",
            null,
            "NeuroWrite AI",
            el("small", null, "Experimental screening support"),
          ),
          el("span", { className: "tag neutral" }, "PDF report"),
        ),
        el("h2", null, "Handwriting screening report"),
        el("p", { className: "muted" }, "Prepared for professional review"),
        el(
          "dl",
          { className: "report-metadata" },
          el(
            "div",
            null,
            el("dt", null, "Student identifier"),
            el("dd", null, student || "Anonymous Student"),
          ),
          el(
            "div",
            null,
            el("dt", null, "Examiner / institution"),
            el("dd", null, examiner || "Educational Specialist"),
          ),
          el(
            "div",
            null,
            el("dt", null, "Source image"),
            el(
              "dd",
              null,
              replacement?.name || sourceName || "No image selected",
            ),
          ),
        ),
        el(
          "div",
          { className: "report-preview-result" },
          el(
            "span",
            { className: "small muted" },
            "Current screening reference",
          ),
          el(
            "h3",
            null,
            result
              ? screeningOutcome(record ? result.category : categoryFor(result))
              : "A screening result will accompany the generated report.",
          ),
          result?.risk_percentage != null &&
            el(
              "p",
              null,
              percent(Number(result.risk_percentage)),
              el("span", null, "Model screening score"),
            ),
          el(
            "p",
            { className: "small muted" },
            "The downloaded report uses a new inference run. This reference is not a preview of its final scores.",
          ),
        ),
        el(
          "div",
          { className: "report-contents" },
          el("h3", null, "Included in the PDF"),
          el(
            "p",
            null,
            el(CheckCircle, { size: 18 }),
            "Screening result and ensemble information",
          ),
          el(
            "p",
            null,
            el(CheckCircle, { size: 18 }),
            "Ensemble Grad-CAM when available",
          ),
          el(
            "p",
            null,
            el(CheckCircle, { size: 18 }),
            "Screening limitations and report details",
          ),
        ),
        el("p", { className: "report-document-foot" }, disclaimer),
      ),
      el(
        "aside",
        { className: "review-panel report-options" },
        el("h2", null, "Report details"),
        el(
          "p",
          null,
          "The report service runs screening again using the original image. Its results may differ from a saved screening.",
        ),
        el(
          "form",
          {
            className: "form-stack",
            onSubmit: (e) => {
              e.preventDefault();
              generation.mutate();
            },
          },
          el(
            "label",
            { htmlFor: "student" },
            "Student identifier",
            el("input", {
              id: "student",
              value: student,
              onChange: (e) => setStudent(e.target.value),
              maxLength: 120,
              placeholder: "Anonymous Student",
            }),
          ),
          el(
            "label",
            { htmlFor: "examiner" },
            "Examiner or institution",
            el("input", {
              id: "examiner",
              value: examiner,
              onChange: (e) => setExaminer(e.target.value),
              maxLength: 120,
              placeholder: "Educational Specialist",
            }),
          ),
          !original &&
            (record || !state.file) &&
            el(
              "label",
              { htmlFor: "report-original" },
              "Original image",
              el(
                "p",
                { className: "small muted" },
                result
                  ? "The original was not retained. Re-upload an image to generate a new analysis."
                  : "Choose an original handwriting image to generate a screening report.",
              ),
              el("input", {
                id: "report-original",
                type: "file",
                accept: "image/png,image/jpeg,image/webp,image/bmp",
                onChange: (e) => void selectFile(e.target.files?.[0]),
              }),
            ),
          replacement &&
            el("p", { className: "small" }, "Selected: ", replacement.name),
          fileError && el(ErrorNotice, null, fileError),
          generation.isError &&
            el(ErrorNotice, null, message(generation.error)),
          generation.isSuccess &&
            el(
              "p",
              { role: "status", className: "notice success" },
              "Your report is ready. Check your browser downloads.",
            ),
          el(
            "button",
            {
              className: "btn btn--primary",
              disabled:
                generation.isPending || validating || (!file && !original),
            },
            generation.isPending
              ? el(Busy, null, "Generating report\u2026")
              : el(
                  fragment,
                  null,
                  el(DownloadSimple, { size: 18 }),
                  "Generate report",
                ),
          ),
        ),
        el(
          "div",
          { className: "notice" },
          el(Info, { size: 20 }),
          el(
            "p",
            null,
            "Only enter details you want included in the downloaded report.",
          ),
        ),
      ),
    ),
  );
}
