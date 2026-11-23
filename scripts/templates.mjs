import { escapeHtml as h, escapeMarkdown as m, tagSlug } from './model.mjs';

export const route = (config, target = '') => `${config.basePath}/${target}`;
const synthetic = project => project.kind === 'synthetic-demo';
const badge = project => synthetic(project) ? '<span class="badge demo">Synthetic example</span>' : '<span class="badge">Case study · private source</span>';
const paragraphs = values => values.map(value => `<p>${h(value)}</p>`).join('');
const list = values => `<ul>${values.map(value => `<li>${h(value)}</li>`).join('')}</ul>`;
const section = (title, content, id) => `<section class="story-section" id="${id}"><h2>${title}</h2>${content}</section>`;

export function tags(project, config) {
  return ['technologies', 'topics'].map(group => `<div class="tag-group"><span class="tag-label">${group === 'technologies' ? 'Technologies' : 'Technical topics'}</span><div class="tag-list">${project[group].map(tag => `<a class="tag ${group}" href="${route(config, `tags/${group}/${tagSlug(tag)}/`)}">${h(tag)}</a>`).join('')}</div></div>`).join('');
}

function header(config, active) {
  return `<header class="site-header"><a class="wordmark" href="${route(config)}" aria-label="Portfolio home"><span class="brand-mark" aria-hidden="true">p.</span><span>THE PROJECT FILES</span></a><nav aria-label="Main navigation"><a href="${route(config, '#projects')}" ${active === 'projects' ? 'aria-current="page"' : ''}>Projects</a><a href="${route(config, 'tags/')}" ${active === 'tags' ? 'aria-current="page"' : ''}>Explore tags</a><button class="theme-toggle" type="button" aria-label="Switch to dark theme" hidden>Dark theme</button></nav></header>`;
}

export function page({ title, description, body, config, current = '', active = '', demo = false }) {
  const canonical = config.siteUrl ? `<link rel="canonical" href="${h(config.siteUrl + route(config, current))}">` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(title)} · ${h(config.author)}</title><meta name="description" content="${h(description)}">${canonical}
<meta name="color-scheme" content="light dark"><link rel="stylesheet" href="${route(config, 'assets/style.css')}"><script src="${route(config, 'assets/site.js')}" defer></script></head>
<body><a class="skip-link" href="#main">Skip to content</a><div class="shell">${header(config, active)}
${demo ? '<aside class="demo-banner"><span class="status-dot" aria-hidden="true"></span> DEMO COLLECTION <span>These are synthetic examples, not claims of personal work.</span></aside>' : ''}
<main id="main" tabindex="-1">${body}</main><footer class="site-footer"><div><strong>${h(config.author)}</strong><span>Context. Decisions. Lessons.</span></div><p>Private source. Public-safe stories.<br><a href="${route(config, 'readmes/README.md')}">Read the Markdown index</a>${config.githubUsername ? ` · <a href="https://github.com/${h(config.githubUsername)}">GitHub profile</a>` : ''}</p></footer></div></body></html>
`;
}

export function card(project, config, index = 0) {
  return `<article class="project-card accent-${project.accent}" data-project data-search="${h([project.title, project.summary, ...project.technologies, ...project.topics].join(' ').toLowerCase())}"><div class="card-top"><span class="project-number">${String(index + 1).padStart(2, '0')} / PROJECT NOTE</span>${badge(project)}</div><h3><a href="${route(config, `projects/${project.slug}/`)}">${h(project.title)}</a></h3><p class="card-summary">${h(project.summary)}</p><div class="card-role"><span>${h(project.role)}</span><span>${h(project.status)}</span></div><ul class="highlights">${project.highlights.map(highlight => `<li>${h(highlight)}</li>`).join('')}</ul>${tags(project, config)}<a class="story-link" href="${route(config, `projects/${project.slug}/`)}">Read the case study <span aria-hidden="true">↗</span></a></article>`;
}

export function home(model) {
  const { config, projects } = model;
  const technologyCount = new Set(projects.flatMap(project => project.technologies)).size;
  const topicCount = new Set(projects.flatMap(project => project.topics)).size;
  const body = `<section class="hero"><div><p class="eyebrow">AN ENGINEERING PORTFOLIO / ${h(config.author)}</p><h1>${h(config.title)}</h1><p class="hero-intro">${h(config.intro)}</p><p class="muted hero-copy">${h(config.bio)}</p><a class="primary-link" href="#projects">Explore the work <span class="down-arrow" aria-hidden="true"></span></a></div><aside class="hero-note"><span class="note-heading">BEYOND THE CODE</span><div class="note-line"><span>01</span><p>The problem.<br><strong>What needed to change?</strong></p></div><div class="note-line"><span>02</span><p>The decisions.<br><strong>Why this approach?</strong></p></div><div class="note-line"><span>03</span><p>The evidence.<br><strong>What can we actually claim?</strong></p></div><span class="note-footer">ENGINEERING IS IN THE TRADEOFFS.</span></aside></section>
