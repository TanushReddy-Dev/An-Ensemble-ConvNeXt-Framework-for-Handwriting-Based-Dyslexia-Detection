GATE: PASS — three documented checker exceptions; no open gate failures.

# Verification record

Verified locally on 19 November 2026. Built with Taste Skill in `frontend-new/`.
No Sites tooling, deployment, commit, push, or Git branch change was performed.
The existing frontend, Python backend source, and database schema are unchanged.

## Brand assets

The Taste finish gate passed with the three documented exceptions. The layout
checker reported no findings at 1440, 1024, 768, and 390 pixels. Lint, build, and
both production browser tests passed, including resolution of the SVG favicon,
PNG fallback, Apple touch icon, and 1200 × 750 share image. Share previews on
external platforms still need verification against the deployed URL.

## HTML, CSS, and JavaScript conversion

A clean install, lint, build, 16 unit tests, and 18 browser tests passed. The
browser suite uses service fixtures. It covers all ten page URLs, navigation
with browser Back and Forward, one request per screening, modal focus
restoration, keyboard tabs, save retry, retained images, and PDF downloads.
The built landing page is readable with JavaScript disabled. Desktop and
phone screenshots of login, signup, and dashboard match the prior layout and
artwork. The Taste finish gate passed with the three documented exceptions.
Auth and inference were not reverified against live services for this conversion.

The remaining sections document earlier implementation and design checks.

## Distinct artwork verification

Landing, login, signup, and dashboard each load a separate WebP composition from
`/assets/images/`. Production browser checks confirmed that the landing art
loads with JavaScript disabled. Six desktop and phone workflow checks verified
the image paths, original page URLs, and form-only recovery page. Login, signup,
and dashboard screenshots were reviewed at both sizes.

The Taste gate passed with the three documented exceptions. The landing
performance check recorded zero broken requests and zero layout shift at 1440px
and 390px. It flagged 672.4 KiB of parsed JavaScript at both widths as a
nonblocking budget warning. The largest image loaded in the check was 48.3 KiB.

## Visual refinement verification

The redesign passed the Taste finish gate on its second round. It retained the
three documented exceptions and reported 12 nonblocking warnings. The layout
checker reported no findings at 1440, 1024, 820, 768, and 390 pixels in the first
pass. The second gate checked the revised hero alignment, footer focus, and
mobile diagram. The mobile account header spacing was then verified in the
focused route checks and screenshot.

The production build and lint passed. The 16 unit tests, 16 workflow browser
tests, and two production browser tests passed. The focused public navigation
and ten-page route checks were rerun on desktop and phone after the final CSS
edits, with four passes. Account and dashboard visuals were inspected using
fixture-based screenshots.

A three-load performance run on the final landing page reported zero failures,
no broken requests, and zero measured layout shift on desktop and phone. Parsed
JavaScript was 459.4 KiB, above the skill's preferred 450 KiB budget at both widths.
Compressed transfer was 311.8 KiB at 1440px and 359.3 KiB at 390px.

## Page-structure correction

The new frontend now preserves all ten original pages at their original URLs.
`ROUTE_PARITY.md` maps each URL to its own `src/pages/` module. Login and signup
have distinct redesigned layouts; processing, results, and reports are standalone
pages. The report is no longer a dialog. The earlier `/app/...` paths are redirects.
The original frontend remains untouched.

The final Taste gate was rerun against the rebuilt public page: PASS, with the
three documented exceptions and no open failures.

Current route verification passed all 16 workflow browser cases, 16 unit tests,
typecheck, lint, production build, and 2 production browser cases. Desktop and
phone route checks assert no horizontal overflow. Final screenshots include all
workspace pages and both account pages. Account/backend services are fixtures in
these browser tests. The real backend smoke below was performed during the first
implementation pass, before this route-only correction.

## Automated and real-service checks

| Check | Observed result |
| --- | --- |
| TypeScript | Strict typecheck passed. |
| ESLint | Passed. |
| Vitest | 16 tests passed across contract validation, multipart/error handling, file rejection, cancellation, duplicate-submit prevention, and rerun/save identity. |
| Playwright workflow | 16 tests passed across desktop and phone layouts. Includes all ten original page URLs, separate login/signup navigation and institution field, and upload → processing → result → report navigation without duplicate inference. Includes save failure/retry with the same ID, optional image retention, owner-scoped saved detail after reload, missing overlays, PDF download, auth failure/confirmation/recovery, reading preferences, and sign-out. Services in these tests use fixtures. |
| Production browser checks | 2 tests passed against the built app: clean hydration at `/` with working navigation, and readable public content with JavaScript disabled. |
| Final public-route regression | Desktop and mobile public navigation/overflow checks passed after the final navigation fixes. |
| Production build | Passed, including build-time rendering of the public overview. |
| Final layout checker | No findings at 1440×900, 1024×768, 820×1180, 768×1024, and 390×844. |
| Real FastAPI health | Responded healthy; CPU host. Health is not treated as proof of loaded checkpoints. |
| Real model inference | An in-memory synthetic image returned a valid score, five model predictions, Grad-CAM, and Integrated Gradients output. No patient/student image was used. |
| Real PDF generation | The existing report endpoint returned an actual `application/pdf` response beginning with `%PDF`, 48,130 bytes, from the synthetic image. |

