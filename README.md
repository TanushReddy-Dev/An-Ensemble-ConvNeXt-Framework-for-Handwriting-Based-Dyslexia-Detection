# NeuroWrite AI

NeuroWrite AI is an experimental handwriting screening tool for professional
review. A qualified professional is responsible for formal assessment.

The FastAPI service scores handwriting images with the available ConvNeXt-Tiny
model folds, or falls back to ResNet-50 when no ConvNeXt folds load. The score is
the mean of the loaded folds. Grad-CAM shows regions that contribute positively
to that average. Stroke attribution uses a three-step Integrated Gradients
approximation from the first loaded fold.

## Run locally

Use Python 3.10+ and Node 22.12+ with versions of Torch and TorchVision that
support your platform. From the repository root:

```powershell
python -m pip install -r requirements.txt
$env:SUPABASE_URL = 'https://your-project.supabase.co'
$env:SUPABASE_PUBLISHABLE_KEY = 'your-publishable-or-legacy-anon-key'
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload --reload-dir src
```

Use the same Supabase project in the API and browser. Configure database policies
and account redirects using the [frontend setup guide](frontend-new/README.md).
The API validates each screening or report request with Supabase Auth. The
project's publishable key or legacy anon key is sufficient.

In another terminal:

```powershell
Set-Location frontend-new
npm ci
Copy-Item .env.example .env
# Set the public VITE_ values described in the frontend setup guide.
npm run dev
```

Open [NeuroWrite AI](http://127.0.0.1:5173/). The current frontend is plain HTML,
CSS, and JavaScript. The React application in `frontend/` remains available as a
legacy reference.

## Models and API

Trained checkpoints are supplied separately. Place available checkpoints named
`convnext_fold0_best.pt` through `convnext_fold4_best.pt` under
`outputs/checkpoints/`. See the [Colab training guide](colab/README.md).
Weights load on the first inference request for a backbone. The repository
excludes trained weights and raw handwriting data.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service and device status. |
| `GET /docs` | Interactive API docs. |
| `POST /api/v1/screen` | Experimental outcome, model score, fold range, and available overlays. |
| `POST /api/v1/report` | Reruns screening with the submitted image and returns a branded PDF summary. |
| `POST /api/v1/screen-letters-ig` | Stroke-segmentation and attribution research endpoint. |
| `POST /predict` | Legacy API response for compatibility. |

All four POST routes require a Supabase bearer token. The health endpoint can
respond before any checkpoints load. The frontend stores screening metadata only
when a user saves a result. Image retention is an explicit choice.

## Verification and deployment

Run `python -m pytest -q` from the repository root. The Python suite uses
synthetic images and models, including PDF and attribution regression checks.
Run `npm test`, `npm run test:e2e`, `npm run build`, and
`npm run test:production` in `frontend-new/` for browser and build verification.

The [verification record](frontend-new/VERIFICATION.md) describes the checks
and their limits. The [frontend setup guide](frontend-new/README.md) covers
static hosting, error documents, Supabase ownership checks, and deployment settings.
