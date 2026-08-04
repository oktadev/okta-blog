---
name: content-review
description: "Review OktaDev blog posts against editorial standards, style guidelines, SEO, and front matter validation. Use when: after drafting a post, before submitting for review, checking compliance with brand voice and formatting rules."
---

# Content Review

Review content for compliance with the OktaDev Blog editorial and style guidelines.

## How to Use

The user will provide content (pasted text, a Google Doc link, or a file path). First, identify the content type from the input, then ask the user how they want the review delivered.

**If the content is a Google Doc, ask:**
> "How would you like the review delivered?
> 1. Create a new report doc
> 2. Add inline comments to your existing doc"

**If the content is a markdown file or pasted text, ask:**
> "How would you like the review delivered?
> 1. Show the report in the console
> 2. Save the report to a file"

Wait for the user's response before proceeding.

---

### Google Doc: Option 1 — New report doc

- Create a new Google Doc named `[BA-REVIEW] ` followed by the title of the document being reviewed (e.g., `[BA-REVIEW] Build secure agent-to-app connections with XAA`)
- Write the full compliance report into that doc using `batch_update_doc` with `end_of_segment: true` for each section
- Apply H1 for the report title, H2 for each section heading; highlight [MUST FIX] labels in bold red
- Share the link to the new doc with the user when done

### Google Doc: Option 2 — Inline comments on existing doc

- For each finding, add an **inline comment** to the Google Doc at the exact offending text using `manage_document_comment` — attach the comment to the specific passage that violates a rule
- Comment format: `[MUST FIX / SHOULD FIX / SUGGESTION] <rule violated> — <suggested fix>`
- For findings that span a section (e.g., "no front matter present"), add a footer comment summarizing those section-level findings instead
- At the end, post a single **footer comment** with the overall result summary: pass/fail, issue counts (❌ / ⚠️ / 💡), and top priorities

### Markdown: Option 1 — Console report

- Print the full compliance report to the console using the Report Format below

### Markdown: Option 2 — Save to file

- Save the full compliance report to a file named `<post-filename>-review.md` in the same directory as the post
- Confirm the file path to the user when done

---

## Report Format

- Group findings by section (Editorial Standards, Writing Principles, Voice & Tone, Formatting, SEO, Front Matter, etc.)
- For each finding: quote the offending text, state the rule it violates, and suggest a fix
- At the end, give an overall pass/fail and a count of issues by severity: ❌ Must Fix / ⚠️ Should Fix / 💡 Suggestion

If the content passes a section cleanly, state "✅ No issues found" for that section — don't skip it.

---

## Guideline Files

Each guideline category is documented separately for focused review:

1. **[Editorial Standards](./editorial-standards.md)** — Content quality, tutorials, image markup, diagram guidelines, legal, content updates
2. **[Writing Principles](./writing-principles.md)** — Conciseness, consistency, clarity, considerateness
3. **[Voice, Tone, and Tense](./voice-tone-tense.md)** — Active voice, tone, tense, banned words
4. **[Formatting and Punctuation](./formatting.md)** — Headings, dashes, punctuation, code blocks, Jekyll tags, file names
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

---

## Severity Key

| Symbol | Meaning |
|--------|---------|
| ❌ Must Fix | Direct violation of a documented rule — blocks publication |
| ⚠️ Should Fix | Strong recommendation — affects quality, SEO, or accessibility |
| 💡 Suggestion | Best practice or improvement opportunity |
