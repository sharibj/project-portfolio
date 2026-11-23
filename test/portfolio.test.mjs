import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { build, ROOT, put } from '../scripts/build.mjs';
import { validateProject, validateConfig, readModel, tagSlug } from '../scripts/model.mjs';
import { markdownProject, projectPage } from '../scripts/templates.mjs';
import { checkOutput, walk } from '../scripts/check.mjs';
import { serve } from '../scripts/serve.mjs';
import { packagePublic, PUBLIC_SOURCE_FILES } from '../scripts/package-public.mjs';
import { backend, frontend, defaultConfig } from './fixtures.mjs';

const fakeDiagram = async (project, target) => put(path.dirname(target), path.basename(target), `<svg xmlns="http://www.w3.org/2000/svg" role="img"><text>${project.slug}</text></svg>`);

async function fixture(t, { config = {}, projects = [frontend, backend], full = false } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const files = full ? PUBLIC_SOURCE_FILES : ['assets/style.css', 'assets/site.js'];
  for (const relative of files) {
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await copyFile(path.join(ROOT, relative), path.join(root, relative));
  }
  await writeFile(path.join(root, 'portfolio.config.json'), JSON.stringify({ ...defaultConfig, ...config }));
  await writeFile(path.join(root, 'README.md'), '# Keep this introduction\n\n<!-- portfolio:start -->\n<!-- portfolio:end -->\n\nKeep this ending.\n');
  await mkdir(path.join(root, 'content/projects'), { recursive: true });
  for (const project of projects) await writeFile(path.join(root, `content/projects/${project.slug}.json`), JSON.stringify(project));
  return root;
}

async function digest(root) {
  const hash = createHash('sha256');
  for (const directory of ['dist', 'generated']) {
    for (const file of await walk(path.join(root, directory))) {
      hash.update(`${directory}/${file}\0`);
      hash.update(await readFile(path.join(root, directory, file)));
    }
  }
  hash.update(await readFile(path.join(root, 'README.md')));
  return hash.digest('hex');
}

test('complete synthetic backend/frontend fixtures satisfy the content contract', () => {
  assert.equal(validateProject(structuredClone(backend)).kind, 'synthetic-demo');
  assert.equal(validateProject(structuredClone(frontend)).diagram, null);
  assert.equal(tagSlug('C++'), 'c-plus-plus');
  assert.equal(tagSlug('C#'), 'c-sharp');
  assert.equal(tagSlug('Event-driven systems'), 'event-driven-systems');
});

test('refuses unapproved content, private extra keys, unsupported claims and unsafe diagram input', () => {
  for (const change of [
    { visibility: 'draft' }, { transcript: 'PRIVATE_REVIEW_CANARY' },
    { slug: '../outside' }, { results: [{ claim: 'Faster', basis: '' }] },
    { technologies: ['React', 'React'] }
  ]) assert.throws(() => validateProject({ ...structuredClone(backend), ...change }));
  const secret = 'ghp_' + 'A'.repeat(30);
  assert.throws(() => validateProject({ ...structuredClone(backend), summary: secret }), /possible secret/);
  assert.throws(() => validateProject({ ...structuredClone(backend), summary: 'Contact someone@example.invalid' }), /personal email/);
  for (const source of ['flowchart LR\n A-->B\n click A "https://example.invalid"', 'flowchart LR\n A["<img src=x>"]', 'flowchart LR\n %%{init: {}}%%\n A-->B']) {
    assert.throws(() => validateProject({ ...structuredClone(backend), diagram: { ...backend.diagram, source } }), /diagram:/);
  }
});

test('strict config rejects unsafe base paths and URL credentials/paths', () => {
  for (const basePath of ['/', '//outside', '/..', '/x/']) assert.throws(() => validateConfig({ ...defaultConfig, basePath }));
  for (const siteUrl of ['http://example.invalid', 'https://user:pass@example.invalid', 'https://example.invalid/path']) assert.throws(() => validateConfig({ ...defaultConfig, siteUrl }));
  assert.equal(validateConfig({ ...defaultConfig, siteUrl: 'https://example.invalid/', basePath: '/portfolio' }).siteUrl, 'https://example.invalid');
});

