import { database } from "./supabase.js";
import { categoryFor } from "./contracts.js";
import { fileData } from "./api.js";
export const PAGE_SIZE = 10;
const metadata =
  "id,user_id,subject,filename,date,created_at,category,risk_percentage,risk_score,screening_classification,uncertainty_band,per_fold_predictions,models_in_ensemble,backbone";
export async function history(userId, page = 0, search = "", category = "") {
  let query = database()
    .from("screenings")
    .select(metadata, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (search.trim())
    query = query.ilike("subject", `%${search.trim().replace(/[%_\\]/g, "")}%`);
  if (category) query = query.eq("category", category);
  const { data, count, error } = await query.range(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE - 1,
  );
  if (error) throw new Error(error.message);
  return { rows: data, count: count ?? 0 };
}
export async function detail(userId, id) {
  const { data, error } = await database()
    .from("screenings")
    .select(
      `${metadata},original_image_base64,attention_overlay_base64,gradcam_overlay_base64,ig_overlay_base64`,
    )
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
export async function saveResult(input) {
  const { result, retain, file } = input;
  const category = categoryFor(result);
  const { error } = await database()
    .from("screenings")
    .upsert(
      {
        id: input.id,
        user_id: input.userId,
        subject: input.subject || file.name,
        filename: file.name,
        date: new Date().toLocaleDateString("en-CA"),
        category,
        status: category === "Elevated" ? "Flagged" : "Completed",
        risk_score: result.risk_score,
        risk_percentage: result.risk_percentage,
        uncertainty_band: result.uncertainty_band,
        screening_classification: result.screening_classification,
        per_fold_predictions: result.per_fold_predictions,
        models_in_ensemble: result.models_in_ensemble,
        backbone: result.backbone,
        ink_mass_fraction: result.ink_mass_fraction ?? null,
        original_image_base64: retain ? await fileData(file) : null,
        preview_image_base64: null,
        attention_overlay_base64: retain
          ? (result.attention_overlay_base64 ?? null)
          : null,
        gradcam_overlay_base64: retain
          ? (result.gradcam_overlay_base64 ?? null)
          : null,
        ig_overlay_base64: retain ? (result.ig_overlay_base64 ?? null) : null,
      },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);
}
