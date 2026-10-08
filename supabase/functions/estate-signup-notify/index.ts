// Estate Map: called by the registration form right after sign-up (no session yet).
// Emails the admin once per new registration. Only acts on accounts created in the last 30 minutes
// that have not been notified, so it can't be used to send arbitrary mail.
import { adminClient, corsHeaders, esc, json, sendEmail } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email } = await req.json();
    const addr = String(email ?? "").trim().toLowerCase();
    if (!addr) return json({ ok: true });
    const sb = adminClient();
    const { data: p } = await sb.from("profiles").select("*").eq("email", addr).maybeSingle();
    if (!p || p.notified_at || Date.now() - new Date(p.created_at).getTime() > 30 * 60 * 1000) return json({ ok: true });

    const site = Deno.env.get("SITE_URL") || "";
    const name = p.display_name || addr;
    const subject = `[Estate Map] New registration: ${name}`;
    const text = `${name} <${addr}> registered for the Estate Maps.\nOrganisation / relationship: ${p.organisation || "—"}\n\nOpen the Admin tab to assign maps or decline.${site ? `\n${site}` : ""}`;
    const html = `<p><b>${esc(name)}</b> &lt;${esc(addr)}&gt; registered for the Estate Maps.</p>
<p><b>Organisation / relationship:</b> ${esc(p.organisation || "—")}</p>
<p>Open the Admin tab to assign maps or decline.${site ? ` <a href="${esc(site)}">${esc(site)}</a>` : ""}</p>`;
    const admin = Deno.env.get("ADMIN_EMAIL");
    if (admin && await sendEmail({ to: admin, subject, text, html, replyTo: addr })) {
      await sb.from("profiles").update({ notified_at: new Date().toISOString() }).eq("id", p.id);
    }
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: true });
  }
});