test('escapes text independently for HTML and GitHub Markdown', () => {
  const project = { ...structuredClone(backend), title: '<script>alert("x")</script>', summary: '![tracking](https://example.invalid/pixel)' };
  const html = projectPage(project, { config: defaultConfig, projects: [project] });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(markdownProject(project).includes('\\!\\[tracking\\]'));
  assert.match(markdownProject(backend), /```mermaid\nflowchart LR/);
  assert.match(markdownProject(frontend), /<details>/);
});

test('one source builds all outputs with headlines before closed decision details', async t => {
  const root = await fixture(t);
  assert.deepEqual(await build({ root, diagramRenderer: fakeDiagram }), { projects: 2, diagrams: 1, tags: 9 });
  const checked = await checkOutput(root);
  assert.equal(checked.pages, 14);
  const html = await readFile(path.join(root, 'dist/projects/reliable-event-delivery/index.html'), 'utf8');
  assert.ok(html.indexOf('THE HIGHLIGHTS') < html.indexOf('<details'));
  assert.ok(!/<details[^>]*\bopen\b/.test(html));
  assert.ok(html.includes('Synthetic example'));
  assert.ok(html.includes('No production system, benchmark'));
  assert.ok(html.includes('assets/diagrams/reliable-event-delivery.svg'));
  const tagged = await readFile(path.join(root, 'dist/tags/topics/reliability/index.html'), 'utf8');
  assert.ok(tagged.indexOf('<h2') < tagged.indexOf('<h3'), 'Tag page needs a level-2 heading before project card headings');
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.startsWith('# Keep this introduction'));
  assert.ok(readme.endsWith('Keep this ending.\n'));
  assert.ok(readme.includes('generated/projects/reliable-event-delivery/README.md'));
});

test('a canonical edit updates site, cards, README, profile and taxonomy without drift', async t => {
  const root = await fixture(t, { config: { siteUrl: 'https://portfolio.example.invalid', githubUsername: 'example' } });
  await build({ root, diagramRenderer: fakeDiagram });
  const changed = structuredClone(backend);
  changed.title = 'A changed approved headline';
  changed.topics = ['Recovery design'];
  changed.highlights[0] = 'A changed supported highlight';
  await writeFile(path.join(root, `content/projects/${changed.slug}.json`), JSON.stringify(changed));
  await build({ root, diagramRenderer: fakeDiagram });
  for (const file of ['dist/index.html', `dist/projects/${changed.slug}/index.html`, `generated/projects/${changed.slug}/README.md`, 'generated/profile-README.md', 'generated/README.md', 'README.md']) {
    const body = await readFile(path.join(root, file), 'utf8');
    assert.ok(body.includes(changed.title), `${file} must reflect the new title`);
    assert.ok(body.includes(changed.highlights[0]), `${file} must reflect the new highlight`);
  }
  await assert.rejects(readFile(path.join(root, 'dist/tags/topics/reliability/index.html')), { code: 'ENOENT' });
  assert.ok((await readFile(path.join(root, 'dist/tags/topics/recovery-design/index.html'), 'utf8')).includes(changed.title));
  await checkOutput(root);
});

test('repeat builds are idempotent and removing a project removes stale generated outputs', async t => {
  const root = await fixture(t);
  await build({ root, diagramRenderer: fakeDiagram });
  const before = await digest(root);
  await build({ root, diagramRenderer: fakeDiagram });
  assert.equal(await digest(root), before);
  await rm(path.join(root, 'content/projects/reliable-event-delivery.json'));
  await build({ root, diagramRenderer: fakeDiagram });
  await assert.rejects(readFile(path.join(root, 'dist/projects/reliable-event-delivery/index.html')), { code: 'ENOENT' });
  await assert.rejects(readFile(path.join(root, 'generated/projects/reliable-event-delivery/README.md')), { code: 'ENOENT' });
  assert.equal((await checkOutput(root)).pages, 9);
});

test('failed validation or diagram rendering preserves the last successful outputs', async t => {
  const root = await fixture(t);
  await build({ root, diagramRenderer: fakeDiagram });
  const before = await digest(root);
  await assert.rejects(build({ root, diagramRenderer: async () => { throw new Error('Renderer unavailable'); } }), /Renderer unavailable/);
  assert.equal(await digest(root), before);
  await writeFile(path.join(root, 'content/projects/reliable-event-delivery.json'), JSON.stringify({ ...backend, visibility: 'draft' }));
  await assert.rejects(build({ root, diagramRenderer: fakeDiagram }), /public-approved/);
  assert.equal(await digest(root), before);
});

test('refuses to replace an unmanaged output and leaves an unmarked README untouched', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist/user-file.txt'), 'preserve');
  await assert.rejects(build({ root, diagramRenderer: fakeDiagram }), /unmanaged/);
  assert.equal(await readFile(path.join(root, 'dist/user-file.txt'), 'utf8'), 'preserve');
  await rm(path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'README.md'), '# User-owned content');
  await build({ root, diagramRenderer: fakeDiagram });
  assert.equal(await readFile(path.join(root, 'README.md'), 'utf8'), '# User-owned content');
  await writeFile(path.join(root, 'README.md'), '# User-owned content\n<!-- portfolio:start -->\n');
  await assert.rejects(build({ root, diagramRenderer: fakeDiagram }), /marker pair/);
  assert.equal(await readFile(path.join(root, 'README.md'), 'utf8'), '# User-owned content\n<!-- portfolio:start -->\n');
});

test('rejects unexpected content files, symlinks and ambiguous tag spelling', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'content/projects/private-notes.txt'), 'SYNTHETIC_CANARY');
  await assert.rejects(readModel(root), /only approved project JSON/);
  await rm(path.join(root, 'content/projects/private-notes.txt'));
  await symlink(path.join(root, 'content/projects/reliable-event-delivery.json'), path.join(root, 'content/projects/linked.json'));
  await assert.rejects(readModel(root), /only approved project JSON/);
  await rm(path.join(root, 'content/projects/linked.json'));
  await writeFile(path.join(root, 'content/projects/accessible-review-workflow.json'), JSON.stringify({ ...frontend, technologies: ['typescript'] }));
  await assert.rejects(readModel(root), /Normalize technologies/);
});

test('empty collections and project-site subpaths have valid pages and local links', async t => {
  const empty = await fixture(t, { projects: [] });
  assert.equal((await build({ root: empty, diagramRenderer: fakeDiagram })).projects, 0);
  assert.equal((await checkOutput(empty)).pages, 3);
  const subpath = await fixture(t, { config: { basePath: '/portfolio', siteUrl: 'https://example.invalid' } });
  await build({ root: subpath, diagramRenderer: fakeDiagram });
  await checkOutput(subpath);
  const html = await readFile(path.join(subpath, 'dist/projects/reliable-event-delivery/index.html'), 'utf8');
  assert.ok(html.includes('href="/portfolio/assets/style.css"'));
  assert.ok(html.includes('href="https://example.invalid/portfolio/projects/reliable-event-delivery/"'));
  assert.ok((await readFile(path.join(subpath, 'dist/sitemap.xml'), 'utf8')).includes('/portfolio/tags/topics/reliability/'));
});

test('preview serves nested pages/assets and blocks source, dot files, traversal and writes', async t => {
  const root = await fixture(t, { config: { basePath: '/portfolio' } });
  await build({ root, diagramRenderer: fakeDiagram });
  const server = await serve({ root, port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const url of ['/portfolio/', '/portfolio/projects/reliable-event-delivery/', '/portfolio/assets/style.css', '/portfolio/assets/diagrams/reliable-event-delivery.svg']) assert.equal((await fetch(origin + url)).status, 200, url);
  for (const url of ['/', '/portfolio/content/projects/reliable-event-delivery.json', '/portfolio/.portfolio-generated', '/portfolio/%2e%2e/README.md', '/portfolio/not-a-project/']) assert.equal((await fetch(origin + url)).status, 404, url);
  assert.equal((await fetch(origin + '/portfolio/', { method: 'POST' })).status, 405);
  assert.equal((await fetch(origin + '/portfolio/', { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(origin + '/portfolio/projects/reliable-event-delivery', { redirect: 'manual' })).status, 302);
});

test('public packaging copies only the allowlist and never enables deployment', async t => {
  const root = await fixture(t, { full: true });
  // These are synthetic canaries, never real private inputs.
  const canary = ['DO_NOT_COPY', 'SYNTHETIC_CANARY'].join('_');
  await writeFile(path.join(root, 'transcript.txt'), canary);
  await put(root, '.private/notes.txt', canary);
  await put(root, '.github/workflows/deploy.yml', canary);
  const count = await packagePublic({ root, diagramRenderer: fakeDiagram });
  assert.ok(count > 40);
  const files = await walk(path.join(root, 'public-package'));
  assert.ok(files.includes('.factory/skills/project-writeup/SKILL.md'));
  assert.ok(files.includes('deployment/github-pages.yml'));
  assert.ok(files.includes('test/portfolio.test.mjs'));
  assert.ok(!files.some(file => /^(?:\.github|\.private|node_modules)\//.test(file) || file === 'transcript.txt'));
  for (const file of files) assert.ok(!(await readFile(path.join(root, 'public-package', file), 'utf8')).includes(canary), file);
  await packagePublic({ root, diagramRenderer: fakeDiagram });
});

test('Factory skill has a valid entrypoint and explicit adaptive/approval boundaries', async () => {
  const skill = await readFile(path.join(ROOT, '.factory/skills/project-writeup/SKILL.md'), 'utf8');
  const guide = await readFile(path.join(ROOT, '.factory/skills/project-writeup/interview-guide.md'), 'utf8');
  assert.match(skill, /^---\nname: project-writeup\ndescription: .+\nuser-invocable: true\n/);
  for (const requirement of ['AskUser', 'Do not create the canonical JSON before approval', 'npm run check', 'outside the repository', 'Do not read original private source repositories']) assert.ok(skill.includes(requirement), requirement);
  for (const branch of ['Backend or integration', 'Frontend or product workflow', 'Data or ML', 'Refresh interview']) assert.ok(guide.includes(branch));
  assert.ok(guide.includes('idempotency'));
  assert.ok(guide.includes('keyboard focus'));
});
