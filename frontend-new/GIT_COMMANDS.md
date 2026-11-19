# Manual Git handoff

From the repository root, review the local changes and publish on a new branch.
These commands stage the release work shown in the current handoff. They leave
environment files, checkpoints, reports, raw samples, and build output out of Git.

```powershell
git status --short
git switch -c codex/release-completion
git add -- README.md requirements.txt colab frontend-new src/api.py src/auth.py src/report_generator.py supabase/tests tests
git -c core.whitespace=cr-at-eol diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "Complete NeuroWrite screening release"
git push -u origin codex/release-completion
```

Review the staged diff before committing. Use a pull request for the review
and merge. Deployment configuration and Supabase credentials live outside Git.
