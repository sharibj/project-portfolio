# Adaptive interview reference

Use this as a menu, not a checklist to send all at once. Ask at most a few related questions per round.

## Common story

- What problem existed before this work, and who felt it?
- What did you personally build, change, or decide? What belonged to the team?
- What constraints removed otherwise reasonable options?
- Which decision had a plausible alternative? Why did you reject it?
- What failed, surprised you, or remains unresolved?
- What outcome was actually observed? How was it measured, compared, or qualified?
- Which details are safe for the public, versus only safe for this conversation?

## Backend or integration

Start with the real boundary named in the answer. Ask about its failure model:

- If a request times out, can the caller know whether it completed?
- Can messages arrive twice or out of order? Where is idempotency enforced?
- What happens after part of a multi-step operation succeeds?
- What is retried, for how long, and who can inspect/recover failures?
- Which contract, throughput, latency, or consistency constraint shaped the design?
- What evidence supports a reliability/performance claim? What was not tested?

Do not assume queues, transactions, microservices, or exactly-once processing.

## Frontend or product workflow

Follow the actual interaction, not a generic component list:

- What does a user need to understand first, before opening detail?
- Which loading, empty, error, draft, saved, and partly completed states exist?
- If navigation overlaps a save or an edit, what survives?
- Where does keyboard focus go after expanding, submitting, failing, or navigating?
- What assistive-technology or keyboard testing actually happened?
- What evidence shows a usability improvement? Separate a design goal from an observed result.

Do not assume React, a framework, an accessibility certification, or user-study results.

## Data or ML

Ask about evaluation before repeating a quality claim:

- What data could be used, and what consent/access boundaries applied?
- What baseline and evaluation split made the result meaningful?
- How did the work avoid leakage or contamination?
- What were the important failure cases and their cost?
- What uncertainty or distribution change remains?
- Which metric, test set, human assessment, or operational observation supports the claim?

Do not infer a model, dataset, numerical gain, or production deployment.

## Refresh interview

Compare with the approved current case study:

- What changed in the implementation, role, state, evidence, or disclosure permission?
- Does any old claim need qualification or removal?
- Did a proposed next step actually ship?
- Are existing tags still supported?

Review the full resulting public draft again. A previous approval does not cover new facts.

## Private ledger format

Keep outside the repository or in the conversation only:

| Public claim/tag | Supporting answer | Ownership | Evidence/limits | Disclosure action |
| --- | --- | --- | --- | --- |
| Exact proposed wording | Brief source reference | Personal/team | Measured/qualitative/unmeasured | Permit/generalize/omit/ask |

## Completion checks

- Every factual claim and tag traces to an answer; no demo is represented as real.
- A reader can identify problem, role, status, and highlights before expanding details.
- At least one specific choice, rejected alternative, and tradeoff is accurate.
- Each result includes its evidence basis; uncertainty and limitations remain visible.
- Exact public text/tags/visuals were approved before canonical import.
- Generated site and README agree; private review material never entered the repository.
- Publishing is still inactive.
