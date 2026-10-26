import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

/**
 * Security guard: the service-role key bypasses row-level security and must
 * never be shipped to a browser. If someone pastes one into the frontend env,
 * refuse to create a client and surface a configuration error instead.
 */
function readJwtRole(key: string): string | null {
  const payload = key.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    const parsed = JSON.parse(json) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

function validateConfig(): string | null {
  if (!rawUrl && !rawAnonKey) {
    return "Supabase is not connected. Real sign-in and registration are unavailable until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local and the app is restarted.";
  }

  if (!rawUrl || !rawAnonKey) {
    return "Supabase is only half configured. Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.";
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "VITE_SUPABASE_URL must be an http(s) URL, for example https://your-project.supabase.co.";
    }
  } catch {
    return "VITE_SUPABASE_URL is not a valid URL. Copy the Project URL from the Supabase dashboard.";
  }

  if (readJwtRole(rawAnonKey) === "service_role") {
    return "The key in VITE_SUPABASE_ANON_KEY is a service-role key. Never put a service-role key in the frontend. Use the anon (public) key or a publishable key instead.";
  }

  return null;
}

export const supabaseConfigError = validateConfig();
export const isSupabaseConfigured = Boolean(rawUrl && rawAnonKey && !supabaseConfigError);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Build an absolute redirect URL for Supabase email links. */
export function authRedirectUrl(path = "/verify-email"): string | undefined {
  if (typeof window === "undefined") return undefined;
  // BASE_URL ends with "/" (e.g. "/" or "/studycircle/"), so strip it before
  // appending the route to keep a single slash between both parts.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}${path}`;
}
