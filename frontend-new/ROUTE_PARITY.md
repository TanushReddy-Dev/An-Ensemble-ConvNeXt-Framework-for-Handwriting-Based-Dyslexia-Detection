# Original page structure, fresh design

The original frontend's ten pages are preserved as separate routes.
Shared feature logic stays under `src/features/`; no legacy runtime code is imported.

| Original page | Canonical URL | Page source | Design and behavior |
| --- | --- | --- | --- |
| Landing | `/` | `index.html` | Handwriting specimen hero, upload preview, explanation diagram, limitations, FAQ, and account entry points. |
| Login | `/login` | `src/features/auth/AuthPage.js` | Navy photo panel, sign-in form, recovery, and create-account navigation. |
| Signup | `/signup` | `src/features/auth/AuthPage.js` | Form-first cobalt layout with name, optional institution, email, password, and email confirmation. |
| Dashboard | `/dashboard` | `src/features/history/History.js` | Workspace overview, recent records, and a real empty state. |
| Upload | `/upload` | `src/features/screening/Upload.js` | Image validation, preview, optional identifier, explicit submit. |
| Processing | `/processing` | `src/features/screening/Processing.js` | Dedicated request status, actual image, cancellation, error/retry, automatic handoff when complete. |
| Result | `/result` | `src/features/screening/Results.js` | Screening score, fold table, image explanations, optional save, link to report page. |
| History | `/history` | `src/features/history/History.js` | Paginated owner-scoped records, search/filter, links to saved results. |
| Report | `/report` | `src/features/screening/Report.js` | Full report page, reference preview, student/examiner fields, original-image recovery, PDF generation. |
| Settings | `/settings` | `src/features/profile/Settings.js` | Profile and device-local reading preferences. |

The workflow is `/upload` → `/processing` → `/result` → `/report`. The processing
page observes the request started by the upload action; visiting a page never
starts duplicate inference. Report generation explicitly runs inference again.

Saved details use `/result/:id`; their report link uses `/report?record=:id`.
Account recovery routes remain as additional pages. The first iteration's `/app`
paths redirect to their corresponding original paths for bookmark compatibility.

As in the existing application, workspace pages require a real Supabase session.
Unauthenticated visits go to `/login` and preserve the intended destination.
Without configured account services, the complete login/signup designs remain
visible with an honest setup notice. No fake account or production demo mode is added.

Unknown routes show the branded 404 page. A render failure shows a recovery
page with reload and overview actions. The production bundle also contains
standalone `404.html` and `500.html` documents for the static host.
