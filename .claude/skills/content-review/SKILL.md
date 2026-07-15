---
name: content-review
description: "Review OktaDev blog posts against editorial standards, style guidelines, SEO, and front matter validation. Use when: after drafting a post, before submitting for review, checking compliance with brand voice and formatting rules."
---

# Content Review

Review content for compliance with the OktaDev Blog editorial and style guidelines.

## How to Use

The user will provide content (pasted text, a Google Doc link, a file path, or a URL). Review it against every guideline below and produce a structured compliance report.

**Before running the review, prompt the user:**
> "How would you like the review delivered?
> 1. Create a report doc
> 2. Add review to existing doc (via comments)"

Wait for the user's response before proceeding.

---

### Output option 1 — Create a report doc (new Google Doc)

- Create a new Google Doc named `[BA-REVIEW] ` followed by the title of the document being reviewed (e.g., `[BA-REVIEW] Build secure agent-to-app connections with XAA`)
- Write the full compliance report into that doc using `batch_update_doc` with `end_of_segment: true` for each section
- Apply H1 for the report title, H2 for each section heading; highlight [MUST FIX] labels in bold red
- Share the link to the new doc with the user when done

### Output option 2 — Add review to existing doc (via comments)

- The content must be a Google Doc (if it isn't, inform the user that comments require a Google Doc and fall back to option 1)
- For each finding, add an **inline comment** to the Google Doc at the exact offending text using `createConfluenceInlineComment` or `manage_document_comment` — attach the comment to the specific passage that violates a rule
- Comment format: `[MUST FIX / SHOULD FIX / SUGGESTION] <rule violated> — <suggested fix>`
- For findings that span a section (e.g., "no front matter present"), add a footer comment summarizing those section-level findings instead
- At the end, post a single **footer comment** on the document with the overall result summary: pass/fail, issue counts (❌ / ⚠️ / 💡), and top priorities

---

## Report Format

- Group findings by section (Editorial Standards, Writing Principles, Voice & Tone, Formatting, SEO, Front Matter, etc.)
- For each finding: quote the offending text, state the rule it violates, and suggest a fix
- At the end, give an overall pass/fail and a count of issues by severity: ❌ Must Fix / ⚠️ Should Fix / 💡 Suggestion

If the content passes a section cleanly, state "✅ No issues found" for that section — don't skip it.

---

## Guideline Files

Each guideline category is documented separately for focused review:

1. **[Editorial Standards](./editorial-standards.md)** — Content quality, tutorials, visual breaks, image rights
2. **[Writing Principles](./writing-principles.md)** — Conciseness, consistency, clarity, considerateness
3. **[Voice, Tone, and Tense](./voice-tone-tense.md)** — Active voice, tone, tense, banned words
4. **[Formatting and Punctuation](./formatting.md)** — Headings, dashes, Oxford comma, caps, list punctuation
5. **[SEO](./seo.md)** — Title optimization, keyword placement, description length
6. **[Front Matter Validation](./front-matter.md)** — Required metadata fields for blog posts

---

## Rule Precedence

In case of conflicts, rules are prioritized in this order:

1. **Editorial Standards** (PRIMARY — rules here override all others)
2. **Formatting and Punctuation**
3. **Writing Principles**
4. **Voice, Tone, and Tense**
5. **SEO**
6. **Front Matter Validation**
| `canonical` | Required if syndicated or multiple URLs point to this article. |

- ❌ Flag any missing required fields.
- ❌ If content materially changes guidance or tutorial instructions, a `changelog` entry is required.

---

## Section 7 — Markup Guidelines

### Images
- ❌ Use the **custom Jekyll image macro**, not standard markdown or asciidoc syntax:
  ```
  {% img blog/<post-images-dir>/<image-file-name> alt:"<alt text>" width:"800" %}{: .center-image }
  ```
- ❌ All images must have the CSS class `center-image`.
- ❌ Alt text is required. Never start with "Image of" or "Diagram of."
- ❌ If the image is decorative, use null alt text `" "`.
- ❌ Images must be **JPG format**, max **1800px wide**, max **500KB**.

### Code Blocks
- ❌ Tag every code block with a **valid Rouge language identifier**. Flag untagged blocks.
- ❌ Do not use these invalid language tags: `text`, `txt`, `cshtml`, `razor`, `csv`, `dotenv`, `env`, `gql`, `markup`.
  - Use `html` instead of `cshtml`/`razor`
  - Use `csvs` instead of `csv`
  - Use `properties` instead of `dotenv`/`env`
  - Use `graphql` instead of `gql`
  - Use `xml` instead of `markup`
- ❌ Prefer **code blocks over inline code** for multiple instructions.
- ❌ If code contains `{{ }}`, wrap the block in `{% raw %}` / `{% endraw %}` tags.

### Custom Jekyll Tags
- ❌ Always use the **Okta CLI embed** plugin for Okta account creation instructions — not manual steps.
- 💡 Use Twitter plugin for embedded tweets.
- 💡 Use Github Gist plugin for embedded code snippets.
- 💡 Use Youtube plugin for embedded videos.
- 💡 Use Speakerdeck plugin for embedded slide decks.

### File and Folder Names
- ❌ All file and folder names must be **lowercase with hyphen-separated words**.

---

## Section 8 — Image and Diagram Guidelines

### General
- ❌ Prefer **JPG** over PNG or GIF.
- ❌ Max width: 1800px. Max file size: 500KB.

### Diagrams
- ❌ **White backgrounds only**. No color backgrounds, no transparent backgrounds.
- ❌ **No drop shadows**.
- ❌ **No borders** in diagrams.
- ❌ Do not put titles, descriptions, or captions inside the diagram — use surrounding content text instead.
- ⚠️ Prefer **Canva** (Okta Enterprise account) or **Mermaid** for diagrams.
- ⚠️ Follow Okta Brand color guidelines. Use primary and secondary brand palettes.
- ⚠️ Text in diagrams should use **Aeonik Pro** (Okta primary typeface).

### Author Photos (if reviewing author content)
- ❌ Must be in color, head and shoulders only, max 500×500px, max 40KB.
- ❌ File must be named `avatar-<name>.jpg`.

---

## Section 9 — Content Update Rules

- ❌ If content materially changes guidance or tutorial instructions → **update the article** and add a changelog entry.
- ❌ If the technology or standards are superseded → **write a new article**. Do not just update the old one.
  - New article must reference which old article it supersedes.
  - Old article must have a note at the top pointing to the new article.
  - Do NOT add a changelog entry to the old article.

---

## Severity Key

| Symbol | Meaning |
|--------|---------|
| ❌ Must Fix | Direct violation of a documented rule — blocks publication |
| ⚠️ Should Fix | Strong recommendation — affects quality, SEO, or accessibility |
| 💡 Suggestion | Best practice or improvement opportunity |
