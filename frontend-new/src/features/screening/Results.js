import { el, fragment, viewState } from "../../ui/view.js";
import { Link, Navigate, useParams } from "../../ui/navigation.js";
import { useMutation, useQuery, useQueryClient } from "../../ui/queries.js";
import { imageDialog, tabKeys } from "../../ui/controls.js";
import {
  ArrowLeft,
  DownloadSimple,
  FloppyDisk,
  MagnifyingGlassPlus,
  X,
  Info,
  CheckCircle,
  FileImage,
} from "../../ui/icons.js";
import {
  Busy,
  ErrorNotice,
  Loading,
  PageTitle,
} from "../../components/ui/Common.js";
import { useWorkflow } from "./Workflow.js";
import { useAuth } from "../auth/AuthProvider.js";
import {
  categoryFor,
  message,
  percent,
  resultFromRecord,
} from "../../lib/contracts.js";
import { detail, saveResult } from "../../lib/records.js";
export default function CurrentResult() {
  const { state } = useWorkflow();
  if (state.file && !state.result)
    return el(Navigate, { to: "/processing", replace: true });
  if (!state.result)
    return el(
      fragment,
      null,
      el(
        PageTitle,
        { eyebrow: "Screening result", title: "No screening result loaded." },
        "Run a handwriting screening to review its result, score, and explanations here.",
      ),
      el(
        Link,
        { className: "btn btn--primary", to: "/upload" },
        "Choose image",
      ),
    );
  return el(ResultView, {
    result: state.result,
    original: state.preview,
    file: state.file || undefined,
    title: state.subject || state.file?.name || "Handwriting screening",
    current: true,
  });
}
export function SavedDetail() {
  const { id = "" } = useParams();
  const { session } = useAuth();
  const query = useQuery({
    queryKey: ["screening", session.user.id, id],
    queryFn: () => detail(session.user.id, id),
  });
  if (query.isPending)
    return el(Loading, { text: "Opening saved screening\u2026" });
  if (query.error)
    return el(
      ErrorNotice,
      null,
      message(query.error),
      " ",
      el(
        "button",
        { className: "text-link", onClick: () => query.refetch() },
        "Retry loading",
      ),
    );
  if (!query.data)
    return el(
      fragment,
      null,
      el(
        PageTitle,
        { title: "Screening not found." },
        "This record may have been removed, or it belongs to another account.",
      ),
      el(
        Link,
        { className: "btn btn--secondary", to: "/history" },
        "Back to history",
      ),
    );
  let result;
  try {
    result = resultFromRecord(query.data);
  } catch {
    return el(
      fragment,
      null,
      el(
        PageTitle,
        { title: "This record is incomplete." },
        "An older record is missing required model information. Start a new screening to get a complete result.",
      ),
      el(Link, { to: "/history", className: "text-link" }, "Back to history"),
    );
  }
  return el(ResultView, {
    key: query.data.id,
    result: result,
    original: query.data.original_image_base64 || "",
    title: query.data.subject,
    date: query.data.created_at,
    recordId: query.data.id,
  });
}
function ResultView({
  result,
  original,
  file,
  title,
  current = false,
  date,
  recordId,
}) {
  const workflow = useWorkflow();
  const { session } = useAuth();
  const cache = useQueryClient();
  const [retain, setRetain] = viewState("Results:retain", false);
  const [zoom, setZoom] = viewState("Results:zoom", false);
  const [tab, setTab] = viewState("Results:tab", "original");
  const views = [
    {
      id: "original",
      title: "Original",
      source: original,
      info: "The original handwriting image, without model attribution.",
    },
    {
      id: "gradcam",
      title: "Grad-CAM",
      source: result.gradcam_overlay_base64,
      info: "Shows image regions associated with the model output. Attribution is not clinical evidence.",
    },
    {
      id: "ig",
      title: "Stroke attribution",
      source: result.ig_overlay_base64,
      info: "Integrated Gradients attributes the model output to image pixels along handwriting strokes.",
    },
  ];
  const selected = views.find((v) => v.id === tab);
  const save = useMutation("save-result", {
    mutationFn: () =>
      saveResult({
        id: workflow.state.id,
        userId: session.user.id,
        file: file,
        subject: workflow.state.subject,
        result,
        retain,
      }),
    retry: false,
    onSuccess: () => {
      workflow.markSaved();
      void cache.invalidateQueries({ queryKey: ["history", session.user.id] });
    },
  });
  const elevated = categoryFor(result) === "Elevated";
  return el(
    fragment,
    null,
    el(
      Link,
      { className: "back-link", to: current ? "/upload" : "/history" },
      el(ArrowLeft, { size: 16 }),
      current ? "Back to image" : "Back to history",
    ),
    el(
      PageTitle,
      {
        eyebrow: current ? "Screening complete" : "Saved screening",
        title: title,
        action: el(
          Link,
          {
            className: "btn btn--secondary",
            to: current
              ? "/report"
              : `/report?record=${encodeURIComponent(recordId)}`,
          },
          el(DownloadSimple, { size: 18 }),
          "Generate report",
        ),
      },
      date
        ? new Date(date).toLocaleString()
        : "Review the signal alongside the handwriting and model explanations.",
    ),
    el(
      "div",
      { className: `classification ${elevated ? "elevated" : "typical"}` },
      el("span", { className: "classification-icon" }, el(Info, { size: 24 })),
      el(
        "div",
        null,
        el("strong", null, result.screening_classification),
        el(
          "p",
          null,
          "This is an experimental screening signal for professional review.",
        ),
      ),
      el(
        "span",
        { className: "tag" },
        elevated ? "Elevated signal" : "Typical pattern",
      ),
    ),
    el(
      "div",
      { className: "results-layout" },
      el(
        "div",
        { className: "viewer" },
        el(
          "div",
          null,
          el(
            "div",
            { className: "viewer-toolbar" },
            el(
              "div",
              {
                role: "tablist",
                "aria-label": "Image explanations",
                className: "viewer-tabs",
                onKeyDown: tabKeys,
              },
              views.map((view) =>
                el(
                  "button",
                  {
                    key: view.id,
                    type: "button",
                    role: "tab",
                    id: `image-tab-${view.id}`,
                    "aria-selected": tab === view.id,
                    "aria-controls": `image-view-${view.id}`,
                    "data-state": tab === view.id ? "active" : "inactive",
                    tabIndex: tab === view.id ? 0 : -1,
                    onClick: () => setTab(view.id),
                  },
                  view.title,
                ),
              ),
            ),
            el(
              "button",
              {
                className: "icon-button",
                "aria-label": "Enlarge selected image",
                disabled: !selected.source,
                onClick: () => setZoom(true),
              },
              el(MagnifyingGlassPlus, { size: 20 }),
            ),
          ),
          views.map((view) =>
            el(
              "div",
              {
                key: view.id,
                role: "tabpanel",
                id: `image-view-${view.id}`,
                "aria-labelledby": `image-tab-${view.id}`,
                tabIndex: 0,
                hidden: tab !== view.id,
              },
              tab === view.id &&
                el(
                  "div",
                  { className: "viewer-image" },
                  view.source
                    ? el("img", {
                        src: view.source,
                        alt: `${view.title} view of the handwriting image`,
                      })
                    : el(
                        "div",
                        { className: "unavailable-image" },
                        el(FileImage, { size: 36, weight: "light" }),
                        el("h3", null, view.title, " is unavailable."),
                        el(
                          "p",
                          null,
                          view.id === "original"
                            ? "The original image was not retained with this record."
                            : "This explanation was not returned or retained with the screening.",
                        ),
                      ),
                ),
              tab === view.id &&
                el(
                  "p",
                  { className: "viewer-info" },
                  el(Info, { size: 18, "aria-hidden": "true" }),
                  view.info,
                ),
            ),
          ),
        ),
      ),
      el(
        "aside",
        { className: "result-summary" },
        el("h2", null, "Screening summary"),
        el(
          "div",
          { className: "score" },
          el("span", null, percent(result.risk_percentage)),
          el("p", null, "Model screening score"),
        ),
        el(
          "p",
          { className: "small" },
          "This score is a model signal, not the probability of a diagnosis.",
        ),
        el(
          "div",
          { className: "fold-summary" },
          el("span", null, "Fold range"),
          el(
            "strong",
            null,
            percent(result.uncertainty_band.low * 100),
            " \u2013",
            " ",
            percent(result.uncertainty_band.high * 100),
          ),
        ),
        el(
          "p",
          { className: "small muted" },
          "The range describes disagreement across the ensemble, not a clinical confidence interval.",
        ),
        el(
          "details",
          null,
          el(
            "summary",
            null,
            "View ",
            result.models_in_ensemble,
            " fold scores",
          ),
          el(
            "table",
            { className: "fold-table" },
            el(
              "caption",
              { className: "sr-only" },
              "Individual ensemble scores",
            ),
            el(
              "thead",
              null,
              el("tr", null, el("th", null, "Fold"), el("th", null, "Score")),
            ),
            el(
              "tbody",
              null,
              result.per_fold_predictions.map((score, i) =>
                el(
                  "tr",
                  { key: i },
                  el("td", null, i + 1),
                  el("td", null, percent(score * 100)),
                ),
              ),
            ),
          ),
        ),
        el("small", { className: "mono" }, result.backbone),
        current
          ? el(
              "div",
              { className: "save-panel" },
              workflow.state.saved
                ? el(
                    "p",
                    { role: "status", className: "saved-state" },
                    el(CheckCircle, { size: 20 }),
                    "Result saved to history",
                  )
                : el(
                    fragment,
                    null,
                    el(
                      "label",
                      { className: "checkbox-label" },
                      el("input", {
                        type: "checkbox",
                        checked: retain,
                        onChange: (e) => setRetain(e.target.checked),
                        disabled: save.isPending,
                      }),
                      "Retain original and explanation images",
                    ),
                    el(
                      "small",
                      null,
                      "Optional. Images are stored with this record only if selected.",
                    ),
                    el(
                      "button",
                      {
                        className: "btn btn--primary",
                        disabled: save.isPending,
                        onClick: () => save.mutate(),
                      },
                      save.isPending
                        ? el(Busy, null, "Saving result\u2026")
                        : el(
                            fragment,
                            null,
                            el(FloppyDisk, { size: 18 }),
                            save.isError ? "Retry save" : "Save result",
                          ),
                    ),
                    save.isError &&
                      el(
                        ErrorNotice,
                        null,
                        "Your result is available, but could not be saved.",
                        " ",
                        message(save.error),
                      ),
                  ),
            )
          : el("p", { className: "small muted mono" }, "Record ", recordId),
      ),
    ),
    el(
      "div",
      { className: "notice disclaimer" },
      el(Info, { size: 22 }),
      el("p", null, result.disclaimer),
    ),
    zoom &&
      imageDialog({
        title: selected.title,
        close: () => setZoom(false),
        children: [
          el(
            "button",
            {
              className: "icon-button dialog-close",
              "aria-label": "Close enlarged image",
              onClick: (event) => {
                event.currentTarget.closest("dialog").close();
                setZoom(false);
              },
            },
            el(X, { size: 22 }),
          ),
          selected.source &&
            el("img", {
              src: selected.source,
              alt: `Enlarged ${selected.title.toLowerCase()} handwriting view`,
            }),
        ],
      }),
  );
}
