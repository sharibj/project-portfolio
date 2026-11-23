const toggle = document.querySelector('.theme-toggle');
let theme;
try { theme = localStorage.getItem('portfolio-theme'); } catch { /* Storage is optional. */ }
if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
const dark = () => document.documentElement.dataset.theme
  ? document.documentElement.dataset.theme === 'dark'
  : matchMedia('(prefers-color-scheme: dark)').matches;
const updateThemeLabel = () => {
  const next = dark() ? 'light' : 'dark';
  toggle.textContent = `${next === 'light' ? 'Light' : 'Dark'} theme`;
  toggle.setAttribute('aria-label', `Switch to ${next} theme`);
};
if (toggle) {
  toggle.hidden = false;
  updateThemeLabel();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeLabel);
  toggle.addEventListener('click', () => {
    const next = dark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('portfolio-theme', next); } catch { /* Storage is optional. */ }
    updateThemeLabel();
  });
}
const search = document.querySelector('#project-search');
if (search) {
  document.querySelector('.search-form').hidden = false;
  const cards = [...document.querySelectorAll('[data-project]')];
  search.addEventListener('input', () => {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      card.hidden = !terms.every(term => card.dataset.search.includes(term));
      if (!card.hidden) count += 1;
    });
    document.querySelector('#search-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
    document.querySelector('.empty-state').hidden = count !== 0;
  });
}
