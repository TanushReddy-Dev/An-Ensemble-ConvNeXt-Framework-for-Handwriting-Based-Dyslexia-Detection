Kind: software; page type: software; site-kind: software.
Deal: palette cool-grey-cobalt; type instrument; hero split; nav-centre; footer-dark; close-word; rhythm space; buttons tonal; mark ring; ground sage; moment word-highlight. The neutral grey keeps the document central; cobalt distinguishes actions and focus from handwriting attribution colors.

# NeuroWrite AI frontend design plan

Status: implemented, 19 November 2026. No commit, push, or deployment. See VERIFICATION.md.
Companion: PLAN.md owns backend contracts, routes, state, and implementation phases.
This document makes the visual and interaction decisions for those requirements.

## Visual refinement

NeuroWrite AI uses the supplied teal and orange brain-and-pen mark on the landing,
account, workspace, and recovery screens and the PDF. It has a 32px PNG fallback
and a 180px Apple touch icon. Page titles identify the active screen.

The workspace preview marks the image-selection step in the screening workflow.

Pointer interactions use short press feedback and hover cues. Menus and the
image dialog fade in from a pointer action. A newly selected image, processing
status, or saved confirmation gets a brief opacity change. From the landing
page, the account layout fades and rises 6px over 220ms once the destination
is ready, including after the sign-in redirect. Other page changes use a 180ms
content fade, with the desktop sidebar highlight following the active section.
The sidebar uses a darker blue highlight with light labels that stay readable
as the highlight crosses the menu.
Result tabs fade the selected panel, including when an overlay is unavailable.
Navigation and focus stay immediate. Keyboard actions and reduced-motion
settings skip these effects.

The user asked for a more distinctive design. The split hero now pairs a large
headline with a cobalt-framed handwriting specimen. The specimen is generated
artwork with fictional text, and is labeled as a sample. The workspace section
keeps the linked upload preview. A compact diagram in the explanations section
shows how the input, screening, and review fit together.

Login uses an open notebook with a pen across the binding. Signup uses a blank
notebook with loose ruled sheets and puts the form first on desktop. On phones both
forms come first. The dashboard pairs a wide review desk still life with the three
screening steps. Recovery and confirmation use a centered form without a photo.
The authenticated pages share a navy navigation rail and a light working surface.

The landing, login, signup, and dashboard images each have their own composition.
Responsive WebP variants and the landing share image live in
`public/assets/images/` and are served from `/assets/images/`. The landing and
social preview share the same hero artwork by design.

This refinement supersedes the initial plan for an empty upload hero, grey account
art, and no photographic assets. The generated specimen is never uploaded to the
service or associated with a screening score. The existing type pairing, motion
moment, and section rhythm carry forward.

## Design brief

NeuroWrite AI is an experimental handwriting screening tool. Its central task is
reviewing a handwriting image and the model's returned screening signal. Build for
educators, examiners, and researchers; that audience is inferred from the repository
and can be refined later. The primary public action is **Start a screening**.

The interface should look like a document review application: a large specimen,
clear review tools, and concise explanations. The product itself supplies the
visuals. Avoid stock clinicians, brain graphics, a generic analytics dashboard,
fictional student records, and invented performance statistics.

The existing NeuroWrite AI name comes from the repository. No new name, fabricated
customer proof, pricing, or clinical validation is introduced.

## Source and precedence

