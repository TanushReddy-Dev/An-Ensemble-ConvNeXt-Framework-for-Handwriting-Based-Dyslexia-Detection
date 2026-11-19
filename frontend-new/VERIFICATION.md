# Verification record

## Release checks

- Backend tests use synthetic folds and images. They cover screening results,
  ensemble Grad-CAM, patch coverage, the known Integrated Gradients step-count
  sensitivity, and all upload endpoints. The authentication tests use a mocked
  Supabase Auth service to verify authorization, rejection, and service failures.
- The PDF tests generate files in memory. They check the authoritative category
  at the rounded cutoff, the missing-overlay state, and a UTF-8 download name.
- The [ownership test](../supabase/tests/screening_owner_isolation.sql) ran against
  PostgreSQL 17 with the repository's policies and a local Auth-schema substitute.
  Two authenticated identities could read and save their own rows. The policies
  blocked cross-account access. The transaction rolled back.
- The Colab builder regenerated an isolated notebook copy. Ten embedded training
  modules compiled and the comparative cell contained one benchmark entry point.
- Frontend browser suites use fixture services for authentication, screening, and
  persistence. Production tests cover the landing without JavaScript, working
  account navigation, branded standalone 404 and 500 documents, and render recovery.
- The navigation tests sample intermediate scroll positions and confirm focus and
  history after selecting a landing section. They also check the page transition,
  sidebar indicator, and reduced-motion behavior. Production tests fetch the
  browser icons, manifest, and social artwork. A separate test build with a
  sample site origin emits canonical and absolute social preview URLs.

```powershell
# From the repository root
python -m pytest -q

# From frontend-new
npm run lint
npm test
npm run test:e2e
npm run build
npm run test:production
```

The public landing passed the Taste finish gate with three existing waivers
covering the text-only FAQ, domain-specific headings, and the transparent app
root. The checker reported 14 nonblocking warnings. See the
[checker waivers](.taste-skill/waivers.json) for the scope of each exception.

## Verification boundaries

The local checks establish application and policy behavior for fixtures. The
deployed Supabase project's tokens, email delivery, and policies still require a
staging check. Trained checkpoints, real handwriting, Colab training, and the
accuracy of the model or explanations on representative samples were outside
this run. The backend requires Supabase configuration for protected requests.
Static hosts must configure the HTTP status and the serving rules for the
standalone error pages.
