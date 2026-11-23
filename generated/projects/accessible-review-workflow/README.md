# A review flow that keeps its place

**Synthetic example, not a real project or personal achievement.**

A synthetic frontend case study about readable decisions, keyboard access, and preserving context during review\.

**Role:** Example frontend engineer  
**Status:** Synthetic design example  
**Context:** Illustrative, not a real engagement

**Technologies:** React · TypeScript
**Technical topics:** Accessibility · State management · Interaction design

## Highlights
- Key information before expandable detail
- Keyboard\-first review controls
- Draft state kept separate from submitted state

## Problem

In this fictional review tool, long forms hide the information needed for the next decision\. Reviewers need to inspect detail without losing the current item\.

The example considers navigation, focus, and unsaved edits as parts of one workflow\.


## Constraints

Core decisions must remain possible without a mouse\.

Expanding supporting detail must not erase edits or move focus unexpectedly\.


## Individual contribution

This synthetic example does not represent personal work\. An engineer in this scenario would define the interaction states and build reusable, accessible review sections\.

User research and production usability results are not claimed\.


## Engineering decisions

<details>

<summary>Separate the decision from its supporting detail</summary>

**Choice:** Keep the item summary and decision controls visible, with supporting notes in labeled disclosure sections\.

**Alternative:** Show all fields and notes at once\.

**Tradeoff:** Collapsed detail reduces scanning effort, but labels must be specific enough for readers to know what they will reveal\.

</details>

<details>

<summary>Make unsaved work a first-class state</summary>

**Choice:** Model draft edits separately from the saved response and ask before discarding meaningful changes\.

**Alternative:** Reset local form state whenever the selected item changes\.

**Tradeoff:** Draft state adds transitions and tests\. It avoids accidental data loss when navigation and editing overlap\.

</details>

## Results and evidence

- **The design demonstrates a summary\-first review flow with explicit draft and saved states\.**
  - Basis: Synthetic design discussion only\. No user study, accessibility certification, or measured productivity gain is claimed\.


## Limitations

Accessible primitives do not establish that a complete application is accessible\. Real assistive\-technology testing remains necessary\.


## Lessons

Focus behavior and data persistence should be designed together, not added after the happy path\.


## Next steps

For a real project, test rapid navigation, partially completed forms, failed saves, and keyboard\-only review\.
