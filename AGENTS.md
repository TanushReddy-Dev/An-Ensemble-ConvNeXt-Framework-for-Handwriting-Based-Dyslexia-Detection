# Repository instructions

## Project and current task

NeuroWrite AI is an experimental handwriting screening application. It consists of
a Python/FastAPI inference service, Supabase Auth/PostgreSQL, and an existing React
frontend. The new frontend is being planned independently in `frontend-new/`.

The initial requested deliverable is planning and agent instructions. Do not treat
that request as authorization to implement the full frontend. Read
`frontend-new/PLAN.md` and `frontend-new/AGENTS.md` before subsequent implementation.
The user has since explicitly authorized building it with Taste Skill and prohibited
use of the Sites skill. Implementation is confined to the new folder.
The replacement now uses HTML, CSS, and browser JavaScript. Preserve its routes,
design, and screening workflows when maintaining it.

## Scope and source of truth

- Keep `frontend/` intact as a reference and working legacy application.
- Put fresh frontend source, configuration, tests, and documentation in
  `frontend-new/`. Do not import runtime code from the old frontend.
- Treat `src/api.py`, `src/screening_engine.py`, and `supabase/schema.sql` as the
  integration source of truth. Check migrations for existing database compatibility.
- Backend, model, checkpoint, database, and legacy frontend changes require a
  concrete integration need; describe that need before expanding implementation.
- Do not access or commit local secrets, patient/student images, model weights,
  generated reports, dependencies, or build artifacts.
- Keep instructions in the standard uppercase `AGENTS.md` filename.

## Product integrity

- Describe outputs as experimental screening signals, never diagnoses.
- Do not invent accuracy claims, clinical validation, testimonials, model results,
  patients, or dashboard statistics.
- Preserve the binary Elevated/Typical screening contract. Do not build UI around
  legacy Normal/Reversal/Corrected probabilities from `/predict`.
- Keep actual API failures and persistence failures visible; never substitute a
  successful mock response in production.

## Working practices

- Never create commits or push changes. The user will perform both manually.
- At the final implementation handoff, provide commands to review, stage, commit,
  and push the intended changes, using the actual branch and changed paths.
- Read relevant code before changing it. Use `rg` for targeted discovery.
- Keep changes scoped and reversible; preserve unrelated work.
- Use the repository's applicable skills when their instructions cover the task.
- Do not spawn agents unless the user or another applicable instruction explicitly
  requests delegation. The filename `AGENTS.md` alone does not request delegation.
- Validate changes with checks appropriate to the modified area. Documentation-only
  changes do not require inference runs or dependency installation.
- When behavior changes, update the new frontend plan and setup documentation.
