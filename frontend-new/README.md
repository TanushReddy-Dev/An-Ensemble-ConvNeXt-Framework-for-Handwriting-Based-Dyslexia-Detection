# NeuroWrite AI — fresh frontend

Independent HTML, CSS, and JavaScript frontend for the existing FastAPI screening
service and Supabase database. Vite bundles the static app and supplies public
configuration. Vite preview or a static server with the route fallback is needed
to open workspace routes. The original `../frontend/` is unchanged.

## Run locally

Use Node 22.12+ or a compatible newer Node release. From the repository root:

```powershell
cd frontend-new
npm ci
Copy-Item .env.example .env
```

Set your project values in `frontend-new/.env`:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

These values are browser-visible. Never use a Supabase service-role key. No live
credentials are included. Without Supabase configuration the public page works,
and account/workspace pages explain that setup is required.

```powershell
npm run dev
```

Open [the frontend](http://127.0.0.1:5173). In a second terminal at the repository
root, run the existing backend:

```powershell
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000
```

The API requires its existing Python dependencies and compatible model checkpoints.
The frontend development port is strict to match existing CORS configuration.
If another frontend is using 5173, stop it or deliberately configure a different
frontend port and its exact backend allowed origin.

## Supabase setup

Use `../supabase/schema.sql` for a fresh project; for an existing project, review
the included migration instead of blindly recreating policies. Configure the Auth
Site URL and allowed redirects for your actual origin and these paths:

- `/auth/callback` for signup confirmation.
- `/reset-password` for email recovery.

Accounts use Supabase email/password authentication. Email confirmation must finish
before protected pages open. Profiles/history are scoped by user ID and RLS.
FastAPI currently does not validate Supabase JWTs: frontend guards do not secure
the inference service. Restricted external deployments need backend enforcement.

## Included workflows

- Public overview with a handwriting specimen, a preview linked to the upload
  page, and a diagram of the screening workflow. The specimen is generated
  artwork. The Taste Skill hero entrance and word-highlight moment remain.
- Sign in, signup/email confirmation, password recovery, and sign out.
- Image selection/drop, file and decoding validation, preview, and explicit submit.
- Cancel/retry, honest refresh recovery, classification, fold disagreement, image
  attribution tabs, missing-image states, and an enlarged viewer.
- Fresh Grad-CAM overlays use lighter cobalt shading. The viewer labels the
  contribution as relative to the image and from the first model fold. It calls
  out fold scores on both sides of the screening threshold. Saved overlays keep
  the image stored at screening time.
- Current and saved results show **Potential dyslexia** for an elevated model
  signal or **Normal** when the model found no elevated signal. Both labels
  describe experimental screening of the handwriting sample. History and the
  report reference use the same labels.
- Explicit save with optional original/overlay retention, idempotent save retry,
  owner-scoped paginated history/search/filter, and saved detail.
- Profile editing, device-local text size/spacing, and PDF report download.

Handwriting, unsaved results, and overlays remain in memory unless the user chooses
to save them. Original/overlay retention defaults off. Unsaved data is lost on
reload or sign-out. Supabase manages its own auth session storage; no duplicate
custom token store or screening-history browser store is used.

The report API reruns inference using an original image; it does not export a
saved result snapshot. The PDF uses the screening service's own classification
wording. Saved records without retained originals require re-upload and clearly
describe the report as a new analysis.

## Checks

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:production
```

Browser tests use installed Microsoft Edge, a separate Vite server on 5174, and
test-only Supabase/API network fixtures. They do not need or modify real accounts.
Update `playwright.config.js` to use an installed browser if Edge is unavailable.
Fixtures stay inside `src/test/` and `e2e/`; production has no mock login or results.
The route reflow test checks the main screens from 320px to 1440px and writes review
screenshots to the ignored `shots/responsive/` directory.

Read `VERIFICATION.md` for observed results and limitations. Skill assets copied
to `public/assets/` remain unchanged; `public/taste-init.js` adapts their lifecycle
to the public route. No Sites integration or hosting tooling is used.
The public overview is authored in `index.html` and is readable without JavaScript.
Browser modules handle menus, navigation, and the signed-in workspace.
`VITE_REQUEST_TIMEOUT_MS` optionally changes the inference/report timeout from its
default of 600000 milliseconds.

## Production build

```powershell
npm run build
npm run preview
```

Deploy `dist/` to a static host with an SPA fallback to `index.html`. Set public
environment variables before building, the Supabase allowed redirects, and the
backend `FRONTEND_URL`. The existing FastAPI `/ui` mount still serves the legacy
frontend. This work does not change it or deploy either frontend.

The prototype is intentionally `noindex`. No approved legal text or canonical
domain was supplied, so no fabricated policy pages/domain are published.

## Manual Git handoff

The assistant does not commit or push. Review the intended files and use a branch
such as `codex/fresh-frontend`; exact commands are supplied at handoff. Keep local
`.env`, dependencies, build output, browser profiles, and generated reports out of Git.
The full copyable command sequence is in `GIT_COMMANDS.md`.

## Original page structure

The [design studio](http://127.0.0.1:5173/design-studio/index.html) compares
Folio, Signal, and Field Notes across all ten pages. It uses local sample
content and stores only the selected design names in the browser. Use
**Copy picks** to share a set of selections.

See ROUTE_PARITY.md for all ten redesigned pages and their original URLs. Start at
`/login` or `/signup` for the account screens. Authenticated navigation uses
`/dashboard`, `/upload`, `/processing`, `/result`, `/history`, `/report`, and
`/settings`. Processing, results, and reporting are separate pages.
