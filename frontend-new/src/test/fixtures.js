export const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4h8AAAAASUVORK5CYII=";
export const fixture = {
  risk_score: 0.64,
  risk_percentage: 64,
  risk_category: "Elevated Risk",
  screening_classification:
    "Elevated Screening Signal (Specialist Follow-Up Recommended)",
  uncertainty_band: { low: 0.6, high: 0.7, std: 0.04, spread: 0.1 },
  per_fold_predictions: [0.6, 0.62, 0.64, 0.64, 0.7],
  models_in_ensemble: 5,
  backbone: "convnext_tiny",
  input_type: "page",
  disclaimer:
    "SCREENING TOOL: Experimental screening only. A qualified professional must conduct a formal assessment.",
  attention_overlay_base64: `data:image/png;base64,${png}`,
  gradcam_overlay_base64: null,
  ig_overlay_base64: null,
};
