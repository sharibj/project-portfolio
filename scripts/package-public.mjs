import { mkdir, copyFile, readFile, rm, lstat, mkdtemp, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, ROOT, GENERATED_MARKER } from './build.mjs';
import { checkOutput, walk } from './check.mjs';
import { readModel } from './model.mjs';

// Explicit allowlist, never a repository-wide copy. Review this list when adding tools.
export const PUBLIC_SOURCE_FILES = [
  'package.json', 'package-lock.json', '.puppeteerrc.cjs', '.gitignore',
  'portfolio.config.json', 'README.md', 'AGENTS.md',
  'assets/style.css', 'assets/site.js',
  'scripts/model.mjs', 'scripts/templates.mjs', 'scripts/build.mjs',
  'scripts/check.mjs', 'scripts/serve.mjs', 'scripts/package-public.mjs',
  'docs/CONTENT.md', 'docs/DEPLOYMENT.md',
  'deployment/github-pages.yml.example',
  'test/portfolio.test.mjs', 'test/fixtures.mjs',
  '.factory/skills/project-writeup/SKILL.md',
  '.factory/skills/project-writeup/interview-guide.md'
];

export async function packagePublic({ root = ROOT, diagramRenderer } = {}) {
  await build({ root, diagramRenderer });
  await checkOutput(root);
  const { projects } = await readModel(root);
  const target = path.join(root, 'public-package');
  try {
    await lstat(target);
    await readFile(path.join(target, GENERATED_MARKER));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    try { await lstat(target); throw new Error('Refusing to replace an unmanaged public-package directory'); }
    catch (existing) { if (existing.code !== 'ENOENT') throw existing; }
  }
  const stage = await mkdtemp(path.join(root, '.portfolio-package-'));
  try {
    const files = [...PUBLIC_SOURCE_FILES, ...projects.map(project => `content/projects/${project.slug}.json`)];
    for (const directory of ['generated', 'dist']) {
      for (const file of await walk(path.join(root, directory))) files.push(`${directory}/${file}`);
    }
    for (const relative of files) {
      const source = path.join(root, relative);
      if (!(await lstat(source)).isFile()) throw new Error(`Only regular allowlisted files may be packaged: ${relative}`);
      await mkdir(path.dirname(path.join(stage, relative)), { recursive: true });
      await copyFile(source, path.join(stage, relative));
    }
    await copyFile(path.join(root, 'dist', GENERATED_MARKER), path.join(stage, GENERATED_MARKER));
    await rm(target, { recursive: true, force: true });
    await rename(stage, target);
    return files.length;
  } finally { await rm(stage, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const count = await packagePublic();
    console.log(`Prepared public-package/ with ${count} allowlisted files. No GitHub actions taken.`);
    console.log('Review every file before release. Automated checks cannot establish disclosure permission.');
  } catch (error) { console.error(`Packaging failed: ${error.message}`); process.exitCode = 1; }
}
