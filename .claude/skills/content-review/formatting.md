# Formatting and Punctuation

Standardized formatting rules for consistency across all OktaDev blog posts.

---

## Headings

- ❌ Use **Chicago title case** for the title of the post.
- ❌ Use **sentence case** for all headings within the post — NOT title case.
  - Correct: "How to build a login form"
  - Incorrect: "How to Build a Login Form"
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
