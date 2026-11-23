import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './build.mjs';

export async function walk(directory, prefix = '') {
  const result = [];
  for (const entry of (await readdir(path.join(directory, prefix), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in output: ${relative}`);
    if (entry.isDirectory()) result.push(...await walk(directory, relative));
    else result.push(relative);
  }
  return result;
}

export async function checkOutput(root = ROOT) {
  const directory = path.join(root, 'dist');
  const { basePath } = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  const files = await walk(directory);
  let links = 0;
  for (const relative of files.filter(file => file.endsWith('.html'))) {
    const html = await readFile(path.join(directory, relative), 'utf8');
    if (!html.includes('<html lang="en">') || !html.includes('id="main"')) throw new Error(`${relative}: missing page landmarks`);
    for (const [, attribute, target] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
      if (/^(?:https:|mailto:)/.test(target)) continue;
      if (target.startsWith('#')) {
        if (!html.includes(`id="${target.slice(1)}"`)) throw new Error(`${relative}: missing anchor ${target}`);
        continue;
      }
      if (!target.startsWith(basePath + '/')) throw new Error(`${relative}: unscoped ${attribute} ${target}`);
      const [pathname, fragment] = target.slice(basePath.length + 1).split('#');
      const resolved = path.join(directory, pathname.endsWith('/') || !pathname ? pathname + 'index.html' : pathname);
      try { await stat(resolved); } catch { throw new Error(`${relative}: broken ${attribute} ${target}`); }
      if (fragment) {
        const destination = await readFile(resolved, 'utf8');
        if (!destination.includes(`id="${fragment}"`)) throw new Error(`${relative}: broken fragment ${target}`);
      }
      links++;
    }
  }
  for (const relative of files.filter(file => file.endsWith('.md'))) {
    const markdown = await readFile(path.join(directory, relative), 'utf8');
    for (const [, target] of markdown.matchAll(/\]\(([^)]+)\)/g)) {
      if (target.startsWith('https://')) continue;
      try { await stat(path.resolve(directory, path.dirname(relative), target)); }
      catch { throw new Error(`${relative}: broken Markdown link ${target}`); }
      links++;
    }
  }
  return { files: files.length, pages: files.filter(file => file.endsWith('.html')).length, links };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await checkOutput(); console.log(`Checked ${result.pages} pages, ${result.links} local links/assets, ${result.files} files. No broken local links.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
