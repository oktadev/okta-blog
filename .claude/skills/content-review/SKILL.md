---
name: content-review
description: "Review OktaDev blog posts against editorial standards, style guidelines, SEO, and front matter validation. Use when: after drafting a post, before submitting for review, checking brand voice and formatting."
---

# Content Review

Review content against the OktaDev Blog editorial and style guidelines.

## The Goal: Reducing Reader Friction

Every rule in these guidelines exists to reduce friction for the reader. That is the goal.
The rules are means to it. When a rule works against the reader, the reader wins.

**"The reader" is not one person reading one post.** Developers solving a real problem read
several posts by different authors — a frontend tutorial, a backend one, a concepts explainer —
and stitch them into something that fits their use case. Friction accumulates along that path.
A convention that looks arbitrary inside a single post is often what lets someone on their
third post skip re-learning something they already know.

Before reporting a finding, ask: **does acting on this reduce friction for the reader — in this
post, or across the ones they'll read next?** If not, drop it — or report it as a consideration
and name the tradeoff so the author can decide.

- **Task flow beats categorization.** Sequence instructions by where the reader physically is:
  the same Admin Console page, the same file, the same terminal session. A step may sit under
  a heading that doesn't topically describe it. Never propose a reorder that sends a reader
  back to a screen they already left.
- **Verbatim beats tidy.** Text quoted from a product interface stays exactly as the product
  renders it — see [UI labels and product text](./formatting.md#ui-labels-and-product-text).
- **Format sets length.** Hands-on tutorials run long. Word count is a consideration, never a
  defect on its own.
- **Don't point readers at something that doesn't exist.** Don't recommend a pattern, article,
  or architecture this blog can't link to. Advice a reader can't act on is friction, not help.
- **Cross-post consistency is a reader benefit, not bookkeeping.** Conventions like the Oxford
  comma, spaced en dashes, `{yourOktaDomain}` placeholders, root-relative `/blog/...` links, and
  the `setup/integrator.md` include exist so readers meet the same patterns everywhere. Don't
  wave off a consistency finding because the payoff isn't visible inside this one post — it
  accumulates, and it lands on the person reading their third.
- **Judge consistently.** Don't change a finding's severity between review rounds without
  saying what changed.

This is not license to skip work. A finding that genuinely helps a reader still gets reported,
even when acting on it is inconvenient. The test is the reader's experience — not the author's
convenience, and not the reviewer's.

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
- Write the full review into that doc using `batch_update_doc` with `end_of_segment: true` for each section
- Apply H1 for the report title, H2 for each section heading; highlight [MUST FIX] labels in bold red
- Share the link to the new doc with the user when done

### Google Doc: Option 2 — Inline comments on existing doc

- For each finding, add an **inline comment** to the Google Doc at the exact offending text using `manage_document_comment` — attach the comment to the specific passage that violates a rule
- Comment format: `[MUST FIX / SHOULD FIX / SUGGESTION] <rule violated> — <suggested fix>`
- For findings that span a section (e.g., "no front matter present"), add a footer comment summarizing those section-level findings instead
- At the end, post a single **footer comment** summarizing the issue counts (❌ / ⚠️ / 💡) and top priorities

### Markdown: Option 1 — Console report

- Print the full review to the console using the Report Format below

### Markdown: Option 2 — Save to file

- Save the full review to a file named `<post-filename>-review.md` in the same directory as the post
- Confirm the file path to the user when done

---

## Report Format

- Group findings by section (Editorial Standards, Writing Principles, Voice & Tone, Formatting, SEO, Front Matter, etc.)
- For each finding: quote the offending text, state the rule it violates, and suggest a fix
- At the end, give a count of issues by severity: ❌ Must Fix / ⚠️ Should Fix / 💡 Suggestion

Don't grade the post. No pass/fail verdict — the job is to surface what needs attention, not
to certify compliance.

Don't report issues with no reader impact that tooling already handles: trailing whitespace,
blank-line counts, or anything `.editorconfig`, `npm run clean-post`, or Prettier normalizes.
Do report formatting that breaks rendering or fails the build — unwrapped `{{ }}`, curly
quotes, invalid code-fence languages, absolute blog links.

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

0. **Reader friction** (see [The Goal](#the-goal-reducing-reader-friction)) — overrides every rule below
1. **Editorial Standards** (PRIMARY — rules here override all others below)
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
