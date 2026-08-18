---
applyTo: "_posts/**/*.md,_source/_posts/**/*.md"
---

# Content Review Guidelines

Review OktaDev blog posts against editorial standards, style guidelines, SEO, and front matter validation.

For each finding: quote the offending text, state the rule it violates, and suggest a fix. At the end, give an overall pass/fail and a count of issues by severity.

## Severity Key

| Symbol | Meaning |
|--------|---------|
| ❌ Must Fix | Direct violation of a documented rule — blocks publication |
| ⚠️ Should Fix | Strong recommendation — affects quality, SEO, or accessibility |
| 💡 Suggestion | Best practice or improvement opportunity |

## Rule Precedence

In case of conflicts, rules are prioritized in this order:

1. **Editorial Standards** (PRIMARY — rules here override all others)
2. **Formatting and Punctuation**
3. **Writing Principles**
4. **Voice, Tone, and Tense**
5. **SEO**
6. **Front Matter Validation**

---

## 1. Editorial Standards

These are the primary editorial standards for OktaDev blog content. When conflicts arise with other guidelines, these rules take precedence.

### Content Quality

- ❌ Post should be around **1,000–1,500 words** (not counting code). Flag if significantly under or over.
- ❌ Post must be written **for developers** — not a general audience or marketing audience.
- ⚠️ Content must be **clear, insightful, and fun to read**. Flag dry, jargon-heavy, or confusing passages.
- ❌ Content must be **valuable, relevant, and actionable** — it should help developers do their job better, learn something new, or approach a problem differently.
- ❌ Claims and arguments must be **spell-checked and fact-checked**. Sources must be cited and linked.
- ⚠️ Posts should gently **encourage sign-up for Okta Integrator Free Plan** without being obnoxiously self-promotional. Flag any passages that feel like hard selling.
- ❌ Post must focus on **one topic or goal**. Flag if the scope is too broad or unfocused.
- ❌ Content should define acronyms and abbreviations before using them. Our blog audience includes all experience levels and global distribution. We can't assume our readers know and understand all acronyms.
- ❌ Always verify user has run their content through Grammarly.

### Code Tutorials (if applicable)

- ❌ Tell the reader **why the post is valuable up front**.
- ❌ **Preface all tools and technologies** required (e.g. Okta account, AWS account, API key and secret).
- ⚠️ **Be careful with "first," "last," and "finally"** — these can confuse readers who are partway through. Flag any awkward use.
- ⚠️ Add **checkpoints** throughout the tutorial so readers can verify they are on the right track before moving to the next step.

### Post Footer

- ❌ Every post must end with a CTA. Include: links to related OktaDev posts, links to OktaDev Twitter and YouTube, and a prompt for reader engagement.

### Visual Breaks

- ⚠️ Aim for a **visual break (image, diagram, code block, embedded tweet, etc.) at least once every 300 words**. Flag long stretches of unbroken text.

### Image Rights

- ❌ Any photos included must be **free for commercial use**. Attribution-licensed images are acceptable as long as the image is attributed. Flag any image that appears to be used without a clear license.

### Legal and Privacy

- ❌ Avoid direct references to commercial products in titles and section headers.
- ⚠️ Flag any content references to commercial products (movies, books, TV shows for example) that go beyond relevant analogies and storytelling. We want to ensure we don't cross a line into licensing issues.
- ❌ Flag any content references to commercial products that aren't safe for work and professional use. Avoid references to commercial products that are insensitive or inappropriate so the user can replace them.
- ❌ Flag any user names based on commercial products (movies, books, TV shows for example). Example users should be made up or taken from demo user sources, such as from JSON Placeholder.
- ❌ Avoid mentioning Okta customers as it requires strict legal sign off.
- ⚠️ Flag any mentions of Okta employees as they require consent.
- ❌ Flag any PII or data disclosure concerns.

### Okta Product Terms

- ❌ Align Okta product terms with InfoDev's terminology.
  - Correct: "Okta Admin Console"
  - Incorrect: "Admin dashboard"
  - Correct: "Okta Integrator Free Plan"
  - Incorrect: "Okta Dev Account"

### Image Markup

