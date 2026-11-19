import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
function configuredClient() {
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol)
      ? createClient(url, key)
      : null;
  } catch {
    return null;
  }
}
export const supabase = configuredClient();
export function database() {
  if (!supabase) throw new Error("Account services are not configured.");
  return supabase;
}
