import { resultSchema } from "./contracts.js";
import { supabase } from "./supabase.js";
const base = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);
async function request(path, init, signal) {
  const configured = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS);
  const timeout = AbortSignal.timeout(
    Number.isFinite(configured) && configured > 0 ? configured : 10 * 60 * 1000,
  );
  const combined = signal ? AbortSignal.any([timeout, signal]) : timeout;
  const session = await supabase?.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.data.session)
    headers.set("Authorization", `Bearer ${session.data.session.access_token}`);
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers,
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted)
      throw new DOMException("Request canceled", "AbortError");
    if (timeout.aborted)
      throw new Error(
        "The request took too long. The server may still be processing.",
        { cause: error },
      );
    if (error instanceof TypeError)
      throw new Error(
        "Could not reach the screening service. Check your connection and try again.",
        { cause: error },
      );
    throw error;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : Array.isArray(body?.detail)
          ? body.detail
              .map((e) => e.msg)
              .filter(Boolean)
              .join(". ")
          : `Request failed (HTTP ${response.status}).`;
    throw new Error(detail);
  }
  return response;
}
export async function screen(file, signal) {
  const body = new FormData();
  body.append("file", file);
  const response = await request(
    "/api/v1/screen?backbone=convnext_tiny&input_mode=page&include_overlay_base64=true",
    { method: "POST", body },
    signal,
  );
  const parsed = resultSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error(
      "The screening service returned an incomplete or unexpected result. Please retry or contact the project maintainer.",
    );
  return parsed.data;
}
export async function report(file, student, examiner, backbone) {
  const body = new FormData();
  body.append("file", file);
  body.append("student_id", student || "Anonymous Student");
  body.append("examiner_name", examiner || "Educational Specialist");
  body.append("backbone", backbone);
  body.append("input_mode", "page");
  const response = await request("/api/v1/report", { method: "POST", body });
  const blob = await response.blob();
  if (
    !blob.type.includes("application/pdf") ||
    !(await blob.slice(0, 5).text()).startsWith("%PDF")
  )
    throw new Error("The service did not return a valid PDF. Please retry.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeId = student
    .replace(/[^\p{L}\p{M}\p{N}_.-]+/gu, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 60);
  link.download = `NeuroWrite-${safeId || "screening"}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function validateImage(file) {
  if (!file.size)
    throw new Error("This file is empty. Choose a handwriting image.");
  if (
    !["image/png", "image/jpeg", "image/webp", "image/bmp"].includes(file.type)
  )
    throw new Error("Choose a PNG, JPEG, WebP, or BMP image.");
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose an image smaller than 25 MiB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    throw new Error("This image could not be read. Choose another image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export const fileData = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("The original image could not be retained."));
    reader.readAsDataURL(file);
  });
