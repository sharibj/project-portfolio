# Private work. Public-safe stories.

A reusable Factory interview skill and a lightweight static portfolio generator. One repository holds every case study, themed page, tag index, shared style, and site build.

**Case studies are public-safe write-ups. The original implementation source stays private. The site is published at https://sharibj.github.io/project-portfolio/.**

## Run locally

Requirements: Node.js 22.13 or newer, npm, and installed Chrome/Chromium for build-time Mermaid rendering. The toolchain does not download another browser.

```sh
PUPPETEER_SKIP_DOWNLOAD=true npm ci --ignore-scripts
npm run check
npm run preview
```

Open `http://127.0.0.1:4173` plus the configured `basePath` (currently `http://127.0.0.1:4173/project-portfolio/`). Set `CHROME_PATH` to your browser executable if it is not found automatically. Run commands from this directory.

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

Colors, spacing, typography, and responsive layouts live in `assets/style.css`; shared markup lives in `scripts/templates.mjs`.

## Generated outputs

- `dist/`: complete static website and build-time Mermaid SVGs, no runtime CDN.
- `generated/projects/<slug>/README.md`: GitHub-readable case studies with Mermaid and collapsed decisions.
- `generated/README.md`: Markdown project index.
- `generated/profile-README.md`: optional profile snippet, not an automatic profile edit.
- If this README contains `portfolio:start` / `portfolio:end` markers, the index between them updates from the same content.
- `public-package/`: created only by `npm run package:public`. An explicit allowlist includes the source and synthetic-only tests, and excludes research, unrelated files, dependencies, and private inputs. Review every included file before publishing.

Builds reject unexpected content fields, invalid slugs, tag spelling collisions, unapproved visibility markers, unsafe diagram constructs, and some common secret/email patterns. These checks cannot determine truth, ownership, consent, or confidentiality.

The build refuses to replace `dist/`, `generated/`, or `public-package/` directories without its generated marker. Build failures during validation/rendering preserve the previous successful website. Do not put hand-edited files in generated directories.

## Deployment

Every push to `main` deploys the site through `.github/workflows/github-pages.yml`. The workflow installs from the lockfile, runs `npm run check`, and publishes `dist/` to GitHub Pages. You can also start it manually from the Actions tab. Pull requests run the same check through `.github/workflows/check.yml` without deploying. Actions are pinned to commit SHAs, and Dependabot proposes weekly updates for actions and npm dependencies. See the [deployment notes](docs/DEPLOYMENT.md).

## License

The generator code (scripts, assets, tests, workflows, and the Factory skill) is available under the [MIT License](LICENSE). The case study content in `content/projects/`, `generated/`, and the published site is © Sharib Jafari, all rights reserved, and is not covered by the MIT License.