- ❌ Use the **custom Jekyll image macro**, not standard markdown or asciidoc syntax:
  ```
  {% img blog/<post-images-dir>/<image-file-name> alt:"<alt text>" width:"800" %}{: .center-image }
  ```
- ❌ All images must have the CSS class `center-image`.
- ❌ Alt text is required. Never start with "Image of" or "Diagram of."
- ❌ If the image is decorative, use null alt text `" "`.
- ❌ Images must be **JPG format**, min **800px wide** (1600px optimal), max **1800px wide**, max **500KB**. Check the image format, not just the file extension.

### Image and Diagram Guidelines

**General**
- ❌ Prefer **JPG** over GIF, unless it's an animated GIF. Avoid PNG. Always check the file format, not just the file extension.
- ⚠️ Prefer **SVG** for mermaid diagrams.
- ❌ Min width: 800px (1600px optimal). Max width: 1800px. Max file size: 500KB.

**Diagrams**
- ❌ **No drop shadows**.
- ❌ **No borders** in diagrams.
- ❌ Do not put titles, descriptions, or captions inside the diagram — use surrounding content text instead.
- ⚠️ Prefer **Mermaid** for diagrams and add the diagram in SVG format.

**Author Photos (if reviewing author content)**
- ❌ Must be in color, head and shoulders only, max 500×500px, max 40KB.
- ❌ File must be named `avatar-<name>.jpg`.

### Content Update Rules

- ❌ If content materially changes guidance or tutorial instructions → **update the article** and add a changelog entry.
- ❌ If the technology or standards are superseded → **write a new article**. Do not just update the old one.
  - New article must reference which old article it supersedes.
  - Old article must have a note at the top pointing to the new article.
  - Do NOT add a changelog entry to the old article.

---

## 2. Formatting and Punctuation

Standardized formatting rules for consistency across all OktaDev blog posts.

### Headings

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
- ⚠️ Avoid headers with "Steps" in the text, such as "Step 1: do X." Prefer semantic headers that provide content and overall clarity while reinforcing keywords for SEO.

### Dashes

- ❌ Use **en dashes with spaces** on both sides ( – ) for parenthetical phrases. Not em dashes (—), not plain hyphens (-).
  - Correct: "This is a point – and this is extra context – for clarity."
  - Incorrect: "This is a point—and this is extra context—for clarity."
  - Incorrect: "This is a point - and this is extra context - for clarity."

### Oxford Comma

- ❌ Always use the **Oxford comma** in lists of three or more items.
  - Correct: "red, white, and blue"
  - Incorrect: "red, white and blue"

### ALL CAPS

- ❌ Do **not** use ALL CAPS for emphasis. Use italics, bold, or `code` instead.
- ✅ ALL CAPS is acceptable only for:
  - Technical terms (API, URL, HTML, etc.)
  - Constants idiomatic to the programming language (e.g. `OKTA_APPLICATION_HREF`)
  - Proper nouns

### List Punctuation

- ❌ Do **not** add periods at the end of list items unless the item is two or more sentences.
- ✅ If a list item runs to two sentences, a period is required at the end.

### Exclamation Points

- ❌ Don't overdo it with the exclamation points. Flag any places where there are multiple exclamation points on one sentence, or any places where there are many sentences with exclamation points in a row.

### Smart Punctuation and Special Characters

- ❌ **Curly/smart quotes** (`"` `"` `'` `'`) are not valid markdown. All quotes must be straight (`"` `'`). Their presence is a telltale sign content was pasted from Google Docs without smart quotes disabled.
- ❌ **Smart ellipsis** (`…`) must be replaced with three plain periods (`...`).
- When either is found, remind the user to fix their Google Docs settings before re-pasting: **Tools → Preferences → uncheck "Use smart quotes"**.
- 💡 Remind the user to run `markdownlint` locally and resolve all linting errors before pushing — curly quotes, smart ellipses, and malformed internal blog links will cause the prepush check to fail.

### Code Blocks

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

### Custom Jekyll Tags

- ❌ Always use the **integrator.md** plugin for Okta account creation instructions — not manual steps.
- 💡 Use Twitter plugin for embedded tweets.
- 💡 Use Github Gist plugin for embedded code snippets.
- 💡 Use Youtube plugin for embedded videos.
- 💡 Use Speakerdeck plugin for embedded slide decks.
- ⚠️ Urge the user to add the TOC plugin for generating a table of contents when a post exceeds 300 words.

