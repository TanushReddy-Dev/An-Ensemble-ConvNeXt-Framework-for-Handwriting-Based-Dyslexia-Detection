# Manual Git commands

No commits, pushes, or branch changes were made by the assistant. The observed
branch is `main`; the remote is named `origin`. Run these yourself from PowerShell.

```powershell
Set-Location -LiteralPath 'C:\Users\Tanus\Projects\workspace\DyslexiaFinal'
git status --short
git switch -c codex/fresh-frontend
git add -- AGENTS.md frontend-new
git diff --cached --stat
git diff --cached
git commit -m "Build NeuroWrite frontend in HTML, CSS, and JavaScript"
git push -u origin codex/fresh-frontend
```

Review the staged diff before the commit. The new frontend's ignore rules exclude
local environment files, dependencies, output bundles, browser profiles, test
artifacts, and transient Taste checker state. Stage the two deal-history JSON
files, documented checker waivers, responsive handwriting images, and hero
sharing image along with the app source.
