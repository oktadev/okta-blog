---
applyTo: "_posts/**/*.md,_source/_posts/**/*.md"
---

# Content Review Guidelines

Review OktaDev blog posts against editorial standards, style guidelines, SEO, and front matter validation.

For each finding: quote the offending text, state the rule it violates, and suggest a fix. Order findings by impact. Give a count of issues by severity.

Don't grade the post. No pass/fail verdict — the job is to surface what needs attention, not to certify compliance.

Don't report issues with no reader impact that tooling already handles: trailing whitespace, blank-line counts, or anything `.editorconfig`, `npm run clean-post`, or Prettier normalizes. This repo's `.editorconfig` sets `trim_trailing_whitespace = false` for Markdown on purpose, and `scripts/markdown-lint.js` does not check whitespace. Do report formatting that breaks rendering or fails the build — unwrapped `{{ }}`, curly quotes, invalid code-fence languages, absolute blog links.

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
  renders it — see [UI labels and product text](#ui-labels-and-product-text).
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

## Severity Key

| Symbol | Meaning |
|--------|---------|
| ❌ Must Fix | Direct violation of a documented rule — blocks publication |
| ⚠️ Should Fix | Strong recommendation — affects quality, SEO, or accessibility |
| 💡 Suggestion | Best practice or improvement opportunity |

## Rule Precedence

In case of conflicts, rules are prioritized in this order:

0. **Reader friction** (see [The Goal](#the-goal-reducing-reader-friction)) — overrides every rule below
1. **Editorial Standards** (PRIMARY — rules here override all others below)
2. **Formatting and Punctuation**
3. **Writing Principles**
4. **Voice, Tone, and Tense**
5. **SEO**
6. **Front Matter Validation**

## 1. Editorial Standards

These are the primary editorial standards for OktaDev blog content. When conflicts arise with other guidelines, these rules take precedence.

### Content Quality

- ⚠️ Post should be around **1,000–1,500 words** (not counting code). Flag if significantly under or over.
- ❌ Post must be written **for developers** — not a general audience or marketing audience.
- ⚠️ Content must be **clear, insightful, and fun to read**. Flag dry, jargon-heavy, or confusing passages.
- ❌ Content must be **valuable, relevant, and actionable** — it should help developers do their job better, learn something new, or approach a problem differently.
- ❌ Claims and arguments must be **spell-checked and fact-checked**. Sources must be cited and linked.
- ⚠️ Posts should gently **encourage sign-up for Okta Integrator Free Plan** without being obnoxiously self-promotional. Flag any passages that feel like hard selling.
- ❌ Post must focus on **one topic or goal**. Flag if the scope is too broad or unfocused.
- ❌ Content should define acronyms and abbreviations before using them. Our blog audience include all experience levels and global distribution. We can't assume our readers know and understand all acronyms. Two exceptions apply — everyday developer tooling terms and UI labels. See [Be Clear](#3-writing-principles).
- ❌ Always verify user has run their content through Grammarly.

### Code Tutorials (if applicable)

- ❌ Tell the reader **why the post is valuable up front**.
- ❌ **Preface all tools and technologies** required (e.g. Okta account, AWS account, API key and secret).
- ⚠️ **Be careful with "first," "last," and "finally"** — these can confuse readers who are partway through. Flag any awkward use.
- ⚠️ Add **checkpoints** throughout the tutorial so readers can verify they are on the right track before moving to the next step.

### Post Footer

- ❌ Every post must end with a CTA. Include: links to related OktaDev posts, links to at least one OktaDev social media channel (such as LinkedIn, YouTube, X, or Bluesky), and a prompt for reader engagement.
- ❌ Don't flag a CTA for omitting a specific channel. Channels may change over time.

### Visual Breaks

- ⚠️ Aim for a **visual break at least once every 300 words**. Flag long stretches of unbroken prose.

Anything that interrupts a run of paragraphs counts as a visual break:

- **Headings** — H2 and H3. Breaking up text is what they're for.
- **Code blocks** and file-tree diagrams
- **Images and diagrams** — `{% img %}`
- **Lists** — bulleted or numbered
- **Tables**, blockquote notes, and HTML callout tables
- **Embedded content**, including every Jekyll include and shortcode:
  - `{% include toc.md %}` — table of contents
  - `{% excerpt %}` — cross-post promo card
  - `{% include setup/integrator.md %}` and the other `setup/` includes
  - `{% include integrator-org-warning.html %}`
  - `{% youtube %}`, embedded tweets, gists, Speakerdeck

A note on `setup/integrator.md`: it's text-dense, but it renders a numbered step list plus a
collapsible `<details>` block, so it does break up the page. Count it.

**When measuring:** count words of *prose only*, between breaks. Don't measure raw
paragraph-to-paragraph distance across a heading or an include and report it as unbroken
text — that produces false positives on sections that read fine. If the longest run comes
out inside the intro, that's usually expected rather than a defect.

### Image Rights

- ❌ Any photos included must be **free for commercial use**. Attribution-licensed images are acceptable as long as the image is attributed. Flag any image that appears to be used without a clear license.

### Legal and Privacy

- ❌ Avoid direct references to commercial entertainment properties (movies, books, TV shows, games, music) in titles and section headers.
  - This does **not** apply to the technologies, products, and SDKs the post teaches. "Okta Angular SDK," "Spring Boot," and "Tailwind" belong in titles and headings when they're the subject matter. Naming what a post is about is not a legal concern.
- ⚠️ Flag any content references to commercial products (movies, books, TV shows for example) that go beyond relevant analogies and storytelling. We want to ensure we don't cross a line into licensing issues.
- ❌ Flag any content references to commercial products that aren't safe for work and professional use. Avoid references to commercial products that are insensitive or inappropriate so the user can replace them.
- ❌ Flag any user names based on commercial products (movies, books, TV shows for example). Example users should be made up or taken from demo user sources, such as from JSON Placeholder.
- ❌ Avoid mentioning Okta customers as it requires strict legal sign off. 
- ⚠️ Flag any mentions of Okta employees as they require consent.
- ❌ Flag any PII or data disclosure concerns.

### Okta Product terms

- ❌ Align Okta product terms with InfoDev's terminology. What matters is using the right product name, not prefixing everything with "Okta."
  - Correct: "Admin Console" or "Okta Admin Console" — Okta developer docs use both
  - Incorrect: "Admin dashboard", "Okta dashboard", "developer console"
  - Correct: "Okta Integrator Free Plan"
  - Incorrect: "Okta Dev Account", "developer account"
- ❌ Don't flag a product term solely for omitting the "Okta" modifier when the name itself is right. "the Admin Console" is correct on its own.

### OAuth and Spec References

- ✅ Refer to **OAuth 2.1** in new content when the post advocates practices the upcoming spec reinforces: PKCE for authorization code flows, exact redirect URI matching, sender-constrained or single-use refresh tokens, and dropping the implicit and password grants. Sender-constraining mechanisms such as DPoP ([RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)) push in the same direction.
- ❌ Don't flag "OAuth 2.1" as a factual error because the spec is still an IETF draft. The guidance it consolidates is settled, and new content should reflect where the standard is heading.
- Use **OAuth 2.0** when referring to the published specification itself, or to a mechanism OAuth 2.1 leaves unchanged.
- ❌ Don't retroactively rewrite the titles of already-published posts that say "OAuth 2.0."

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

#### General
- ❌ Prefer **JPG** over GIF, unless it's an animated GIF. Avoid PNG. Always check the file format, not just the file extension.
- ⚠️ Prefer **SVG** for mermaid diagrams.
- ❌ Min width: 800px (1600px optimal). Max width: 1800px. Max file size: 500KB.

#### Okta Admin Console Screenshots
- ❌ Limit screenshots of the Okta Admin Console as much as possible. Use the `setup/integrator.md` include or written steps with bolded UI labels instead.
- ❌ Never recommend *adding* an Admin Console screenshot during review. The Admin Console UI changes, which silently invalidates screenshots and leaves posts describing a product that no longer looks that way. The `setup/integrator.md` include exists so setup instructions stay consistent and maintainable without them.
- ✅ To break up a long setup section, split it with headings rather than adding a screenshot.
- ✅ Screenshots of the reader's **own running application** are fine and expected — they show the reader what success looks like.

#### Diagrams
- ❌ **White backgrounds only**. No color backgrounds, no transparent backgrounds.
- ❌ **No drop shadows**.
- ❌ **No borders** in diagrams.
- ❌ Do not put titles, descriptions, or captions inside the diagram — use surrounding content text instead.
- ⚠️ Prefer **Mermaid** for diagrams and add the diagram in SVG format.

#### Social Images
- ❌ 1600x900 JPG at `blog/<post-slug>/social.jpg`, referenced by the `image:` front matter field. Under 400KB.
- ❌ Must be professional and safe for work.
- ✅ There is no required template or house layout. Illustrative, creative, and playful social images are all appropriate. Don't flag a social image for differing in style from other posts.
- ⚠️ The image should relate to what the post teaches.
- ❌ Respect image rights — see [Image Rights](#image-rights).
- ⚠️ Generated images shouldn't attempt to reproduce trademarked logos. AI-generated logos render inaccurately and raise trademark concerns. Add official logo assets separately if they're needed.

#### Author Photos (if reviewing author content)
- ❌ Must be in color, head and shoulders only, max 500×500px, max 40KB.
- ❌ File must be named `avatar-<name>.jpg`.

### Content Update Rules

- ❌ If content materially changes guidance or tutorial instructions → **update the article** and add a changelog entry.
- ❌ If the technology or standards are superseded → **write a new article**. Do not just update the old one.
  - New article must reference which old article it supersedes.
  - Old article must have a note at the top pointing to the new article.
  - Do NOT add a changelog entry to the old article.

## 2. Formatting and Punctuation

Standardized formatting rules for consistency across all OktaDev blog posts.

### UI labels and product text

> **Read this before applying any rule below to bolded text.**

Text quoted from a product interface — button labels, tab names, checkbox labels, field
names, navigation paths — is **quoted material, not prose**. Reproduce it exactly as the
product renders it, and bold it so readers can match it against their screen.

The editorial rules in this file and in [Writing Principles](#3-writing-principles) do
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
- ⚠️ Avoid headers with "Steps" in the text, such as "Step 1: do X." Prefer semantic headers that provide content and overall clarity while reinforce keywords for SEO.

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
  - Text quoted verbatim from a UI label — see [UI labels and product text](#ui-labels-and-product-text)

### List Punctuation

- ❌ Do **not** add periods at the end of list items unless the item is two or more sentences.
- ✅ If a list item runs to two sentences, a period is required at the end.

### Exclamation points!!!

- ❌ Don't overdo it with the exclamation points!!! Flag any places where there are multiple exclamation points on one sentence. Or any places where there many sentences with exclamation points in a row.

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
- 💡 Use GitHub Gist plugin for embedded code snippets.
- 💡 Use YouTube plugin for embedded videos.
- 💡 Use Speakerdeck plugin for embedded slide decks.
- ⚠️ Urge the user to add the TOC plugin for generating a table of contents when a post exceeds 300 words.

### File and Folder Names

- ❌ All file and folder names must be **lowercase with hyphen-separated words**.

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
  - Exception: acronyms appearing only inside a UI label (e.g. the **CORS** checkbox). Reproduce
    the label exactly and leave it unexpanded — see [UI labels and product text](#ui-labels-and-product-text).
  - Exception: acronyms a developer audience already knows. Don't expand IDE, API, URL, HTML, CSS,
    JSON, HTTP, CLI, SDK, npm, or similar everyday tooling terms — spelling them out adds noise
    without adding clarity. **Do** expand domain and specification acronyms: OIDC, DPoP, PKCE,
    SAML, JWT, SCIM, MFA, and CORS when used in prose rather than as a UI label.

### Be Considerate

- ❌ Avoid referencing age or disability unless directly relevant.
- ❌ Avoid gendered language. Use singular **"they"** for anonymous users and administrators.
- ❌ Avoid charged terms: **blacklist, whitelist, master, slave, native**. Flag any usage.
- ❌ Avoid using terms such as **"simple"**, **"easy"**, **"just"** for skill and experience inclusivity. 
- ❌ Avoid implying someone should have knowledge or experience in a topic or area. Always link to a reference so readers can get up to speed.
- 💡 Encourage the user to use the "AlexJS Linter" (https://marketplace.visualstudio.com/items?itemName=TLahmann.alex-linter) and "Write Good linter" (https://marketplace.visualstudio.com/items?itemName=travisthetechie.write-good-linter) to catch insensitive phrasing.

### Be Current

- ⚠️ Content should reflect best practices at the time of writing.
- 💡 Add a changelog entry if content materially changes guidance or tutorial instructions.

## 4. Voice, Tone, and Tense

---

### Active Voice

- ❌ Use active voice throughout. Flag all passive voice.
  - Correct: "Pass the username as a parameter to SignIn()."
  - Incorrect: "The username is passed as a parameter to SignIn()."
- ⚠️ Scan for passive voice. If excessive (let's say 5+ occurrences), remind the user to run Grammarly.

### Tone

- ✅ Use a **relaxed, conversational tone** — like co-workers talking, not a lecture.
- ✅ **Prefer contractions**: aren't, can't, isn't, we're, won't, it's, etc.
- ❌ Do **not** write negatively about non-Okta solutions.

### Tense

- ❌ Use **present tense** when describing how something behaves. Flag future-tense constructions there.
  - Correct: "On success, the call returns a JSON object."
  - Incorrect: "On success, the call will return a JSON object."
- ✅ This rule targets **descriptions of behavior**, not narration of the tutorial. Telling readers what they're about to do is correct and expected — don't flag it.
  - Fine: "In this post, we'll build a dashboard", "you'll add the guard next", "we'll get there"
  - Flag: "the call will return a JSON object", "the component will re-render when the signal changes"
- 💡 Past tense is only acceptable when describing something that happened before the current task.

## 5. SEO

Search engine optimization guidelines to improve discoverability and organic traffic.

- ⚠️ The article title should be **engaging first** and SEO-optimized second. A title that scans as brand boilerplate doesn't get clicked, no matter how many keywords it carries. Suggest using Google Keyword Planner and a headline analyzer.
  - 💡 Free headline analyzers such as https://www.monsterinsights.com/headline-analyzer/ are a good source to vet titles. Opt for higher values.
  - 💡 Analyzers reward roughly 55–60 characters and 6–10 words, and score higher when the title opens with a power or emotional word.
  - ❌ Analyzers also reward **"simple," "easy," and "effortless"** — all of which are banned for skill inclusivity (see [Writing Principles](#3-writing-principles)). Reach for alternatives that score as well without the problem: *unlock, master, secure, supercharge, defend, streamline*.
  - Titles do not need to follow a formula or house pattern. Personality is an asset. Keep product names intact rather than breaking them up to move a keyword earlier — "Okta Angular SDK" stays whole.
- ⚠️ Keywords should be incorporated into H2 and H3 headings where natural. Doing so also can help with clarity. For example compare the clarity and the addition of keywords in these example headers:
  - Correct: "Configure Okta for your OIDC Spring Boot app"
  - Incorrect: "Configure Okta"
  - Correct: "Learn more about authentication, OpenID Connect (OIDC), and Spring Security"
  - Incorrect: "Additional resources"
- ⚠️ Description (front matter) should be **150 characters or less** and summarize the article for search engines.

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
