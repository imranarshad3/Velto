# Claude Code token-saving policy

1. Keep `CLAUDE.md` concise and persistent. At the start of each milestone, read only its section/spec plus related existing components.
2. Use short implementation prompts in `prompts/`; do not paste the full documentation in every Claude turn.
3. Say `modify only these files`; avoid whole-repo rewrites.
4. Ask for **edits in files**, not full file printouts; final summaries <= 6 bullets.
5. Build one section/milestone at a time. Approve after screenshots/tests, then proceed.
6. Avoid repeated planning; reference decisions in docs rather than re-explaining.
7. Run tests once after a coherent change instead of every tiny edit (unless debugging requires it).
8. Before introducing libraries/components, reuse dependencies and patterns already present.
9. For bugfixes: provide error + affected file(s), ask for minimal patch; don't request a fresh app.
10. Maintain a short `docs/PROGRESS.md` (created on first task): completed, files changed, blockers, next task; keep under 40 lines.

Optional short command: `Read CLAUDE.md, docs/PROGRESS.md and docs/HOMEPAGE_SPEC.md. Implement M01 only. No unrelated changes. Run lint/build. Reply in <=6 bullets.`