<section id="projects" class="collection"><div class="section-heading"><div><p class="eyebrow">SELECTED PROJECT NOTES</p><h2>A closer look at the work.</h2></div><p class="collection-stats">${projects.length} ${projects.length === 1 ? 'project' : 'projects'} <span>/</span> ${technologyCount} technologies <span>/</span> ${topicCount} topics</p></div><form class="search-form" role="search" hidden><label for="project-search">Find a project</label><input id="project-search" type="search" placeholder="Search a technology, topic, or title…" aria-describedby="search-count"><p id="search-count" class="muted" role="status" aria-live="polite">${projects.length} projects</p></form><div class="project-grid">${projects.map((project, index) => card(project, config, index)).join('')}</div><p class="empty-state" hidden>No matching projects. Try another term.</p>${projects.length ? '' : '<p class="empty-state">Your first project starts with a conversation. Use the project-writeup skill to add an approved case study.</p>'}</section>
<section class="reading-note"><span class="eyebrow">A NOTE ON READING</span><h2>Start with the highlights.<br>Go deeper where you’re curious.</h2><p>Each story separates the problem, individual contribution, engineering decisions, and supported outcomes. Supporting detail opens only when you choose.</p></section>`;
  return page({ title: config.title, description: config.description, body, config, active: 'projects', demo: projects.some(synthetic) });
}

export function projectPage(project, model) {
  const { config, projects } = model;
  const decisions = project.decisions.map((decision, index) => `<details class="decision"><summary><span class="detail-index">${String(index + 1).padStart(2, '0')}</span><span>${h(decision.title)}</span><span class="expand-icon" aria-hidden="true">+</span></summary><div class="detail-body"><h3>The choice</h3><p>${h(decision.choice)}</p><h3>The alternative</h3><p>${h(decision.alternative)}</p><h3>The tradeoff</h3><p>${h(decision.tradeoff)}</p></div></details>`).join('');
  const diagram = project.diagram ? section('The shape of the solution', `<figure class="architecture"><div class="diagram-surface"><img src="${route(config, `assets/diagrams/${project.slug}.svg`)}" alt="${h(project.diagram.description)}" width="1100" height="380" loading="lazy"></div><figcaption><strong>${h(project.diagram.title)}</strong><p>${h(project.diagram.description)}</p><ul class="diagram-legend">${project.diagram.legend.map(item => `<li>${h(item)}</li>`).join('')}</ul></figcaption></figure>`, 'architecture') : '';
  const next = projects[(projects.findIndex(item => item.slug === project.slug) + 1) % projects.length];
  const body = `<a class="back-link" href="${route(config, '#projects')}">← All projects</a><header class="story-header accent-${project.accent}"><div class="story-label">${badge(project)}<span class="eyebrow">PROJECT CASE STUDY</span></div><h1>${h(project.title)}</h1><p class="story-summary">${h(project.summary)}</p><dl class="project-meta"><div><dt>Role</dt><dd>${h(project.role)}</dd></div><div><dt>Status</dt><dd>${h(project.status)}</dd></div><div><dt>Context</dt><dd>${h(project.period)}</dd></div></dl>${tags(project, config)}<div class="story-highlights"><span class="eyebrow">THE HIGHLIGHTS</span>${list(project.highlights)}</div></header>
