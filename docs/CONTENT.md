# Public content contract

The canonical source is `content/projects/<slug>.json`. The actual validator is `scripts/model.mjs`; it rejects unknown fields instead of silently publishing them. Use the synthetic fixtures as complete examples, not as facts about the owner.

## Required fields

| Field | Type | Meaning |
| --- | --- | --- |
| `slug` | lowercase kebab-case string | Stable URL and filename; change only with a redirect plan |
| `kind` | `case-study` or `synthetic-demo` | All examples must use `synthetic-demo` |
| `visibility` | `public-approved` | Assertion that the user approved the exact sanitized content |
| `title`, `summary` | strings | Approved title and short description |
| `role`, `status`, `period` | strings | Accurate ownership, delivery state, and safe context |
| `accent` | `teal`, `violet`, or `amber` | Shared theme accent |
| `technologies`, `topics` | 1–8 strings each | Supported tools and engineering topics, not proficiency levels |
| `highlights` | 2–3 strings | Strongest supported takeaways |
| `problem`, `constraints`, `contribution`, `lessons` | 1–12 strings each | Paragraphs/bullets for each section |
| `decisions` | 1–8 objects | Each has `title`, `choice`, `alternative`, `tradeoff` |
| `results` | 1–8 objects | Each has `claim` and a public-safe `basis` |
| `limitations`, `nextSteps` | 0–12 strings each | Qualification and future work |
| `diagram` | object or `null` | Optional approved high-level visual |

Every diagram needs `title`, `source`, `description`, and `legend` (1–8 strings). Sources support flowcharts and sequence diagrams. Use semantic colors, readable labels/shapes, and a legend. HTML labels, external URLs, clickable nodes, embedded resources, and configuration directives are rejected. Mermaid is rendered locally at build time using the pinned package/lockfile and installed Chrome. The GitHub Markdown export keeps the source in a `mermaid` fence; GitHub controls its own Mermaid version.

Text fields are plain text, not HTML or Markdown. The renderer escapes them for both targets. Put paragraphs in separate array items; do not paste a README into a field. Tags must use consistent spelling across projects; tag slug collisions fail validation.

## Approval is not a detector

`visibility: "public-approved"` does not prove permission, factual support, or privacy. The skill must obtain approval before adding this field and copying content into the repository. The small secret/email detector is a last check, not a confidentiality guarantee.

Do not add provenance, transcripts, internal URLs, review notes, draft claims, or restricted details under extra keys. Do not keep them in another file in this repository either. Save private review material only in a separate private workspace outside the repository, if the user requests retention.

Unknown outcomes are valid: state “Not yet measured” or explain the limited qualitative evidence in `basis`. Never invent a metric to fill the template. Clearly distinguish proposed, prototype, and production work in `status`.

## Add or update a project

1. Interview and draft outside the repository, or keep the draft in the current conversation.
2. Obtain explicit approval for the exact public content, tags, and diagram source/text equivalent.
3. Create `content/projects/<slug>.json` with only the allowed public fields.
4. Run `npm run check`; inspect `dist/` via `npm run preview`.
5. Review the generated Markdown, root index, profile snippet, case-study page, tags, diagram, and complete source file set.

Updating one JSON updates every presentation. Remove the canonical JSON and rebuild to remove its generated page, Markdown, and unused tag pages. The build replaces only marked generated directories; it never deletes the canonical content files.

For a new site, customize the config and remove/replace demo JSON only after deciding what to show. A collection may be empty. Do not reclassify synthetic examples as real projects.