### File and Folder Names

- ❌ All file and folder names must be **lowercase with hyphen-separated words**.

---

## 3. Writing Principles

Core principles that guide all writing on the OktaDev blog.

### Be Concise

- ❌ Keep words and sentences short and to the point.

### Be Consistent

- ❌ Use standard definitions of words, not Okta-specific ones, unless defined first.
- ❌ Write in **American English**. Flag British spellings (e.g. "colour", "centre", "realise").

### Be Clear

- ❌ Avoid double negatives for exceptions.
  - Correct: "You can continue without a path."
  - Incorrect: "A missing path won't prevent you from continuing."
- ❌ Expand **acronyms and abbreviations** on first use. Flag any that are not defined on first use.

### Be Considerate

- ❌ Avoid referencing age or disability unless directly relevant.
- ❌ Avoid gendered language. Use singular **"they"** for anonymous users and administrators.
- ❌ Avoid charged terms: **blacklist, whitelist, master, slave, native**. Flag any usage.
- ❌ Avoid using terms such as **"simple"**, **"easy"**, **"just"** for skill and experience inclusivity.
- ❌ Avoid implying someone should have knowledge or experience in a topic or area. Always link to a reference so readers can get up to speed.
- 💡 Encourage the user to use the "AlexJS Linter" and "Write Good linter" VS Code extensions to catch insensitive phrasing.

### Be Current

- ⚠️ Content should reflect best practices at the time of writing.
- 💡 Add a changelog entry if content materially changes guidance or tutorial instructions.

---

## 4. Voice, Tone, and Tense

### Active Voice

- ❌ Use active voice throughout. Flag all passive voice.
  - Correct: "Pass the username as a parameter to SignIn()."
  - Incorrect: "The username is passed as a parameter to SignIn()."
- ⚠️ Scan for passive voice. If excessive (5+ occurrences), remind the user to run Grammarly.

### Tone

- ✅ Use a **relaxed, conversational tone** — like co-workers talking, not a lecture.
- ✅ **Prefer contractions**: aren't, can't, isn't, we're, won't, it's, etc.
- ❌ Do **not** write negatively about non-Okta solutions.

### Tense

- ❌ Use **present tense** throughout. Flag future tense constructions.
  - Correct: "On success, the call returns a JSON object."
  - Incorrect: "On success, the call will return a JSON object."
- 💡 Past tense is only acceptable when describing something that happened before the current task.

---

## 5. SEO

Search engine optimization guidelines to improve discoverability and organic traffic.

- ⚠️ The article title should be SEO-optimized. Suggest using Google Keyword Planner and Headline Analyzer tools.
- ⚠️ Keywords should be incorporated into H2 and H3 headings where natural. Doing so also can help with clarity. For example:
  - Correct: "Configure Okta for your OIDC Spring Boot app"
  - Incorrect: "Configure Okta"
  - Correct: "Learn more about authentication, OpenID Connect (OIDC), and Spring Security"
  - Incorrect: "Additional resources"
- ⚠️ Description (front matter) should be **150 characters or less** and summarize the article for search engines.

---

## 6. Front Matter Validation

For blog post files, check for the following required fields:

| Field | Rule |
|-------|------|
| `layout` | Must be `blog_post` |
| `title` | Required. Chicago title case. |
| `author` | Required. Must match an author slug. |
| `by` | Required. Must be `advocate`, `contractor`, or from the predefined list. |
| `description` | Required. 150 characters or less. This displays in previews. |
| `communities` | Required. Must be from the predefined list. |
| `tags` | Required. Any relevant tags. |
| `type` | Required. Must be `awareness` or `conversion`. |
| `image` | Required if a banner image exists. |
| `tweets` | Optional and currently unused |
| `github` | Required if the article includes a code example repo. |
| `changelog` | Required if this content is a material change to an existing post, otherwise do not include this front matter. |
| `canonical` | Required if syndicated or multiple URLs point to this article. |

### Tags

- ❌ Flag any new tags. Tags feed into a tag view of related posts. There is no value to a tag only being used in one post. A new tag could establish a precedent for upcoming related posts, but if the user isn't aware of upcoming posts using a new tag, they shouldn't use them.
