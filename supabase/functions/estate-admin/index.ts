// Estate Map admin actions. The caller must be an active admin (profiles.is_admin).
// POST { action, ... } with actions:
//   list_users | update_user {user_id, status?, maps?, is_admin?} | invite {email, display_name?, maps}
//   create_user {email, password, display_name?, maps} | delete_user {user_id}
//   list_comments | set_comment_status {id, status} | list_activity
import { adminClient, caller, corsHeaders, esc, json, logEvent, profileOf, sendEmail } from "../_shared/util.ts";

const MAP_ID = /^(\*|[a-z0-9-]{1,40})$/;
const cleanMaps = (m: unknown) => Array.isArray(m) ? [...new Set(m.map(String).filter((x) => MAP_ID.test(x)))] : [];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const sb = adminClient();
  try {
    const user = await caller(req, sb);
    if (!user) return json({ error: "Please sign in again." }, 401);
    const me = await profileOf(sb, user.id);
    if (!me?.is_admin || me.status !== "active") return json({ error: "Admins only." }, 403);
    const body = await req.json();
    const site = Deno.env.get("SITE_URL") || undefined;

    switch (body.action) {
      case "list_users": {
        const { data: profiles, error } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        const last: Record<string, string | null> = {};
        for (let page = 1; page < 20; page++) {
          const { data } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
          (data?.users ?? []).forEach((u) => { last[u.id] = u.last_sign_in_at ?? null; });
          if (!data || data.users.length < 1000) break;
        }
        return json({ users: (profiles ?? []).map((p) => ({ ...p, last_sign_in_at: last[p.id] ?? null })) });
      }
      case "update_user": {
        const target = await profileOf(sb, body.user_id);
        if (!target) return json({ error: "User not found." }, 404);
        const patch: Record<string, unknown> = {};
        if (body.status !== undefined) {
          if (!["pending", "active", "disabled"].includes(body.status)) return json({ error: "Bad status." }, 400);
          if (target.id === me.id && body.status !== "active") return json({ error: "You can't deactivate yourself." }, 400);
          patch.status = body.status;
          if (body.status === "active" && target.status !== "active") patch.approved_at = new Date().toISOString();
        }
        if (body.maps !== undefined) patch.maps = cleanMaps(body.maps);
        if (body.is_admin !== undefined) {
          if (target.id === me.id && !body.is_admin) return json({ error: "You can't remove your own admin role." }, 400);
          patch.is_admin = !!body.is_admin;
        }
        const { error } = await sb.from("profiles").update(patch).eq("id", target.id);
        if (error) throw error;
        if (patch.status !== undefined) {
          await sb.auth.admin.updateUserById(target.id, { ban_duration: patch.status === "disabled" ? "876000h" : "none" });
        }
        await logEvent(sb, me.id, null, "admin_update", `${target.email}: ${JSON.stringify(patch)}`);
        if (patch.status === "active" && target.status !== "active" && Deno.env.get("NOTIFY_USERS") === "true") {
          await sendEmail({ to: target.email, subject: "Your Estate Map access is ready",
            text: `You can now sign in${site ? ` at ${site}` : ""} with the password you chose.`,
            html: `<p>You can now sign in${site ? ` at <a href="${esc(site)}">${esc(site)}</a>` : ""} with the password you chose.</p>` });
        }
        return json({ ok: true });
      }
      case "invite": {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!email.includes("@")) return json({ error: "A valid email is required." }, 400);
        const { data, error } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo: site, data: { display_name: body.display_name || "" } });
        if (error) return json({ error: `Invite failed: ${error.message}. Invites need a custom SMTP sender in Supabase Auth.` }, 400);
        await sb.from("profiles").update({ status: "active", maps: cleanMaps(body.maps), approved_at: new Date().toISOString(), display_name: body.display_name || null }).eq("id", data.user.id);
        await logEvent(sb, me.id, null, "invited", email);
        return json({ ok: true });
      }
      case "create_user": {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!email.includes("@") || String(body.password ?? "").length < 10) return json({ error: "Email and a password of at least 10 characters are required." }, 400);
        const { data, error } = await sb.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { display_name: body.display_name || "" } });
        if (error) return json({ error: error.message }, 400);
        await sb.from("profiles").update({ status: "active", maps: cleanMaps(body.maps), approved_at: new Date().toISOString(), display_name: body.display_name || null }).eq("id", data.user.id);
        await logEvent(sb, me.id, null, "created_user", email);
        return json({ ok: true });
      }
      case "delete_user": {
        if (body.user_id === me.id) return json({ error: "You can't delete yourself." }, 400);
        const target = await profileOf(sb, body.user_id);
        const { error } = await sb.auth.admin.deleteUser(body.user_id);
        if (error) throw error;
        await logEvent(sb, me.id, null, "deleted_user", target?.email ?? body.user_id);
        return json({ ok: true });
      }
      case "list_comments": {
        const { data, error } = await sb.from("comments").select("*").order("created_at", { ascending: false }).limit(300);
        if (error) throw error;
        return json({ comments: data });
      }
      case "set_comment_status": {
        if (!["new", "accepted", "rejected"].includes(body.status)) return json({ error: "Bad status." }, 400);
        const { error } = await sb.from("comments").update({ status: body.status }).eq("id", body.id);
        if (error) throw error;
        return json({ ok: true });
      }
      case "list_activity": {
        const { data, error } = await sb.from("activity_log").select("*").order("at", { ascending: false }).limit(300);
        if (error) throw error;
        return json({ activity: data });
      }
      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ error: "Something went wrong. Check the function logs." }, 500);
  }
});
