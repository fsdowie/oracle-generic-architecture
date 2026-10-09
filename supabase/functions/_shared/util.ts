// Shared helpers for the Estate Map Edge Functions.
// Secrets (supabase secrets set ...): ESTATE_SECRET_KEY, RESEND_API_KEY, ADMIN_EMAIL, MAIL_FROM (optional), SITE_URL (optional), NOTIFY_USERS (optional "true").
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/** The project's current secret key. Prefers the platform-managed SUPABASE_SECRET_KEYS (JSON map of
 *  sb_secret_ keys, always valid), then the ESTATE_SECRET_KEY secret. Legacy JWT keys are disabled here. */
function secretKey(): string {
  const managed = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (managed) {
    try {
      const keys = Object.values(JSON.parse(managed)).filter((k) => typeof k === "string" && k.startsWith("sb_secret_")) as string[];
      if (keys.length) return keys[0];
    } catch (_) {
      if (managed.startsWith("sb_secret_")) return managed;
    }
  }
  return Deno.env.get("ESTATE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Returns the signed-in caller, or null. */
export async function caller(req: Request, sb: SupabaseClient): Promise<User | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  return error ? null : data.user;
}

export interface Profile {
  id: string; email: string; display_name: string | null; organisation: string | null;
  status: string; maps: string[]; is_admin: boolean;
}

export async function profileOf(sb: SupabaseClient, id: string): Promise<Profile | null> {
  const { data } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  return data as Profile | null;
}

export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** Sends an email through Resend. Returns true when accepted. */
export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string; replyTo?: string }): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.error("RESEND_API_KEY is not set"); return false; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("MAIL_FROM") || "Estate Map <onboarding@resend.dev>",
      to: [opts.to],
      reply_to: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
  return res.ok;
}

export async function logEvent(sb: SupabaseClient, user_id: string | null, email: string | null, event: string, detail?: string) {
  await sb.from("activity_log").insert({ user_id, email, event, detail: detail ?? null });
}
