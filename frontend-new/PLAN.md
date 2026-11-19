Kind: software; page type: software; site-kind: software.
Taste deal: cool-grey-cobalt, Instrument Sans + DM Mono, split hero, word-highlight; see DESIGN_PLAN.md for the complete selection and rationale.

# NeuroWrite AI fresh frontend plan

Planning baseline: 19 November 2026. Status: implemented; see VERIFICATION.md for checks and limits.

## Page structure correction

The user requires the same ten separate pages as `frontend/`. See ROUTE_PARITY.md
for the authoritative mapping. Login and signup have distinct designs; processing,
result, and report are separate pages. This supersedes the earlier combined current
screening screen and report-dialog decisions.

## 1. Objective and scope

Build an independent frontend in `frontend-new/` for the existing handwriting
screening system. Preserve `frontend/` as a reference. The primary journey is:

Sign in -> select a handwriting image -> review and run screening -> understand
the screening signal and explanations -> optionally save -> generate a PDF.

Assumed audience: educators, examiners, and researchers operating the project.
Audience, final visual identity, and deployment provider remain editable choices,
not blockers for planning. No new clinical claims or model changes are in scope.

The user subsequently authorized implementation with Taste Skill, without Sites.
The independent app, tests, and Vercel routing configuration are in this folder.

## 2. Repository findings

| Area | Evidence and consequence |
| --- | --- |
| Inference | `src/api.py` serves FastAPI; keep Python responsible for inference and PDFs. |
| Models | `src/screening_engine.py` uses an ensemble, a 0.50 screening threshold, and image attribution. Keep the UI tied to returned results. |
| Existing UI | `frontend/` already uses React, Vite, Tailwind, React Router, and Supabase; the replacement runs independently in browser JavaScript. |
| Authentication | Supabase Auth owns accounts; there are no application login/register API endpoints. |
| Persistence | `profiles` and `screenings` exist with user-scoped RLS. FastAPI has no screening history endpoints. |
| Legacy contract | `/predict` still exposes legacy classes and synthetic per-class fields. Use `/api/v1/screen`. |
| Reports | `/api/v1/report` requires the image and performs inference again. It does not accept a saved result ID. |
| Hosting | FastAPI currently mounts only `frontend/dist` at `/ui`. The new build will not automatically appear there. |
| Health | `/health` reports device and supported backbones, not loaded checkpoint count or inference readiness. |
| Security | FastAPI validates bearer tokens with Supabase Auth on upload routes. Owner-scoped database policies protect saved records. |

## 3. Frontend stack

The user requested a conversion to HTML, CSS, and JavaScript while preserving
the design and behavior. The public overview is static HTML. The account and
workspace screens use browser JavaScript modules and shared CSS. History API
navigation keeps the existing URLs and supports back/forward and direct visits
via the existing static-host fallback.

| Layer | Choice |
| --- | --- |
| Rendering and styling | Static HTML, native DOM and CSS, existing Taste assets |
| Controls | Native forms and dialog, keyboard-operable image tabs |
| Routing and state | History API, route-scoped UI state, in-memory screening workflow |
| Service integration | Supabase Auth/PostgREST client, TanStack Query Core, native fetch, Zod contracts |
| Build and checks | Vite, ESLint, Vitest with MSW, Playwright |

## 4. Screens and routes

| Route | Purpose and required states |
| --- | --- |
| `/` | Explain the experimental tool, supported input, limitations, and one primary action: Start a screening. |
| `/login`, `/signup` | Labeled validated forms; session restoration, email confirmation, credential errors, and setup unavailable state. |
| `/auth/callback` | Complete configured confirmation/recovery flows and handle expired links. |
| `/forgot-password`, `/reset-password` | Supabase recovery flow with configured redirect URLs. |
| `/dashboard` | Dashboard with real saved counts and recent metadata; useful empty state linking to upload. |
| `/upload` | Image selection, preview, file validation, optional subject identifier, and screening notice. |
| `/processing` | Active request status, cancellation/retry, and handoff to `/result`. |
| `/result` | Completed screening result backed by memory, with honest refresh recovery. |
| `/report` | Dedicated report page, reference preview, details, and PDF generation. |
| `/history` | Paginated metadata list with search/filter, empty/error/retry states, and links to saved records. |
| `/result/:id` | Owner-scoped saved detail, explanation views, unavailable images, and report entry point. |
| `/settings` | Actual profile fields and reading preferences; do not invent institution roles or cohort settings. |
| `*` | Useful 404 with a working path back. |

Report generation has its own `/report` page, preserving the original frontend structure. Sign-out is an action. Publish legal/privacy pages only with
accurate project-specific content; unresolved policy text is a release dependency.

## 5. Workflow and state ownership

1. Restore Supabase session before resolving private routes. If configuration is
   missing, explain setup; do not fake a signed-in user.
2. Select one PNG/JPEG/WebP/BMP image. Check nonempty file, supported type,
   successful browser decoding, and a configurable 25 MiB frontend limit. This is
   a UI limit, not an existing server guarantee. Show filename, size, and preview.
