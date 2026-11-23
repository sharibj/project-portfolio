# Sharib Jafari · Project portfolio

The context, decisions, and tradeoffs behind the work\. A portfolio of public\-safe engineering case studies\.

**Public-safe case studies, not the original implementation source.**

**Demo content:** Synthetic examples below are not personal achievements.

[Explore the themed portfolio](https://sharibj.github.io/project-portfolio/)

## [A review flow that keeps its place](https://sharibj.github.io/project-portfolio/projects/accessible-review-workflow/) · synthetic example

A synthetic frontend case study about readable decisions, keyboard access, and preserving context during review\.

- Key information before expandable detail
- Keyboard\-first review controls
- Draft state kept separate from submitted state

Technologies: React · TypeScript
Topics: Accessibility · State management · Interaction design

## [An in\-app AI assistant that knows what each user can see](https://sharibj.github.io/project-portfolio/projects/in-app-ai-assistant/)

A prototype assistant built into an enterprise application\. It guides business users through tasks and answers questions using the current screen, the features they can access, and documentation written by the teams that own each part of the UI\.

- Answers are scoped to the features each user's license and feature flags enable
- Context\-aware help: step\-by\-step guidance, deep links, and explanations of any UI element the user selects
- Optional developer\-authored tags let each micro\-frontend team document its own UI

Technologies: Python · Pydantic · React
Topics: LLM applications · Retrieval\-augmented generation · Context engineering · Micro\-frontends

## [Making event delivery predictable](https://sharibj.github.io/project-portfolio/projects/reliable-event-delivery/) · synthetic example

A synthetic backend case study about retrying safely, handling duplicates, and making failure visible\.

- Explicit retry and failure states
- Idempotency at the consumer boundary
- A recovery path operators can inspect

Technologies: TypeScript · PostgreSQL
Topics: Reliability · Event\-driven systems · Observability
