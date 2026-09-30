# Estate map: private hosting setup

The same pattern as vaireferee (GitHub Actions → Vercel, Supabase Auth), with one difference: **the map data never ships with the website.**

```
Browser ──► Vercel (site/public: login page + renderer, no content)
   │
   └─ sign in ──► Supabase Auth (email + password, sign-ups disabled)
                     │
                     └─ download map.json ──► Supabase Storage, private bucket "estate-map"
                                              readable only by emails in public.map_viewers
GitHub push to main ──► Actions: validate pack → build map.json → upload to bucket → deploy site/public
```

| What | Where | Public? |
|---|---|---|
| Login page, renderer, Supabase client | `site/public/` → Vercel | Yes (contains no architecture content) |
| Map model (nodes, flows, process text) | `site/model/map-model.json` | No: private repo only |
| Built data (`map.json`) | Supabase bucket `estate-map` | No: row-level security |
| Allow-list | `public.map_viewers` table | No: no client policies |

Takes about 20 minutes, once.

## 1. Create a new Supabase project (not the vaireferee one)

1. supabase.com → New project, e.g. `estate-map`. Free tier is enough.
2. **SQL Editor** → paste `supabase/setup.sql`. Change `you@example.com` on the last line to your email → Run.
3. **Authentication → Sign In / Providers → Email**: keep Email enabled, turn **off "Allow new users to sign up"**. Only users you create can sign in.
4. **Authentication → Users → Add user → Create new user**: your email, a strong password, tick *Auto Confirm User*.
5. **Project Settings → API**: copy the **Project URL**, the **anon public** key and the **service_role** key. The service_role key is a secret: it goes into GitHub only.

## 2. Create the Vercel project (don't connect Git)

Importing the repository through Vercel's "Import Git Repository" would deploy the whole repo, including the Markdown files. Create the project from the CLI instead, so only `site/public` is ever uploaded:

```powershell
cd site\public
npx vercel link        # "Set up and link?" Yes → your account → "Link to existing project?" No → name: estate-map
type .vercel\project.json   # shows orgId and projectId
```

Then in the Vercel dashboard, open the project → **Settings → Build and Deployment**: Framework Preset **Other**, leave Build Command and Output Directory empty.

Create a token: vercel.com → Account Settings → **Tokens** → Create (scope: your account).

## 3. Add six GitHub secrets

GitHub → `fsdowie/oracle-generic-architecture` → Settings → Secrets and variables → **Actions** → New repository secret:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Project URL, e.g. `https://abcd1234.supabase.co` |
| `SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `VERCEL_TOKEN` | token from step 2 |
| `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |

## 4. Deploy

Push to `main`, or GitHub → Actions → **Deploy estate map** → Run workflow. The run validates the pack, uploads `map.json`, writes `config.js` and deploys. The URL is shown in the last step and in Vercel (e.g. `estate-map-xxxx.vercel.app`). You can add a custom domain in Vercel.

## Everyday use

- **Open it anywhere:** the Vercel URL → sign in with your email and password. The session is remembered on that device until you sign out.
- **Give someone access:** create their user in Supabase Authentication, then in the SQL editor:
  `insert into public.map_viewers (email, note) values ('person@example.com', 'reviewer');`
- **Remove access:** `delete from public.map_viewers where email = 'person@example.com';` (and delete the user in Authentication).
- **Change the map:** edit `site/model/map-model.json` (layout, nodes, flows, process text) or `integrations/integration-register.yaml` (integrations table), then push. The workflow rebuilds and re-uploads the data.

## Checks after the first deploy

1. Open the URL in a private window: you should see only the sign-in card.
2. Sign in: the map loads.
3. Sign in with a user that is **not** in `map_viewers`: you should see "this account can't read the map".
4. Open `https://<your-url>/map.json` and `https://<your-url>/README.md`: both should return 404.

## Local preview

```powershell
copy site\public\config.example.js site\public\config.js   # fill in URL and anon key
python tools\build_map_data.py
npx serve site\public
```
`config.js` and `build/` are git-ignored.
