# Formatting and Punctuation

Standardized formatting rules for consistency across all OktaDev blog posts.

---

## UI labels and product text

> **Read this before applying any rule below to bolded text.**

Text quoted from a product interface — button labels, tab names, checkbox labels, field
names, navigation paths — is **quoted material, not prose**. Reproduce it exactly as the
product renders it, and bold it so readers can match it against their screen.

The editorial rules in this file and in [Writing Principles](./writing-principles.md) do
**not** apply inside a UI label:

- ❌ Do not expand an acronym that appears only as a UI label. A reader has to find **CORS**
  on screen; rendering it "Cross-Origin Resource Sharing (CORS)" makes that harder, and the
  term never appears in your prose anyway.
- ❌ Do not re-case a label to satisfy sentence-case or title-case rules. If the product says
  **Okta API Scopes**, **Proof of possession**, **Applications and Resources**, or
  **Add person**, write each exactly that way — even though the casing is inconsistent
  between them. It's inconsistent in the product.
- ❌ Do not correct a label's wording, punctuation, or capitalization for style. ALL CAPS,
  odd spacing, and missing articles all stay.
- If a label uses a term the guidelines otherwise avoid, quote the label as-is and use
  preferred terminology in your own prose around it.

**Why:** the goal is reducing reader friction, not formatting consistency. A reader working
through setup steps is pattern-matching your text against pixels on their screen. Every
edit that makes the text tidier and less literal costs them time and confidence — and a
label they can't find reads as a broken tutorial, not a style choice.

Mark UI elements with bold and show navigation with `>`:

> Navigate to **Security** > **API** > **Trusted Origins** and activate the **CORS** checkbox.

If a label needs explanation, explain it in the surrounding prose rather than altering the
label.

**When reviewing:** bolded text naming something clickable or visible in a product is a UI
label. Confirm that before flagging an acronym, a casing choice, or an ALL CAPS term.

---

## Headings

> **Title vs. headings use DIFFERENT casing rules — do not apply the same rule to both.**

- ❌ The **post title** (`title:` in front matter) MUST use **Chicago title case** — capitalize the first and last words, all major words, and any word that is not an article, preposition, or coordinating conjunction.
  - Correct: "Develop a XAA-Enabled Resource Application and Test with Okta"
  - Incorrect (sentence case): "Develop a XAA-enabled resource application and test with Okta"
- ❌ **All headings within the post body** (H2, H3, etc.) MUST use **sentence case** — capitalize only the first word and proper nouns. Do NOT use title case for in-body headings.
  - Correct: "How to build a login form"
  - Incorrect (title case): "How to Build a Login Form"
- ❌ Use **expressive punctuation (? or !)** in headings where appropriate, but **no periods** at the end of headings.
- ❌ Do not skip heading levels. An `<h3>` must only appear under an `<h2>`.
- ❌ Do not add an `<h1>` — the blog title becomes the h1 automatically.
- ⚠️ Incorporate keywords into H2 and H3 headings to improve SEO.
- ⚠️ Avoid headers with "Steps" in the text, such as "Step 1: do X." Prefer semantic headers that provide content and overall clarity while reinforce keywords for SEO.

---

## Dashes

- ❌ Use **en dashes with spaces** on both sides ( – ) for parenthetical phrases. Not em dashes (—), not plain hyphens (-).
  - Correct: "This is a point – and this is extra context – for clarity."
  - Incorrect: "This is a point—and this is extra context—for clarity."
  - Incorrect: "This is a point - and this is extra context - for clarity."

---

## Oxford Comma

- ❌ Always use the **Oxford comma** in lists of three or more items.
  - Correct: "red, white, and blue"
  - Incorrect: "red, white and blue"

---

## ALL CAPS

- ❌ Do **not** use ALL CAPS for emphasis. Use italics, bold, or `code` instead.
- ✅ ALL CAPS is acceptable only for:
  - Technical terms (API, URL, HTML, etc.)
  - Constants idiomatic to the programming language (e.g. `OKTA_APPLICATION_HREF`)
  - Proper nouns
  - Text quoted verbatim from a UI label — see [UI labels and product text](#ui-labels-and-product-text)

---

## List Punctuation

- ❌ Do **not** add periods at the end of list items unless the item is two or more sentences.
- ✅ If a list item runs to two sentences, a period is required at the end.

---

## Exclamation points!!!

- ❌ Don't overdo it with the exclamation points!!! Flag any places where there are multiple exclamation points on one sentence. Or any places where there many sentences with exclamation points in a row.

---

## Smart Punctuation and Special Characters

- ❌ **Curly/smart quotes** (`"` `"` `'` `'`) are not valid markdown. All quotes must be straight (`"` `'`). Their presence is a telltale sign content was pasted from Google Docs without smart quotes disabled.
- ❌ **Smart ellipsis** (`…`) must be replaced with three plain periods (`...`).
- When either is found, remind the user to fix their Google Docs settings before re-pasting: **Tools → Preferences → uncheck "Use smart quotes"**.
- 💡 Remind the user to run `markdownlint` locally and resolve all linting errors before pushing — curly quotes, smart ellipses, and malformed internal blog links will cause the prepush check to fail.

---

## Code Blocks

- ❌ Tag every code block with a **valid Rouge language identifier**. Flag untagged blocks.
- ❌ Do not use these invalid language tags: `text`, `txt`, `cshtml`, `razor`, `csv`, `dotenv`, `env`, `gql`, `markup`.
  - Use `html` instead of `cshtml`/`razor`
  - Use `csvs` instead of `csv`
  - Use `properties` instead of `dotenv`/`env`
  - Use `graphql` instead of `gql`
  - Use `xml` instead of `markup`
  - If you see invalid language tags, remind the user to build locally and inspect the rendered content to verify syntax highlighting.
- ❌ Prefer **code blocks over inline code** for multiple instructions.
- ❌ If code contains `{{ }}`, wrap the block in `{% raw %}` / `{% endraw %}` tags.

---

## Custom Jekyll Tags

- ❌ Always use the **integrator.md** plugin for Okta account creation instructions — not manual steps.
- 💡 Use Twitter plugin for embedded tweets.
- 💡 Use Github Gist plugin for embedded code snippets.
- 💡 Use Youtube plugin for embedded videos.
- 💡 Use Speakerdeck plugin for embedded slide decks.
- ⚠️ Urge the user to add the TOC plugin for generating a table of contents when a post exceeds 300 words.

---

## File and Folder Names

- ❌ All file and folder names must be **lowercase with hyphen-separated words**.