3. Let the user review the sample and understand screening limitations before
   submission. Do not automatically upload on selection.
4. Submit once. Keep file, workflow UUID, subject metadata, and response in
   memory/context. Represent idle/ready/running/succeeded/failed/canceled states.
5. During inference show indeterminate progress and elapsed time if useful, with
   cancellation and retry behavior. There is no API progress stream or job ID.
6. Display the screening outcome as “Potential dyslexia” for Elevated or “Normal”
   for Typical. Lead with the outcome and what it means, then show the model
   score, fold disagreement, returned disclaimer, and available attribution images.
   Explain missing overlays independently. Grad-CAM for new screenings shows
   relative positive contributions to the average screening score across
   folds. Show disagreement beside its legend when fold scores fall on both
   sides of the 50% screening threshold.
7. Offer an explicit Save result action. Saving metadata and retaining the original
   image are distinct choices; image retention defaults off. Preserve the completed
   result if persistence fails. Retry the same record ID without duplicate rows.
8. For a report, collect student identifier and examiner name and explain that
   export runs screening again. Use the in-memory original or an explicitly retained
   original reconstructed as a File. Otherwise request re-upload with a clear notice
   that the resulting report is a new analysis, not the historical result.
9. Clear sensitive state and user-scoped caches on sign-out/account changes. Unsaved
   work does not survive reload; warn only when active work would be lost.

TanStack Query Core caches remote metadata. The workflow module owns
the transient workflow; route state must not be the only owner of the File.
Only nonsensitive reading preferences may use custom local browser persistence.

## 6. API and database contracts

| Operation | Contract |
| --- | --- |
| Service status | `GET /health`; show connection/device information, not model-ready claims. |
| Screen | `POST /api/v1/screen?backbone=convnext_tiny&input_mode=page&include_overlay_base64=true`, multipart `file`. |
| Screen response | `risk_score` 0..1, `risk_percentage` 0..100, `risk_category`, `screening_classification`, `uncertainty_band`, `per_fold_predictions`, `models_in_ensemble`, `backbone`, `input_type`, `disclaimer`; nullable ink mass and optional overlays. |
| Uncertainty | Object containing `std`, `low`, `high`, `spread`, expressed in score units. Format as percentages only at presentation. |
| Explanation images | Optional `attention_overlay_base64`, `gradcam_overlay_base64`, `ig_overlay_base64`; data URLs, not storage object paths. `gradcam_target: "ensemble_mean"` identifies new ensemble overlays. |
| PDF | `POST /api/v1/report`, multipart `file`, `student_id`, `examiner_name`, `backbone`, `input_mode`; returns PDF bytes. |
| History/detail | Supabase `screenings`, owner-scoped queries; generate record ID on the client. |
| Profile | Supabase `profiles`: actual name/institution fields; email changes, if later added, use Auth APIs. |

Create separate schemas for API response, domain result, and database row. Map
API `Elevated Risk` to database `Elevated`, and `Typical` to `Typical`. Store
`Flagged`/`Completed` consistently. Preserve actual classification text and fold
metadata. Apply the new labels only in the browser, including history and the
report reference. The generated PDF uses the backend’s wording. Do not use the
old compatibility confidence/probabilities fields.

Fetch history metadata with range pagination and a deterministic created_at/ID
order. Search/filter server-side so filters cover the full history, not just the
current page. Select large image columns only on detail demand. If retaining
originals/overlays in current base64 columns proves too large, propose a separate
private Supabase Storage migration; do not silently change the database model.

Parse FastAPI string or validation-array errors into useful messages. Handle
offline, non-JSON errors, malformed results, aborted requests, and slow responses.
Use configurable long request timeouts for inference and reports, with no automatic
retry. Sanitize report download filenames and revoke download URLs after use.

## 7. Visual and content direction

Follow [DESIGN_PLAN.md](DESIGN_PLAN.md), created using the explicitly requested
Taste Skill. It specifies the palette, typography, public-page screen sequence,
workspace layouts, copy, responsive behavior, motion, asset policy, and visual QA.
The recorded Taste deal replaces the earlier undecided visual direction.

Design the product shell and the upload/result journey before polishing the public
page. Desktop uses persistent navigation; mobile uses an accessible compact menu.
Results favor clear labels and an accessible fold-value table over decorative charts.
Tabs switch between the original and available explanations, with zoom if needed.

The public page uses a short explanatory layout:

1. Hero: “Handwriting screening for educators.”
   Supporting copy explains image input, model signals, and visual explanations.
   CTA: “Start a screening.” Evidence line: “View the score, fold disagreement,
   and available model explanations.” This is a feature statement, not validation.
2. Benefits: review a clear screening summary; inspect returned attribution images;
   revisit intentionally saved records; generate a report for follow-up review.
3. How it works: upload an image; review the returned signal; decide whether to save
   or generate a report. No promised accuracy or turnaround time.
4. Limitations and concise FAQs: Is this a diagnosis? Which images are supported?
   What does the score mean? What do heatmaps show? Are images saved? Why does
   report generation take time? Answers must reflect implemented behavior.
5. Closing CTA and links to approved policy information.

