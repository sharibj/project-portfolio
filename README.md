# Private work. Public-safe stories.

A reusable Factory interview skill and a lightweight static portfolio generator. One repository holds every case study, themed page, tag index, shared style, and site build.

**The included projects are synthetic demonstrations. They are not personal achievements. Nothing is deployed.**

## Run locally

Requirements: Node.js 22.13 or newer, npm, and installed Chrome/Chromium for build-time Mermaid rendering. The toolchain does not download another browser.

```sh
PUPPETEER_SKIP_DOWNLOAD=true npm ci --ignore-scripts
npm run check
npm run preview
```

Open `http://127.0.0.1:4173`. Set `CHROME_PATH` to your browser executable if it is not found automatically. Run commands from this directory.

## Interview → approved content → portfolio

Start a new Factory session in this folder and invoke **`/project-writeup`**, or ask it to interview you about a private project. The project skill is in `.factory/skills/project-writeup/SKILL.md`. It interviews in short rounds, adapts follow-ups, separates personal and team work, checks claim support, and asks for disclosure approval before importing sanitized content.

Keep all transcripts, drafts, review notes, and claim provenance in a **separate private workspace outside this repository**. Never grant access to private implementation repositories just to explain a project.

1. Interview and draft privately, using only information you can share with the AI service.
2. Review claims, uncertainty, tags, visuals, and disclosure limits.
3. Explicitly approve the sanitized public content.
4. Add a validated `content/projects/<slug>.json` file. See [the content contract](docs/CONTENT.md).
5. Run `npm run check`. The same JSON drives project pages, Markdown companions, tags, cards, navigation, and README indexes.
6. Review the presentation and complete file set. Publishing is a separate decision.

There is no application API key, model call, or interview database. The interview runs through Factory's AI skill. The site is static HTML/CSS with a small optional script for search and theme selection. Navigation, tag browsing, diagrams, and disclosure controls work without JavaScript.

## Customize

Edit `portfolio.config.json`: name, title, introduction, bio, and optional GitHub username/public origin. Leave the username and site URL empty until chosen. For a user site, leave `basePath` empty; a project site can use `"/portfolio"` without a trailing slash. `siteUrl` is only the HTTPS origin, with no path.

Keep demo language until you replace the synthetic fixtures with approved real content. Colors, spacing, typography, and responsive layouts live in `assets/style.css`; shared markup lives in `scripts/templates.mjs`.

## Generated outputs

- `dist/`: complete static website and build-time Mermaid SVGs, no runtime CDN.
- `generated/projects/<slug>/README.md`: GitHub-readable case studies with Mermaid and collapsed decisions.
- `generated/README.md`: Markdown project index.
- `generated/profile-README.md`: optional profile snippet, not an automatic profile edit.
- If this README contains `portfolio:start` / `portfolio:end` markers, the index between them updates from the same content.
- `public-package/`: created only by `npm run package:public`. An explicit allowlist includes the source and synthetic-only tests, and excludes research, unrelated files, dependencies, and private inputs. Review every included file before publishing.

Builds reject unexpected content fields, invalid slugs, tag spelling collisions, unapproved visibility markers, unsafe diagram constructs, and some common secret/email patterns. These checks cannot determine truth, ownership, consent, or confidentiality.

The build refuses to replace `dist/`, `generated/`, or `public-package/` directories without its generated marker. Build failures during validation/rendering preserve the previous successful website. Do not put hand-edited files in generated directories.

## Deployment is manual

`.github/workflows/github-pages.yml` runs only when started manually (`workflow_dispatch`). No push or schedule triggers it, and it deploys nothing until Pages uses GitHub Actions as its source and someone runs it. [Deployment instructions](docs/DEPLOYMENT.md) explain user-site placement and the separate review/authorization needed to activate it. No repository is created and no GitHub settings are changed by any command.