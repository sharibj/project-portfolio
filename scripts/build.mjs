import { access, mkdir, mkdtemp, readFile, writeFile, copyFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { readModel, escapeHtml } from './model.mjs';
import { home, page, projectPage, tagIndex, tagPage, markdownProject, markdownIndex, route } from './templates.mjs';

const execute = promisify(execFile);
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const GENERATED_MARKER = '.portfolio-generated';

export async function put(root, relative, content) {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

export async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Check the next documented location. */ }
  }
  throw new Error('Diagram rendering needs installed Chrome/Chromium. Set CHROME_PATH to its executable. No browser is downloaded automatically.');
}

export async function renderDiagram(project, target) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'portfolio-diagram-'));
  try {
    const source = path.join(temporary, 'diagram.mmd');
    const config = path.join(temporary, 'mermaid.json');
    const browser = path.join(temporary, 'browser.json');
    await writeFile(source, project.diagram.source);
    await writeFile(config, JSON.stringify({
      securityLevel: 'strict', theme: 'base', htmlLabels: false, layout: 'dagre',
      deterministicIds: true, deterministicIDSeed: project.slug,
      fontFamily: 'Arial, sans-serif',
      flowchart: { useMaxWidth: true },
      themeVariables: { primaryColor: '#ccfbf1', primaryTextColor: '#134e4a', primaryBorderColor: '#0f766e', lineColor: '#475569', fontFamily: 'Arial, sans-serif' }
    }));
    await writeFile(browser, JSON.stringify({ executablePath: await findChrome(), headless: true }));
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await execute(process.execPath, [
        path.join(ROOT, 'node_modules/@mermaid-js/mermaid-cli/src/cli.js'),
        '-i', source, '-o', target, '-c', config, '-p', browser,
        '-I', `diagram-${project.slug}`, '-b', 'white', '--no-font-embed', '-q'
      ], { timeout: 60000, maxBuffer: 1024 * 1024 });
    } catch (error) {
      throw new Error(`Mermaid render failed for ${project.slug}: ${error.stderr || error.message}`);
    }
    const svg = await readFile(target, 'utf8');
    if (!svg.includes('<svg') || /<script\b|<foreignObject\b|(?:href|src)=["'](?:https?:|javascript:|data:)/i.test(svg)) {
      throw new Error(`Unsafe or invalid generated SVG for ${project.slug}`);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function verifyManagedDirectory(directory) {
  try {
    await access(directory);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  try { await access(path.join(directory, GENERATED_MARKER)); }
  catch { throw new Error(`Refusing to replace unmanaged directory ${directory}`); }
}

async function replaceManagedDirectory(temporary, target) {
  await verifyManagedDirectory(target);
  await rm(target, { recursive: true, force: true });
  await rename(temporary, target);
}

export async function build({ root = ROOT, diagramRenderer = renderDiagram } = {}) {
  const model = await readModel(root);
  const { config, projects, taxonomy } = model;
  await verifyManagedDirectory(path.join(root, 'dist'));
  await verifyManagedDirectory(path.join(root, 'generated'));
  const readmePath = path.join(root, 'README.md');
  const readme = await readFile(readmePath, 'utf8');
  const start = '<!-- portfolio:start -->';
  const end = '<!-- portfolio:end -->';
  const unmarked = !readme.includes(start) && !readme.includes(end);
  if (!unmarked && (readme.split(start).length !== 2 || readme.split(end).length !== 2 || readme.indexOf(start) > readme.indexOf(end))) {
    throw new Error('README.md needs exactly one ordered portfolio:start / portfolio:end marker pair, or none. Refusing to overwrite unrelated text.');
  }
  const nextReadme = unmarked ? null : readme.slice(0, readme.indexOf(start) + start.length) + '\n\n' + markdownIndex(model) + '\n' + readme.slice(readme.indexOf(end));
  const stage = await mkdtemp(path.join(root, '.portfolio-build-'));
  const website = path.join(stage, 'dist');
  const generated = path.join(stage, 'generated');
  try {
    await put(website, GENERATED_MARKER, 'Generated by scripts/build.mjs. Do not edit.\n');
    await put(generated, GENERATED_MARKER, 'Generated by scripts/build.mjs. Do not edit.\n');
    await put(website, '.nojekyll', '');
    await put(website, 'index.html', home(model));
    await put(website, 'tags/index.html', tagIndex(model));
    await put(website, '404.html', page({ title: 'Page not found', description: 'This project page could not be found.', config, body: `<header class="simple-header"><p class="eyebrow">404 / NO PROJECT HERE</p><h1>Let’s get back to the work.</h1><p class="story-summary">This page does not exist. <a href="${escapeHtml(route(config))}">Return to the portfolio</a>.</p></header>` }));
    for (const filename of ['style.css', 'site.js']) {
      await mkdir(path.join(website, 'assets'), { recursive: true });
      await copyFile(path.join(root, 'assets', filename), path.join(website, 'assets', filename));
    }
    for (const project of projects) {
      await put(website, `projects/${project.slug}/index.html`, projectPage(project, model));
      const markdown = markdownProject(project);
      await put(generated, `projects/${project.slug}/README.md`, markdown);
      await put(website, `readmes/projects/${project.slug}/README.md`, markdown);
      if (project.diagram) await diagramRenderer(project, path.join(website, `assets/diagrams/${project.slug}.svg`));
    }
    for (const [group, values] of Object.entries(taxonomy)) {
      for (const [slug, label] of values) await put(website, `tags/${group}/${slug}/index.html`, tagPage(group, label, model));
    }
    const index = markdownIndex(model, { generated: true });
    const profile = markdownIndex(model, { profile: true });
    await put(generated, 'README.md', index);
    await put(generated, 'profile-README.md', profile);
    await put(website, 'readmes/README.md', index);
    await put(website, 'readmes/profile-README.md', profile);
    const manifest = { formatVersion: 1, projects: projects.map(({ slug, kind, title }) => ({ slug, kind, title })), basePath: config.basePath };
    await put(website, 'manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    if (config.siteUrl) {
      const urls = ['', 'tags/', ...projects.map(project => `projects/${project.slug}/`), ...Object.entries(taxonomy).flatMap(([group, values]) => [...values.keys()].map(slug => `tags/${group}/${slug}/`))];
      await put(website, 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeHtml(config.siteUrl + route(config, url))}</loc></url>`).join('')}</urlset>\n`);
    }
    await replaceManagedDirectory(website, path.join(root, 'dist'));
    await replaceManagedDirectory(generated, path.join(root, 'generated'));
    if (nextReadme !== null) await writeFile(readmePath, nextReadme);
    return { projects: projects.length, diagrams: projects.filter(project => project.diagram).length, tags: [...taxonomy.technologies, ...taxonomy.topics].length };
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const started = performance.now();
  try {
    const result = await build();
    console.log(`Built ${result.projects} projects, ${result.tags} tag pages, ${result.diagrams} diagrams in ${((performance.now() - started) / 1000).toFixed(2)}s.`);
    console.log('Static website: dist/ · GitHub Markdown: generated/ · Deployment: inactive');
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
