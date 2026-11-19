# Manual Git handoff

From the repository root, use a feature branch based on the current `origin/main`.
Review the status and stage only the frontend files that belong to the change.
Keep local environment files, checkpoints, reports, raw samples, and build output
out of Git.

```powershell
git status --short
git branch --show-current
git add -- frontend-new
git -c core.whitespace=cr-at-eol diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "Describe the frontend change"
git push -u origin HEAD
```

Review the staged diff before committing. Open a pull request to `main`.
Version routing rules in `vercel.json` and set deployment-specific environment
values in the host dashboard.