<div class="story-layout"><nav class="on-this-page" aria-label="On this page"><p class="eyebrow">IN THIS STORY</p><a href="#problem">Problem & constraints</a><a href="#contribution">Contribution</a>${project.diagram ? '<a href="#architecture">Architecture</a>' : ''}<a href="#decisions">Engineering decisions</a><a href="#results">Results & evidence</a><a href="#lessons">Lessons & next steps</a><a class="markdown-link" href="${route(config, `readmes/projects/${project.slug}/README.md`)}">Markdown version ↗</a></nav><article class="story-content">
${section('The problem & the boundaries', paragraphs(project.problem) + `<h3>Constraints</h3>` + list(project.constraints), 'problem')}
${section('The individual contribution', paragraphs(project.contribution), 'contribution')}${diagram}
${section('Where the engineering gets interesting', '<p class="muted">Open a decision to see the choice, alternative, and tradeoff.</p>' + decisions, 'decisions')}
${section('Results, with the evidence attached', project.results.map(result => `<div class="result"><h3>${h(result.claim)}</h3><p><span class="evidence-label">BASIS</span> ${h(result.basis)}</p></div>`).join('') + (project.limitations.length ? `<div class="limitations"><h3>What this does not establish</h3>${list(project.limitations)}</div>` : ''), 'results')}
${section('What carries forward', `<h3>Lessons</h3>${list(project.lessons)}${project.nextSteps.length ? `<details class="decision"><summary><span>Next steps</span><span class="expand-icon" aria-hidden="true">+</span></summary><div class="detail-body">${list(project.nextSteps)}</div></details>` : ''}`, 'lessons')}</article></div>
${next && next.slug !== project.slug ? `<a class="next-project" href="${route(config, `projects/${next.slug}/`)}"><span class="eyebrow">NEXT PROJECT NOTE</span><strong>${h(next.title)} <span aria-hidden="true">↗</span></strong></a>` : ''}`;
  return page({ title: project.title, description: project.summary, body, config, current: `projects/${project.slug}/`, demo: synthetic(project) });
}

export function tagIndex(model) {
  const { config, taxonomy } = model;
  const body = `<a class="back-link" href="${route(config)}">← Portfolio home</a><header class="simple-header"><p class="eyebrow">FOLLOW YOUR CURIOSITY</p><h1>Explore the connections.</h1><p class="story-summary">Browse the tools used and the engineering questions explored. Tags describe these stories, not proficiency ratings.</p></header>${Object.entries(taxonomy).map(([group, values]) => `<section class="tag-section"><h2>${group === 'technologies' ? 'Technologies' : 'Technical topics'}</h2><div class="tag-directory">${[...values.entries()].sort((a,b) => a[1].localeCompare(b[1], 'en')).map(([slug, label]) => `<a href="${route(config, `tags/${group}/${slug}/`)}"><span>${h(label)}</span><span>${model.projects.filter(project => project[group].includes(label)).length} ↗</span></a>`).join('')}</div></section>`).join('')}`;
  return page({ title: 'Explore tags', description: 'Browse case studies by technology and technical topic.', body, config, current: 'tags/', active: 'tags', demo: model.projects.some(synthetic) });
}

export function tagPage(group, label, model) {
  const projects = model.projects.filter(project => project[group].includes(label));
  const body = `<a class="back-link" href="${route(model.config, 'tags/')}">← All tags</a><header class="simple-header"><p class="eyebrow">${group === 'technologies' ? 'TECHNOLOGY' : 'TECHNICAL TOPIC'}</p><h1>${h(label)}</h1><p class="story-summary">${projects.length} ${projects.length === 1 ? 'story' : 'stories'} connected by ${h(label)}.</p></header><section class="tag-section"><h2>Project stories</h2><div class="project-grid">${projects.map((project, index) => card(project, model.config, index)).join('')}</div></section>`;
  return page({ title: label, description: `Project stories about ${label}.`, body, config: model.config, current: `tags/${group}/${tagSlug(label)}/`, active: 'tags', demo: projects.some(synthetic) });
}

export function markdownProject(project) {
  const lines = [`# ${m(project.title)}`, '', synthetic(project) ? '**Synthetic example, not a real project or personal achievement.**' : '**Public case study. Implementation source is private.**', '', m(project.summary), '', `**Role:** ${m(project.role)}  `, `**Status:** ${m(project.status)}  `, `**Context:** ${m(project.period)}`, '', `**Technologies:** ${project.technologies.map(m).join(' · ')}`, `**Technical topics:** ${project.topics.map(m).join(' · ')}`, '', '## Highlights', ...project.highlights.map(item => `- ${m(item)}`)];
  const add = (title, values) => lines.push('', `## ${title}`, '', ...values.flatMap(value => [m(value), '']));
  add('Problem', project.problem); add('Constraints', project.constraints); add('Individual contribution', project.contribution);
  if (project.diagram) lines.push('', '## Architecture', '', `### ${m(project.diagram.title)}`, '', '```mermaid', project.diagram.source, '```', '', m(project.diagram.description), '', ...project.diagram.legend.map(item => `- ${m(item)}`));
  lines.push('', '## Engineering decisions', '');
  for (const decision of project.decisions) lines.push('<details>', '', `<summary>${h(decision.title)}</summary>`, '', `**Choice:** ${m(decision.choice)}`, '', `**Alternative:** ${m(decision.alternative)}`, '', `**Tradeoff:** ${m(decision.tradeoff)}`, '', '</details>', '');
  lines.push('## Results and evidence', '');
  for (const result of project.results) lines.push(`- **${m(result.claim)}**`, `  - Basis: ${m(result.basis)}`, '');
  add('Limitations', project.limitations); add('Lessons', project.lessons); add('Next steps', project.nextSteps);
  return lines.join('\n').trim() + '\n';
}

export function markdownIndex(model, { profile = false, generated = false } = {}) {
  const { config, projects } = model;
  const lines = [`# ${m(config.author)} · Project portfolio`, '', m(config.description), '', '**Public-safe case studies, not the original implementation source.**', ''];
  if (projects.some(synthetic)) lines.push('**Demo content:** Synthetic examples below are not personal achievements.', '');
  if (config.siteUrl) lines.push(`[Explore the themed portfolio](${config.siteUrl + route(config)})`, '');
  else lines.push('_Set siteUrl in portfolio.config.json after choosing the public URL. Nothing is deployed._', '');
  for (const project of projects) {
    const link = profile
      ? (config.siteUrl ? config.siteUrl + route(config, `projects/${project.slug}/`) : null)
      : `${generated ? '' : 'generated/'}projects/${project.slug}/README.md`;
    lines.push(`## ${link ? `[${m(project.title)}](${link})` : m(project.title)}${synthetic(project) ? ' · synthetic example' : ''}`, '', m(project.summary), '', ...project.highlights.map(item => `- ${m(item)}`), '', `Technologies: ${project.technologies.map(m).join(' · ')}`, `Topics: ${project.topics.map(m).join(' · ')}`, '');
  }
  return lines.join('\n').trim() + '\n';
}
