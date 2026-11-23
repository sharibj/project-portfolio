import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const projectKeys = ['slug', 'kind', 'visibility', 'title', 'summary', 'role', 'status', 'period', 'accent', 'technologies', 'topics', 'highlights', 'problem', 'constraints', 'contribution', 'decisions', 'results', 'limitations', 'lessons', 'nextSteps', 'diagram'];
const configKeys = ['title', 'description', 'author', 'intro', 'bio', 'githubUsername', 'siteUrl', 'basePath'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function record(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  for (const key of Object.keys(value)) assert(keys.includes(key), `${label}: unexpected field "${key}"`);
  for (const key of keys) assert(Object.hasOwn(value, key), `${label}: missing field "${key}"`);
}

export function checkSensitiveText(text, label = 'content') {
  const patterns = [
    /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
    /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/,
    /\b(?:password|api[_-]?key|access[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_+/=-]{8,}/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  ];
  assert(!patterns.some(pattern => pattern.test(text)), `${label}: possible secret or personal email; remove it before importing`);
}

function text(value, label, max = 2000, empty = false) {
  assert(typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0), `${label} must be ${empty ? 'a' : 'a nonempty'} string of at most ${max} characters`);
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value), `${label}: control characters are not allowed`);
  checkSensitiveText(value, label);
}

function strings(value, label, min = 0, max = 12) {
  assert(Array.isArray(value) && value.length >= min && value.length <= max, `${label} must contain ${min}–${max} items`);
  value.forEach((item, i) => text(item, `${label}[${i}]`));
}

export function tagSlug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\+/g, '-plus-').replace(/#/g, '-sharp-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function validateProject(project) {
  record(project, projectKeys, 'project');
  for (const key of ['slug', 'title', 'summary', 'role', 'status', 'period']) text(project[key], key, key === 'summary' ? 400 : 160);
  assert(slugPattern.test(project.slug), 'slug must use lowercase letters/numbers separated by hyphens');
  assert(['synthetic-demo', 'case-study'].includes(project.kind), 'kind must be synthetic-demo or case-study');
  assert(project.visibility === 'public-approved', 'Only public-approved content may enter the portfolio. Keep interview drafts outside this repository.');
  assert(['teal', 'violet', 'amber'].includes(project.accent), 'accent must be teal, violet, or amber');
  for (const key of ['technologies', 'topics']) {
    strings(project[key], key, 1, 8);
    assert(new Set(project[key]).size === project[key].length, `${key}: duplicate tags`);
    project[key].forEach(tag => assert(tag.length <= 60 && tagSlug(tag), `${key}: unsupported tag "${tag}"`));
  }
  strings(project.highlights, 'highlights', 2, 3);
  for (const key of ['problem', 'constraints', 'contribution', 'lessons']) strings(project[key], key, 1);
  for (const key of ['limitations', 'nextSteps']) strings(project[key], key);
  assert(Array.isArray(project.decisions) && project.decisions.length >= 1 && project.decisions.length <= 8, 'decisions must contain 1–8 decisions');
  project.decisions.forEach((decision, i) => {
    record(decision, ['title', 'choice', 'alternative', 'tradeoff'], `decisions[${i}]`);
    for (const [key, value] of Object.entries(decision)) text(value, `decisions[${i}].${key}`);
  });
  assert(Array.isArray(project.results) && project.results.length >= 1 && project.results.length <= 8, 'results must contain 1–8 supported or explicitly qualified results');
  project.results.forEach((result, i) => {
    record(result, ['claim', 'basis'], `results[${i}]`);
    text(result.claim, `results[${i}].claim`);
    text(result.basis, `results[${i}].basis`);
  });
  if (project.diagram !== null) {
    record(project.diagram, ['title', 'source', 'description', 'legend'], 'diagram');
    text(project.diagram.title, 'diagram.title', 160);
    text(project.diagram.source, 'diagram.source', 6000);
    text(project.diagram.description, 'diagram.description');
    strings(project.diagram.legend, 'diagram.legend', 1, 8);
    assert(/^(?:flowchart\s+(?:LR|RL|TB|TD|BT)|sequenceDiagram)\b/.test(project.diagram.source), 'diagram: use a high-level flowchart or sequenceDiagram');
    assert(!/(?:<|```|%%|@\{|https?:|javascript:|data:|file:|\b(?:click|href|image|icon)\b)/i.test(project.diagram.source), 'diagram: HTML, URLs, directives, links, and embedded resources are not allowed');
  }
  return project;
}

export function validateConfig(config) {
  record(config, configKeys, 'config');
  for (const key of ['title', 'description', 'author', 'intro', 'bio']) text(config[key], `config.${key}`);
  for (const key of ['githubUsername', 'siteUrl', 'basePath']) text(config[key], `config.${key}`, 300, true);
  assert(!config.githubUsername || /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(config.githubUsername), 'githubUsername must be a GitHub username, not a URL');
  assert(!config.basePath || /^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(config.basePath), 'basePath must be empty or a path such as /portfolio without a trailing slash');
  if (config.siteUrl) {
    const url = new URL(config.siteUrl);
    assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'siteUrl must be an HTTPS origin without a path, query, or credentials; use basePath for a project-site path');
    config = { ...config, siteUrl: url.origin };
  }
  return config;
}

export async function readModel(root) {
  const config = validateConfig(JSON.parse(await readFile(path.join(root, 'portfolio.config.json'), 'utf8')));
  const directory = path.join(root, 'content/projects');
  const entries = (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const projects = [];
  for (const entry of entries) {
    assert(entry.isFile() && entry.name.endsWith('.json'), `content/projects must contain only approved project JSON files; found "${entry.name}"`);
    const file = path.join(directory, entry.name);
    assert(!(await lstat(file)).isSymbolicLink(), 'Project symlinks are not allowed');
    const project = validateProject(JSON.parse(await readFile(file, 'utf8')));
    assert(entry.name === `${project.slug}.json`, `Project filename must match slug "${project.slug}"`);
    projects.push(project);
  }
  const slugs = new Set();
  const taxonomy = { technologies: new Map(), topics: new Map() };
  for (const project of projects) {
    assert(!slugs.has(project.slug), `Duplicate slug: ${project.slug}`);
    slugs.add(project.slug);
    for (const group of Object.keys(taxonomy)) {
      for (const label of project[group]) {
        const key = tagSlug(label);
        assert(!taxonomy[group].has(key) || taxonomy[group].get(key) === label, `Normalize ${group} tag spelling: "${label}" conflicts with "${taxonomy[group].get(key)}"`);
        taxonomy[group].set(key, label);
      }
    }
  }
  return { config, projects, taxonomy };
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const escapeMarkdown = value => String(value).replace(/([\\`*_{}\[\]()#+.!|<>~-])/g, '\\$1');
