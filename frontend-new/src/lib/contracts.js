import { z } from "zod";
const probability = z.number().finite().min(0).max(1);
const image = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp|bmp);base64,/)
  .nullable()
  .optional();
export const resultSchema = z
  .object({
    risk_score: probability,
    risk_percentage: z.number().finite().min(0).max(100),
    risk_category: z.enum(["Elevated Risk", "Typical"]),
    screening_classification: z.string().min(1),
    uncertainty_band: z
      .object({
        std: probability,
        low: probability,
        high: probability,
        spread: probability,
      })
      .refine((v) => v.high >= v.low, "Invalid fold range"),
    per_fold_predictions: z.array(probability).min(1),
    models_in_ensemble: z.number().int().positive(),
    backbone: z.string().min(1),
    input_type: z.string(),
    disclaimer: z.string().min(1),
    ink_mass_fraction: probability.nullable().optional(),
    attention_overlay_base64: image,
    gradcam_overlay_base64: image,
    gradcam_target: z.literal("ensemble_mean").optional(),
    ig_overlay_base64: image,
  })
  .refine(
    (v) => v.models_in_ensemble === v.per_fold_predictions.length,
    "Fold count does not match the response",
  );
export const disclaimer =
  "Experimental screening only. This result does not replace a formal assessment by a qualified professional.";
export function categoryFor(result) {
  return result.risk_category === "Elevated Risk" ? "Elevated" : "Typical";
}
export function screeningOutcome(category) {
  if (category === "Elevated") return "Potential dyslexia";
  if (category === "Typical") return "Normal";
  return "Unavailable";
}
export function resultFromRecord(row) {
  const category = z.enum(["Elevated", "Typical"]).parse(row.category);
  return resultSchema.parse({
    ...row,
    risk_category: category === "Elevated" ? "Elevated Risk" : "Typical",
    input_type: "page",
    disclaimer,
  });
}
export function message(error) {
  return error instanceof Error
    ? error.message
    : "The request could not finish. Please try again.";
}
export const percent = (v) => `${v.toFixed(1)}%`;
