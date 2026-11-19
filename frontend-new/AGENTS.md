# Fresh frontend implementation instructions

Inherit the repository root `AGENTS.md`. Read `PLAN.md` before implementation.
Read `DESIGN_PLAN.md` for the user-requested Taste Skill direction.

Do not commit or push. At completion, provide the user with manual Git commands
for reviewing, staging, committing, and pushing the intended changes on the actual
branch. Do not execute those mutation commands on the user's behalf.
Whatever action you can do yourself, please do yourself. This includes starting apps and performing verification.
## Current state

The user authorized implementation. This folder now contains the independent app,
its tests, setup instructions, and design plans. Read README.md and VERIFICATION.md
for run commands, observed checks, and configuration limits. The user explicitly
prohibits use of the Sites skill; keep this work local and do not publish it.

## Stack and structure

- Keep the ten original URLs and the compatibility redirects documented in
  ROUTE_PARITY.md. Processing, results, and reports stay separate.
- Use semantic HTML, plain CSS and browser JavaScript modules. Vite bundles the
  static app and substitutes its public environment variables. Keep the landing
  markup in `index.html`. Use the History API for private routes and deep links.
- Use native form controls and dialog. Keep keyboard navigation and focus
  restoration for the image tabs and enlargement dialog. Reuse the local Phosphor
  glyphs, existing fonts, and Taste assets.
- Use TanStack Query Core for owner-scoped service cache, native fetch and Zod for
  API contracts, and the Supabase JavaScript client for auth and persistence.
- Keep the active upload and screening in memory. Separate route rendering,
  workflow state, API calls, and database mapping.

## Integration rules

- Call `POST /api/v1/screen` with multipart `file`; use `convnext_tiny`, `page`,
  and overlays enabled. Never set the multipart Content-Type manually.
- Validate finite numeric risk values and the uncertainty object. Preserve missing
  optional fields as unavailable; never convert null or empty strings into zero.
- Render `risk_percentage` as a screening score, not diagnostic probability or
  model accuracy. Fold range is disagreement, not a clinical confidence interval.
- Use backend classification for presentation and map to database categories
  `Elevated`/`Typical` explicitly. Unexpected categories are contract errors.
- Backend screening responses have no record ID or original filename. Generate a
  UUID once for the workflow and keep the selected file's metadata separately.
- Use an explicit mutation for screening and reporting with automatic retries off.
  Rerenders, route changes, and window focus must not initiate another inference.
- `POST /api/v1/report` needs the original image and reruns inference. Tell users
  this before export; it is not an export of a stored result snapshot.
- Keep originals in memory until the workflow ends. For optional history image
  retention, obtain an explicit user choice before writing images to Supabase.
- Do not silently persist screening data in localStorage, sessionStorage, IndexedDB,
  analytics, error logs, or persisted query caches.
- Use one Supabase auth client and subscription. Let the SDK manage sessions;
  do not duplicate tokens into custom browser storage. Clear user-scoped query
  caches, upload state, and object URLs on sign-out or account changes.
- Gate private routes until session restoration completes. Email confirmation is
  not a signed-in session. Missing Supabase configuration is a setup state.
- RLS protects database operations, but FastAPI currently does not validate auth
  tokens. A route guard is not backend access control; do not claim otherwise.
- A save failure must retain the result in memory and offer a separate save retry
  with the same ID. Do not rerun inference to retry saving.
- Use metadata-only, paginated history queries. Fetch base64 image fields only
  for an individual detail view. Scope queries and keys to the authenticated user.
- Revoke preview/download object URLs. Abort requests on cancel where appropriate,
  but do not claim browser abort stops server-side inference.

## UX and accessibility

- Use the explicitly requested Taste Skill and its recorded deal as the primary
  visual system. Keep its printed color and type tokens;
  do not create a competing grid, spacing, or component style system.
- Use Instrument Sans for headings and body; reserve DM Mono for technical
  identifiers/data where useful. See DESIGN_PLAN.md for exact tokens.
- Scope Taste's full-screen marketing sections, hero entrance, and word-highlight
  moment to the public page. Application routes prioritize task flow and readable
  content. Keep necessary labels and explanations beside attribution images.
- Apply public-page checks honestly. Document app-specific exceptions rather than
  hiding elements, weakening checkers, or claiming a gate passed without a page.
- Prioritize a calm, readable screening workspace and one clear next action.
- Use plain sentence-case labels, semantic HTML, labeled fields, visible focus,
  keyboard-operable controls, meaningful error messages, and a skip link.
- Target WCAG 2.2 AA, text resizing to 200%, and narrow mobile layouts without
  horizontal overflow. Do not communicate risk by color alone.
- Offer reading preferences for text size and spacing. Persist only nonsensitive
  preferences locally. Do not claim any font treats or solves dyslexia.
- Use the cool-grey-cobalt light palette and the recorded type pairing. Keep body
  copy at least 16px by default, with reading preferences for larger text.
- Keep workflow content visible without entrance animations. Honor reduced motion;
  animation must never delay access to instructions, errors, or results.
- Provide loading, empty, unavailable, error, success, and retry states. Processing
  is indeterminate because the API exposes no progress events.
- Explain heatmaps as model attribution, not proof of a disorder or a reading test.
- No fabricated demo records in live flows, dead links, fake progress percentages,
  or claims that `/health` proves model checkpoints are available.

## Checks once scaffolded

Expose `dev`, `build`, `preview`, `lint`, `test`, and `test:e2e`
scripts. Use Vitest, MSW, and Playwright for meaningful
contract and workflow coverage. Keep mock data in tests only.

Before handing off implementation: run lint, focused tests, and a
production build; verify the main workflow in a real browser on desktop and
mobile. State clearly which checks used mocked services and whether real model
inference and Supabase persistence were verified.
