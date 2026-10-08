// Estate Map: a signed-in, active viewer submits a comment on a map item.
// Stores it, then emails the admin with the viewer as Reply-To.
import { adminClient, caller, corsHeaders, esc, json, logEvent, profileOf, sendEmail } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = adminClient();
    const user = await caller(req, sb);
    if (!user) return json({ error: "Please sign in again." }, 401);
    const me = await profileOf(sb, user.id);
    if (!me || me.status !== "active") return json({ error: "Your account is not active yet." }, 403);

    const { map, tab, item_id, item_title, body } = await req.json();
    const text = String(body ?? "").trim();
    if (!map || !text) return json({ error: "A comment is required." }, 400);
    if (text.length > 4000) return json({ error: "Please keep comments under 4,000 characters." }, 400);

    const row = {
      user_id: user.id, email: me.email, map: String(map).slice(0, 40), tab: tab ? String(tab).slice(0, 60) : null,
      item_id: item_id ? String(item_id).slice(0, 80) : null, item_title: item_title ? String(item_title).slice(0, 200) : null, body: text,
    };
    const { data: saved, error } = await sb.from("comments").insert(row).select("id").single();
    if (error) throw error;

    const who = me.display_name ? `${me.display_name} <${me.email}>` : me.email;
    const where = [row.map, row.tab, row.item_title].filter(Boolean).join(" › ");
    const subject = `[Estate Map] Comment from ${me.display_name || me.email} on ${row.item_title || row.tab || row.map}`;
    const plain = `From: ${who}${me.organisation ? ` (${me.organisation})` : ""}\nWhere: ${where}\n\n${text}\n\nReply to this email to answer ${me.email}. Review it in the Admin tab (comment #${saved.id}).`;
    const html = `<p><b>From:</b> ${esc(who)}${me.organisation ? ` (${esc(me.organisation)})` : ""}<br><b>Where:</b> ${esc(where)}</p>
<blockquote style="border-left:3px solid #0E6A6C;padding-left:10px;margin:12px 0;white-space:pre-wrap">${esc(text)}</blockquote>
<p style="color:#5B676C">Reply to this email to answer ${esc(me.email)}. Review it in the Admin tab (comment #${saved.id}).</p>`;
    const admin = Deno.env.get("ADMIN_EMAIL");
    const sent = admin ? await sendEmail({ to: admin, subject, text: plain, html, replyTo: me.email }) : false;
    if (sent) await sb.from("comments").update({ emailed: true }).eq("id", saved.id);
    await logEvent(sb, user.id, me.email, "commented", where);
    return json({ ok: true, id: saved.id, emailed: sent });
  } catch (err) {
    console.error(err);
    return json({ error: "The comment could not be saved. Please try again." }, 500);
  }
});
