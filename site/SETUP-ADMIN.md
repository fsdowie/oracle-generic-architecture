# Estate Maps: users, admin and comments — setup

What it adds: self-registration with admin approval, per-user map access, an Admin tab (users, access, invites, comments, live join log), and an "Add comment" button on every map item that emails the admin.

## 1. Database
Supabase → SQL Editor → run `supabase/migrations/003-users-admin-comments.sql`.

## 2. Allow registration
Supabase → Authentication → Sign In / Providers → Email:
- turn **on** "Allow new users to sign up";
- turn **off** "Confirm email" (approval by the admin is the gate; no email goes to the registrant).

New accounts start as *pending* and can read no map until the admin activates them and assigns maps.

## 3. The admin account
Register on the site with the admin email (or create it in Authentication → Users), then run the last statement of the migration (`update public.profiles set is_admin = true ...`) again so the account becomes the active admin with every map.

## 4. Email (Resend)
1. Create a Resend account with the admin email; create an API key.
2. Without a verified domain Resend only delivers to the account's own address, which is all comments and registration alerts need.
3. Invites to other people need a verified domain in Resend, set as the **custom SMTP** sender in Supabase → Authentication → Emails → SMTP (host `smtp.resend.com`, port 465, user `resend`, password = API key), and `MAIL_FROM` set to an address on that domain.

## 5. Edge Functions
Functions: `estate-admin`, `estate-comment`, `estate-signup-notify` (shared code in `supabase/functions/_shared`).
Function secrets: `ESTATE_SECRET_KEY` (the project's `sb_secret_…` key), `RESEND_API_KEY`, `ADMIN_EMAIL`, `SITE_URL`; optional `MAIL_FROM`, `NOTIFY_USERS=true` (emails users when activated; needs a verified domain).

The functions check the caller's session themselves (`auth.getUser`) and the admin role from `profiles`. The project uses the new JWT signing keys, which the platform's built-in JWT gate does not support, so the functions are deployed with that gate off. Deploy with the Supabase CLI:
```
supabase secrets set --project-ref <ref> ESTATE_SECRET_KEY=... RESEND_API_KEY=... ADMIN_EMAIL=... SITE_URL=https://estate-map-lovat.vercel.app
supabase functions deploy estate-admin --project-ref <ref> --no-verify-jwt
supabase functions deploy estate-comment --project-ref <ref> --no-verify-jwt
supabase functions deploy estate-signup-notify --project-ref <ref> --no-verify-jwt
```

## Using it
- **Approve someone:** Admin tab → set status *active*, tick their maps, Save. They sign in with the password they chose.
- **Invite:** Admin tab → Add a user → *Send invite email* (needs step 4.3) or *Create with a password*.
- **Comments:** arrive by email (Reply goes to the viewer) and in the Admin tab, where you mark them accepted or rejected.
- **Live log:** registrations, sign-ins, map opens and comments appear as they happen.