The user explicitly requested [Taste Skill](plugin://taste-skill@taste-skill).
The installed source used is
`C:/Users/Tanus/.codex/plugins/cache/taste-skill/taste-skill/2.5.1/skills/taste-skill/SKILL.md`.
Its software plan, actual-product visuals, equal edges, printed tokens, and limited
motion form the design baseline.

The user-requested Taste system takes precedence over conflicting defaults in the
previous landing-page skill: use the dealt Instrument Sans pairing, flat heading
color, opaque centered navigation, Taste spacing/radii, and the specified motion.
Do not combine these with a floating glass nav, gradient headline, or repeated
scroll reveals from a different system.

Application adaptations are explicit: full-screen marketing sections and a dealt
moment on every page would obstruct forms and screening review. Use those on `/`
only. Auth and workspace routes use natural document height and task-focused
feedback. Explanations and labels stay beside result images even though Taste's
marketing rules prohibit visual captions. Functional application routing and real
Supabase forms also supersede one-page anchor/mailto recipes. These are planned
departures from the marketing recipe, not claims of literal kit compliance.

## Fact sheet and voice

| Fact | Source/use |
| --- | --- |
| One handwriting image per request | FastAPI multipart `file`; upload UI and instructions. |
| ConvNeXt-Tiny ensemble | Backend implementation; mechanism text, without an accuracy claim. |
| Actual available fold count | `models_in_ensemble`; show the returned count only after screening. |
| Attention, Grad-CAM, Integrated Gradients | Response image fields; explanation tabs when available. |
| Binary screening signal | Backend category/classification; result summary. |
| Fold disagreement | Returned low/high/std/spread; explain model variation. |
| Experimental screening limitation | Repository disclaimer; public page and results. |
| Report repeats inference | Report endpoint implementation; export notice. |
| Saved history uses Supabase | Schema and planned integration; save and history UI. |

Voice: technical-dry, translated for educators. Use the product name or “you”; short
direct sentences, usually 8–16 words. Use consistent nouns: image, screening,
result, score, explanation, record, report. No humor in errors or results. Explain
technical terms at first use. No slogans, sales superlatives, or diagnostic labels.

Keep the example handwriting separate from analysis data. The public upload
preview shows the genuine empty state. Screening scores appear after processing a
user-selected image.

## Visual system

Keep the generated root tokens unchanged; The plain CSS uses these tokens throughout. The skill's `start.mjs css` command
produced this baseline:

```css
:root {
  --p-bg: #eef0f3; --p-surface: #e2e5ea;
  --p-ink: #0b0c0e; --p-muted: #5d6470;
  --p-accent: #1f2de6; --p-accent-ink: #ffffff;
  --p-action: #1f2de6; --p-action-ink: #ffffff;
  --p-inv-bg: #0b0c0e; --p-inv-surface: #17181a;
  --p-inv-ink: #eef0f3; --p-inv-muted: #8e8f92;
  --p-inv-accent: #eef0f3; --p-inv-accent-ink: #0b0c0e;
  --p-inv-action: #eef0f3; --p-inv-action-ink: #0b0c0e;
  --font-display: "Instrument Sans", system-ui, sans-serif;
  --font-text: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.028em;
  --display-tracking-xl: -0.036em;
  --display-stretch: 96%; --ly-scale: 1.04;
}
```

- Use a single coordinated sans family for prose; DM Mono is limited to IDs or
  model metadata. It is not the default for long text or entire result tables.
- Marketing type uses the Taste scale. Split hero starts from 72px desktop and
  40px phone; resolve actual wrapping in browser without shrinking text to fit.
- Workspace body is 16px minimum, comfortable line height, and a reading measure
  near 62 characters. Task headings are quieter than the public hero.
- Use Taste spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. Public gutters are
  80px desktop, 48px tablet, and 24px mobile; equal edges across sections.
- Soft radius family: 8px controls, 12px panels, 20px outer frames. At most two
  layers of containing boxes; the workspace should not become a stack of cards.
- Use one tonal primary/secondary button family, at least 44px targets, 48px
  fields, and clear immediate focus rings. One filled primary action per view.
- Use neutral borders, restrained shadows, no violet, and no decorative gradients.
  A dark footer is the one high-contrast public closing region.
- Semantic warning/success treatments are restricted to actual states and paired
  with text/icons. They do not become extra decorative brand colors. Verify contrast.
- Use the supplied mark beside the product name and as the favicon.

The dealt sage ground is recorded for provenance; this plan does not activate a
second sage palette. The public page keeps flat printed palette surfaces. Likewise
no shader, canvas, 3D object, or extra effect is planned: the product needs no
abstract visual to explain image review. This intentionally omits Taste's software
effect recipe and should be documented if its checker flags the omission.

## Public page: planned screen sequence

At the standard 1440×900 viewport, each public section is one screen unless noted.
The hero occupies the first screen alone. These heights are composition targets;
text zoom and smaller screens must expand content rather than clip it.

| ID / recipe | One idea and composition | Visual kind | Screens and motion |
| --- | --- | --- | --- |
| `hero` / split | Category headline left, handwriting sample in a navy viewer right. | Generated still life in a viewer | 1; hero enters once. On phones text precedes the sample. |
| `workspace` / app-frame | Show what an educator actually does: choose an image and review it. Full-width app window, navigation beside upload pane. | Product UI | 1 desktop; 2 tablet/mobile if necessary to preserve readable controls. No timed carousel. |
| `explanations` / split-text-left | Explain the model views beside a diagram that connects the image, screening, and review. | Workflow diagram | 1 desktop; content expands on mobile. |
| `screening-limit` / statement | Explain the experimental status using the actual product limitation. | Type | 1; dealt word-highlight moment, the only scroll-linked motion. |
| `questions` / faq | Answer the real input, scoring, retention, and report questions. Show answers openly. | FAQ | 1 desktop, up to 2 on tablet/mobile; natural expansion at text zoom. |
| `closing` / footer-dark + close-word | One final action, name set large, compact navigation and approved policy links. | Type/brand | 1; no additional moment or sticky conversion bar. |

Use centered navigation words **Workspace**, **Explanations**, **Questions**,
with **Sign in** as a text link and **Start a screening** as the primary action.
Three useful anchors are sufficient; do not add empty sections merely to reach a
navigation item count. Menu opens as a keyboard-accessible sheet on mobile.

The upload preview mirrors the full app composition. Choosing an image from the
preview opens the authenticated workflow.

## Public page copy draft

**Hero heading:** Handwriting screening for educators.

**Lead:** Upload a handwriting image to review its screening signal and available
model explanations. NeuroWrite AI is an experimental tool for professional review.

**Fact line:** One handwriting image per screening.

**Primary action everywhere:** Start a screening.

**Workspace heading:** Review a handwriting image.

**Workspace body:** Choose a clear image, check the preview, and run the screening
when you are ready. The result includes a score and the returned model explanations.

**Explanation heading:** Understand the model views.

**Explanation body:** Attention highlights weighted image regions. Grad-CAM shows
class attribution. Integrated Gradients shows stroke attribution. Available views
depend on the screening response.

**Statement:** Handwriting screening supports professional review.

**Statement supporting text:** NeuroWrite AI provides an experimental screening
signal. A qualified professional must conduct any formal assessment.

**FAQ heading:** Screening questions.

| Question | Draft answer |
| --- | --- |
| Is this a diagnosis? | No. NeuroWrite AI is an experimental screening tool. Its output does not replace a formal assessment by a qualified professional. |
| Which images can I upload? | Choose one PNG, JPEG, WebP, or BMP image. The planned upload limit is 25 MiB. Use a clear image of the handwriting you want to review. |
| What does the score mean? | The score summarizes the model's screening signal for the image. It is not an accuracy measure or a clinical diagnosis. |
| What does fold disagreement mean? | The ensemble's models can return different scores. The displayed range describes those differences, rather than a clinical confidence interval. |
| Are my handwriting images saved? | Saving a result is a separate action. Image retention is optional and starts off. Unsaved results are lost on reload, when you close the app, or when you sign out. |
| Why does a PDF take time? | The report service screens the original image again before creating the PDF. A report is a new analysis and may differ from a previously saved result. |

**Closing heading:** Start a handwriting screening.

**Closing body:** Choose an image and review the model's experimental screening signal.

Retention wording is a target behavior to verify against implementation before
publication. Do not claim transient memory survives reloads; PLAN.md defines the
precise lifecycle. Keep policy links absent until approved content is available.

## Application layouts

All workspace routes share the palette, type, buttons, and alignment system.
They do not inherit marketing screen heights, word effects, or a large footer.

| Screen | Desktop layout and priority | Mobile adaptation |
| --- | --- | --- |
| Authentication | Compact form with product name, visible field labels, confirmation/error status, and recovery link. No promotional sidebar filler. | One column; keyboard never covers submit/status; preserve entered values after failure. |
| Home `/dashboard` | Header action, real saved-screening summary, recent records as rows. With no history, lead with the upload action. | Stacked content, simple labeled record rows; no compressed multi-column statistics. |
| New screening | Page title above two columns: image selection/preview on the larger left; file information, optional identifier, notice, and Run screening on the right. | Instructions, file control, preview, then action in reading order. No fixed action overlapping content. |
| Processing | Keep the actual preview in place; replace the action panel with indeterminate status, cancellation, and a plain slow-request message when needed. | Same content order. No invented stage names or progress percentages. |
| Current result | Lead with a full-width outcome panel, with the score in a separate column. Follow with the viewer and model details. | Stack the outcome and score, then the viewer and model details. Wrap viewer tabs and keep the report action reachable. |
| History | Search/filter toolbar, paginated metadata table, clear category words and dates. View record action on each row. | Labeled row summaries retain subject/date/category; pagination targets remain large. |
| Saved detail | Same result composition, with date and saved identifier. Load image fields only when needed; show absent-image explanation honestly. | Summary before images; original unavailable state includes the report recovery action. |
| Settings | Profile and reading preferences as clear form sections. Name/institution only; no fabricated roles or subscriptions. | One column, labels above inputs, preview of changed reading preference. |

### Result anatomy

1. The panel titles are “Potential dyslexia” and “Normal,” mapped from the
   existing result category. Navy and muted teal distinguish the two appearances,
   with a text explanation in each.
2. The model score is labeled with its experimental context. Use a numeric
   display without a gauge or pass/fail badge.
3. Fold range is described in words, with an accessible table of actual fold scores.
4. The viewer uses keyboard- and pointer-operated tabs for Original, Grad-CAM,
   and Stroke attribution.
   Missing views are visibly unavailable with a reason, never filled with a fallback
   image mislabeled as another method.
5. A short explanation beside the viewer says what the selected method means.
   Grad-CAM uses a light cobalt overlay, a relative-strength legend, and a
   note when fold scores span the screening threshold. The legend uses neutral
   shading so it also works with older saved overlays.
6. Save result is distinct from Generate report. After save succeeds, primary
   emphasis can move to the next useful action. Retry save never reruns screening.
7. The returned screening disclaimer remains readable in the page, not only inside
   a tooltip. A Typical result does not become a claim that dyslexia is absent.

### State copy and controls

| State/action | Planned language |
| --- | --- |
| Empty upload | “Choose a handwriting image.” / “Choose image” |
| Ready | “Check the image before starting.” / “Run screening” |
| Processing | “Screening the handwriting image…” / “Cancel request” |
| Canceled | “The browser request was canceled. The server may still be processing.” |
| Inference failed | “The screening could not finish. Your image is still selected.” / “Retry screening” |
| Save failed | “Your result is available, but it could not be saved.” / “Retry save” |
| No history | “You have no saved screenings.” / “Start a screening” |
| Unsaved refresh recovery | “This screening is no longer available. Choose the image to start again.” |
| Original unavailable | “The original image was not retained. Re-upload an image to generate a new report.” |
| Report entry | “Report generation runs the screening again using the original image.” / “Generate report” |

Do not use toast messages as the only evidence of an error, save, or important
status. Keep them next to the relevant control and announce status changes accessibly.

## Motion and responsive behavior

- Public hero entrance: name/category arrives, then lead and action; keep the
  product visual present from first paint. Use the kit's entrance, not custom
  section-by-section reveals. Reduced motion displays the final state immediately.
- Word-highlight in `screening-limit`: draw attention to the limitation once it
  enters the reading area. Base text must already be readable; reduced motion and
  failed JS show complete text. Never animate an actual score or clinical disclaimer.
- Interaction feedback: buttons step 1px on hover and press in 90ms; hover entry
  150ms, exit 120ms, panels up to 200ms; ease `cubic-bezier(.2,.8,.2,1)`.
- Linked cards lift 2px only if clickable. A static result panel does not lift.
  Viewer images never zoom on hover because it could distort inspection; zoom is
  an explicit, labeled user action.
- Focus appears immediately with no animated delay. No automatic tab cycling,
  counter animation, particles, blinking scores, or looping specimen manipulation.
- Test public layout at 1440×900, 1024×768, 820×1180, 768×1024, and 390×844;
  check overflow/tap spacing at 320px. Also test 200% text and long filenames.
- Below the split breakpoint, stack text first and preserve complete controls.
  At text zoom or short viewport height, expand rather than crop or conceal content.
- Check account and workspace routes at 320, 640, 768, 1024, and 1440px. On narrow
  screens, keep the outcome and score together ahead of the filename, wrap
  workflow steps, and size previews to the viewport height. The public menu scrolls
  within the available space in phone landscape. Open compact navigation closes
  when the viewport grows into the desktop layout.
- Reading preferences adjust text size and line/word spacing in the app without
  claiming that a typeface treats dyslexia. Both color and geometry support focus.

## Assets and implementation handoff

Use the existing name and supplied mark. The handwriting still life is served as
responsive WebP. The visible product preview uses HTML, and Phosphor supplies the
interface icons.

An approved screening showcase would require the original image, actual results,
and permission to publish. Keep private uploads out of screenshots, social cards,
tests, and marketing.

Before building the first page, finish reading the skill's mandatory reference
set in full and the recipes for the selected layouts. Copy the appropriate kit
assets into the new app's public directory and use them as the skill specifies;
use the same tokens in the app CSS. Keep form submission in the auth module. Ensure module listeners are mounted
once and cleaned up during client navigation; no duplicate state owners.

Build order: shared tokens and controls -> workspace shell -> upload -> processing
and result -> real auth/data/report integration per PLAN.md -> public page reusing
finished components -> browser finish checks. This keeps the public visuals faithful
to the implemented application.

## Design acceptance and checking

The Taste dealer wrote `.taste-skill/history.json` and `layout-history.json`,
preserving the selection. Implementation now exists and the gate targets the
production public page. See VERIFICATION.md for the observed check results,
screenshots, genuine backend smoke test, and remaining verification limits.

Implementation refinements: the public overview is authored in `index.html` and is readable without JavaScript. The active workflow
is scoped to the signed-in account across client navigation; sign-out/account
changes clear it. Smaller-screen section heights are selected from the rendered
content. FAQ rows use the kit's semantic FAQ recipe. Typography is self-hosted via
Fontsource; its registered family name is Instrument Sans Variable.

At implementation, arm the gate against the actual built public page, rebuild
before each run, and run copy-lint, consistency, layout check, screenshots, perf,
then gate using the skill's scripts. Inspect all requested viewport screenshots.
Read the gate reference before documenting genuine recipe exceptions. Never
hide a needed label, reduce text size, edit the checker, or falsify results to pass.

For app routes, use the functional browser checks in PLAN.md and verify keyboard
focus, upload/error behavior, auth restoration, account isolation, optional images,
save retry, report rerun notice, zoom, reduced motion, and text enlargement. Keep
marketing-recipe exceptions visible in the handoff report.

Completion requires real controls, resolved assets, no horizontal overflow, and
honest missing-data states. Report mocked-service checks separately from real
inference, actual Supabase storage, and PDF verification.

## Git handoff

Do not commit or push. At the final implementation handoff, inspect the actual
branch and changed files and provide exact PowerShell commands for review,
explicit staging, commit, and push. Include package-lock.json among the intended
source files, exclude credentials/generated browser artifacts, and leave execution
to the user. The planning-history JSON can be retained as design provenance;
transient gate/build metadata and screenshots are not application source.

## Original multi-page structure

The user clarified that every original page must remain a separate page.
ROUTE_PARITY.md defines the mapping. The new account screens use distinct split
compositions in the Taste palette: a navy photo panel for login and a cobalt
photo panel beside the signup form. The report is a full page with a reference document and export
options. The processing page owns request status; the result page owns completed
review. Existing application accessibility and task-focused motion exceptions apply.