The inference/report check exercised the existing running backend independently
of the fixture-based UI tests. It checks integration, not clinical accuracy.

## Taste design and visual checks

The design refinement uses a generated still life of fictional handwriting in
the hero, login, signup, and dashboard. The public hero labels it as a sample.
It has no associated screening data. Navy frames tie the public walkthrough to
the workspace navigation. Instrument Sans and DM Mono, the centered navigation,
and the word-highlight moment carry forward.

Voice: technical-dry, translated for educators, with consistent handwriting,
screening, score, explanation, record, and report terminology. The existing
NeuroWrite AI name came from the repository; no coined-name search was needed.

The skill's full consistency check, layout checker, viewport screenshot script,
performance script, copy lint, and finish gate were run. Screenshots were captured
at 1440, 1024, 820, 768, and 390px widths. Real application screenshots were also
inspected at desktop and phone sizes; application screenshots use test fixtures.
Generated QA screenshots and reports are stored under the ignored `shots/` and
`.taste-skill/` directories. The public sharing image shows the new landing hero.

The final gate reports no open failures, with these explicit exceptions in
`.taste-skill/waivers.json`:

1. **FAQ text-only check:** the FAQ is an open-answer text section, followed by a
   separate closing footer. It is not the closing call to action. FAQs are allowed
   to be text-only in the skill.
2. **Domain headings:** Attention, Grad-CAM, and stroke attribution name actual
   backend methods; the FAQ uses concrete questions. The generic heading
   vocabulary does not recognize these terms.
3. **React wrapper:** `div#root` is the required transparent mount containing the
   header, main sections, and footer. It is not an additional visual content block.

No checker or loaded kit file was modified to obtain the result. The public
adapter mounts the unchanged motion/moment modules after React hydration. The
Tailwind `start-7` inset utility is excluded because Taste uses that name for its
grid position; this fixes a genuine positional collision.

Nonblocking warnings are retained for these reasons:

- The word-highlight color change occurs inside the deliberately dealt moment.
- Physical `/login` and other client-route HTML files do not exist in the checker's file
  server. These are real React routes; browser tests verify them. Static hosting
  needs the SPA fallback documented in README.md.
- Workspace and Explanations navigation labels describe their destination sections
  without repeating their exact heading wording.
- The public anchor navigation remains static rather than tracking scroll position.
- The main action appears in both the desktop navigation and hero, as permitted.
- The statement moment uses display text; the FAQ keeps its full answers despite
  exceeding the preferred marketing word budget. Screening limitations and
  retention/report behavior are useful information.
- Copy lint reports one rhythm warning for mostly short sentences. Direct language
  is retained for this screening workflow. It reports zero failures.

## Performance (initial implementation measurement)

The skill's three-load CPU Chrome check returned **0 failures and 2 warnings**
(the same JavaScript warning at desktop and phone widths):

- Parsed JavaScript: 454.3 KiB, slightly above the preferred 450 KiB warning budget.
- Total compressed transfer: approximately 260 KiB.
- Two self-hosted font files, approximately 44 KiB.
- No broken requests, unused visual modules, or live WebGL contexts.
- Measured layout shift: 0.000 in those local runs.

These are local test measurements, not production performance promises.

## Remaining external verification limits

No live Supabase project credentials were supplied or read. Real email delivery,
account creation/recovery, database persistence, and two-account cloud RLS isolation
were not exercised against a live project. The frontend exposes a setup state
until configured; it does not substitute a mock account or local history store.

Configure the existing project and allowed redirects using README.md. The
existing FastAPI routes do not enforce Supabase JWT authentication; browser route
guards do not add server access control. No approved canonical domain or legal
policy text was supplied, so the prototype remains noindex without invented
legal pages. No public handwriting showcase asset was supplied or required.

See GIT_COMMANDS.md for the manual review, branch, commit, and push commands.
