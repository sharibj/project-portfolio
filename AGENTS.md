# Project portfolio

- Node.js 22.13+; install with `PUPPETEER_SKIP_DOWNLOAD=true npm ci --ignore-scripts`.
- `npm run check` runs tests, builds the site, and checks local links.
- `npm run preview` serves only `dist/` on loopback port 4173.
- `npm run package:public` creates an allowlisted, reviewable `public-package/`.
- Canonical approved content: `content/projects/*.json`. See `docs/CONTENT.md`.
- Never store transcripts, raw interview inputs, private review notes, claim provenance, secrets, or original private project code anywhere in this directory. Use a separate private workspace OUTSIDE this repository.
- Import only sanitized content that the user has explicitly approved for public disclosure. Approval markers are assertions, not automated privacy guarantees.
- Keep demo projects clearly synthetic. Never infer personal achievements from fixtures.
- `generated/`, `dist/`, and the marked root README index (when present) are generated. Edit content or templates, not those outputs.
- Generated code, content, diagrams, and all repository files require review before release.
- Pushing to `main` publishes the site. Do not create repositories, commit, push, change GitHub settings or workflow triggers, or publish without explicit authorization for that exact action.