Default public-page indexing is off for the experimental prototype. If public
release is approved later, review indexing and metadata. Suggested title:
“NeuroWrite AI | Experimental handwriting screening”. Suggested description:
“Review handwriting screening signals and model explanations. Experimental
decision support that does not replace a qualified professional assessment.”

Accessibility takes precedence over decorative motion: keyboard access, visible
focus, labeled errors, status announcements, text zoom, reduced motion, sufficient
contrast, and no color-only risk indicators. Evaluate reading preferences through
usability checks; no font is presented as a treatment.

## 8. Proposed source structure

```text
frontend-new/
  AGENTS.md
  PLAN.md
  DESIGN_PLAN.md             # Taste Skill design specification
  README.md                  # written during scaffolding
  .env.example               # variable names and placeholders only
  package.json
  package-lock.json
  vite.config.ts
  src/
    app/                     # providers, router, route boundaries
    components/ui/           # reusable accessible controls
    components/layout/       # public and authenticated shells
    features/auth/
    features/screening/       # upload, workflow, results, explanation, report
    features/history/
    features/profile/
    lib/                     # env, fetch, Supabase, schemas, mappings
    styles/                  # tokens, global styles, reading preferences
    test/                    # service mocks and shared fixtures
  e2e/
```

Keep forms, service calls, and mapping logic feature-local unless actually shared.

## 9. Implementation sequence and acceptance gates

| Phase | Work | Complete when |
| --- | --- | --- |
| 0: Planning | Repository audit, stack, instructions, routes, contracts, risks. | This document and both AGENTS files exist; legacy source is unchanged. |
| 1: Foundation | Set up HTML/CSS/JS, env validation, tokens, shell, routing, and 404. | Lint and build pass; missing config is explained; desktop/mobile shell works. |
| 2: Identity | Supabase session lifecycle, signup/confirmation, login/logout, password recovery, route guards. | Restoring/expired sessions and email confirmation behave correctly; caches clear on account change. |
| 3: Screening | Upload validation/preview, transient workflow, screen mutation, contract parsing, results and overlays. | One submit causes one inference; failures recover; refresh/cancel behavior is explicit. |
| 4: Persistence | Explicit save, optional image retention, paginated history, detail, profile/preferences. | Save retry is idempotent; failed saves retain results; two accounts cannot see each other's rows. |
| 5: Reports | Report form, original-file availability, rerun notice, blob download. | Real PDF flow works; unavailable originals and download failures have useful recovery. |
| 6: Finish | Public page, responsive polish, accessibility, deployment setup, user documentation. | Main browser journey, focused tests, lint and build pass; service verification limits are stated. |

Do not spend time building speculative dashboards, batch uploads, OCR, billing,
organization roles, live job tracking, letter-level analysis, or longitudinal
clinical trends. The letter-level IG endpoint exists but is deferred from this MVP.

## 10. Verification plan

- Contract/mapping tests: valid risk boundaries, unexpected categories, malformed
  uncertainty, optional images, null values, and FastAPI validation errors.
- Workflow tests: duplicate submit prevention, cancellation, result retention after
  save failure, retry with the same ID, and expired-session recovery.
- Form/component tests: image decoding rejection, file limits, keyboard upload,
  inline errors, and absent explanation images.
- Browser tests with MSW fixtures: sign-in state, upload -> screen -> save -> history
  detail -> report, failed service calls, mobile navigation, and direct links.
- Browser accessibility checks: keyboard/focus order, dialogs, status announcements,
  contrast, 200% text, reduced motion, and narrow viewport overflow.
- Real-service smoke test when configured: genuine inference, actual PDF bytes,
  Supabase persistence, and RLS isolation with two authorized test accounts. Report
  mock-based checks separately from these real-service checks.

## 11. Configuration, hosting, and release dependencies

Public environment variables include `VITE_API_URL`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, and the optional `VITE_SITE_URL` for canonical and
social preview URLs. All VITE variables are browser-visible; never include
service-role keys or private credentials. Use names compatible with the backend
and document publishable-key migration separately if needed.

During development, use Vite port 5173 with strictPort so the existing CORS list
matches. If the legacy app also runs, select another port deliberately and add its
exact origin through backend configuration. Run FastAPI separately on port 8000.

Deploy `frontend-new/dist` to a static host with an SPA fallback to index.html.
Configure Supabase Site URL/allowed redirects and FastAPI `FRONTEND_URL` to the
actual deployed origin. Use HTTPS in deployment. Do not change the old `/ui`
mount until a deliberate frontend cutover is requested.

Before an external release, configure API authentication, enforce ingress limits,
verify the inference deployment and timeout budget with the approved checkpoints,
and confirm retention and privacy policy. A future immutable report endpoint
could export a saved result without rerunning the model.

The independent frontend uses the authenticated screening API and branded PDF.
The public overview is
authored as static HTML; deployment still needs only static hosting. The static
bundle includes browser and touch icons, web app metadata, and recovery pages.
Pointer navigation animates between destinations and scrolls to landing
sections. Keyboard navigation and reduced motion remain immediate.
