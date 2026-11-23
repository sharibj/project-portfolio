// Synthetic regression data stays independent of the owner's editable portfolio.
export const defaultConfig = {
  title: 'Engineering, explained.', description: 'Synthetic test portfolio',
  author: 'Test author', intro: 'Clear engineering stories.', bio: 'Synthetic examples only.',
  githubUsername: '', siteUrl: '', basePath: ''
};
export const backend = {
  slug: 'reliable-event-delivery', kind: 'synthetic-demo', visibility: 'public-approved',
  title: 'Making event delivery predictable',
  summary: 'A synthetic backend case study.', role: 'Example backend engineer',
  status: 'Synthetic design example', period: 'Illustrative', accent: 'teal',
  technologies: ['TypeScript', 'PostgreSQL'],
  topics: ['Reliability', 'Event-driven systems', 'Observability'],
  highlights: ['Explicit retry states', 'Idempotency at the boundary', 'Visible recovery'],
  problem: ['Duplicate events can repeat a local side effect.'],
  constraints: ['At-least-once delivery.'],
  contribution: ['Synthetic example, not personal work.'],
  decisions: [{ title: 'Make retries safe', choice: 'Record an event key transactionally.', alternative: 'Retry without deduplication.', tradeoff: 'Storage and cleanup work.' }],
  results: [{ claim: 'Illustrates a recovery boundary.', basis: 'No production system, benchmark, or measured improvement is represented.' }],
  limitations: ['No cross-service atomicity guarantee.'],
  lessons: ['Name ambiguous states.'], nextSteps: ['Test partial completion.'],
  diagram: {
    title: 'Synthetic flow', source: 'flowchart LR\n A[Input] --> B[Worker]',
    description: 'An input reaches a worker.', legend: ['Input: source', 'Worker: processing']
  }
};
export const frontend = {
  ...backend, slug: 'accessible-review-workflow', title: 'A review flow that keeps its place',
  summary: 'A synthetic frontend case study.', role: 'Example frontend engineer', accent: 'violet',
  technologies: ['React', 'TypeScript'],
  topics: ['Accessibility', 'State management', 'Interaction design'], diagram: null
};
