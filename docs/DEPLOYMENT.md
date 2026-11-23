# Review before publishing

Nothing in this project creates a repository, enables Pages, or edits a profile. Every push to `main` publishes the site through `.github/workflows/github-pages.yml`, so review content before it reaches `main`.

## Repository placement

- The recommended site repository is `<username>/<username>.github.io`.
- A separate optional `<username>/<username>` repository holds the profile README.
- All case studies share the central site: `/projects/<slug>/`.
- Do not create a repository per project by default.
- If a user site already exists, preserve it and integrate deliberately.

Set `githubUsername`, `siteUrl` (HTTPS origin only), and optional `basePath` in `portfolio.config.json`. For a user site, use an empty base path. For a site backed by a repository named `portfolio`, use `"/portfolio"`. Rebuild after changing URL configuration. The preview server mounts the same base path.

## Local review

```sh
npm run check
npm run preview
npm run package:public
```

Review `public-package/`, including the complete repository source, not just `dist/`. The package command copies an explicit allowlist and generated outputs. It does not copy the workspace wholesale. Private files must not exist in the source repository in the first place.

Check:

- Exact claims, role, delivery status, evidence, limitations, tags, and disclosure permission.
- No private inputs, review notes, provenance, secrets, original project code, restricted names/screenshots, or personal data in any file or history.
- Synthetic examples remain labeled or are intentionally replaced.
- Real name/title and public URLs are set deliberately.
- Desktop/mobile layouts, keyboard focus and expansion, tag browsing, both themes, and diagram/text equivalents.
- Reproduction from the lockfile with the documented Node and Chrome requirements.

## Publishing

Pushing to `main` publishes. The user must separately authorize repository creation, pushing to `main`, Pages or workflow changes, and profile changes. An approval to generate files is not publication approval.

`.github/workflows/github-pages.yml` builds, checks, and deploys `dist/` on every push to `main`, and can also be run manually. GitHub Pages must use GitHub Actions as its source. `.github/workflows/check.yml` runs the same checks on pull requests without deploying.

Actions are pinned to commit SHAs with the version in a comment. Dependabot (`.github/dependabot.yml`) opens weekly update pull requests for actions and npm dependencies; review them and let the check pass before merging.

The workflows run on hosted Ubuntu with Chrome at `/usr/bin/google-chrome`. Adjust `CHROME_PATH` if needed.

This repository is served as a project site, so `basePath` is `/project-portfolio`. Renaming the repository requires updating `basePath` to match.

Keep `dist/` as the Pages artifact. `.nojekyll` is generated. Do not upload private workspaces or the entire machine/work directory. A private backing repository does not by itself make a normal Pages website private.

Copy the reviewed `generated/profile-README.md` snippet into the separate profile repository only with permission. Preserve any existing profile content. No automatic cross-repository sync is configured.

Official references: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [profile README](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme), and [Factory skills](https://docs.factory.com/harness/skills.md).
