# Editorial Standards

These are the primary editorial standards for OktaDev blog content. When conflicts arise with other guidelines, these rules take precedence.

---

## Content Quality

- ⚠️ Post should be around **1,000–1,500 words** (not counting code). Flag if significantly under or over.
- ❌ Post must be written **for developers** — not a general audience or marketing audience.
- ⚠️ Content must be **clear, insightful, and fun to read**. Flag dry, jargon-heavy, or confusing passages.
- ❌ Content must be **valuable, relevant, and actionable** — it should help developers do their job better, learn something new, or approach a problem differently.
- ❌ Claims and arguments must be **spell-checked and fact-checked**. Sources must be cited and linked.
- ⚠️ Posts should gently **encourage sign-up for Okta Integrator Free Plan** without being obnoxiously self-promotional. Flag any passages that feel like hard selling.
- ❌ Post must focus on **one topic or goal**. Flag if the scope is too broad or unfocused.
- ❌ Content should define acronyms and abbreviations before using them. Our blog audience include all experience levels and global distribution. We can't assume our readers know and understand all acronyms. Two exceptions apply — everyday developer tooling terms and UI labels. See [Be Clear](./writing-principles.md#be-clear).
- ❌ Always verify user has run their content through Grammarly.

---

## Code Tutorials (if applicable)

- ❌ Tell the reader **why the post is valuable up front**.
- ❌ **Preface all tools and technologies** required (e.g. Okta account, AWS account, API key and secret).
- ⚠️ **Be careful with "first," "last," and "finally"** — these can confuse readers who are partway through. Flag any awkward use.
- ⚠️ Add **checkpoints** throughout the tutorial so readers can verify they are on the right track before moving to the next step.

---

## Post Footer

- ❌ Every post must end with a CTA. Include: links to related OktaDev posts, links to OktaDev social media channels (such as LinkedIn, YouTube, X, or Bluesky), and a prompt for reader engagement.
- ❌ Don't flag a CTA for omitting a specific channel. Which channels a post links is the author's call and changes over time.

---

## Visual Breaks

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

---

## Image Rights

- ❌ Any photos included must be **free for commercial use**. Attribution-licensed images are acceptable as long as the image is attributed. Flag any image that appears to be used without a clear license.

---

## Legal and Privacy

- ❌ Avoid direct references to commercial entertainment properties (movies, books, TV shows, games, music) in titles and section headers.
  - This does **not** apply to the technologies, products, and SDKs the post teaches. "Okta Angular SDK," "Spring Boot," and "Tailwind" belong in titles and headings when they're the subject matter. Naming what a post is about is not a legal concern.
- ⚠️ Flag any content references to commercial products (movies, books, TV shows for example) that go beyond relevant analogies and storytelling. We want to ensure we don't cross a line into licensing issues.
- ❌ Flag any content references to commercial products that aren't safe for work and professional use. Avoid references to commercial products that are insensitive or inappropriate so the user can replace them.
- ❌ Flag any user names based on commercial products (movies, books, TV shows for example). Example users should be made up or taken from demo user sources, such as from JSON Placeholder.
- ❌ Avoid mentioning Okta customers as it requires strict legal sign off. 
- ⚠️ Flag any mentions of Okta employees as they require consent.
- ❌ Flag any PII or data disclosure concerns.

---

## Okta Product terms

- ❌ Align Okta product terms with InfoDev's terminology. What matters is using the right product name, not prefixing everything with "Okta."
  - Correct: "Admin Console" or "Okta Admin Console" — Okta developer docs use both
  - Incorrect: "Admin dashboard", "Okta dashboard", "developer console"
  - Correct: "Okta Integrator Free Plan"
  - Incorrect: "Okta Dev Account", "developer account"
- ❌ Don't flag a product term solely for omitting the "Okta" modifier when the name itself is right. "the Admin Console" is correct on its own.

---

## OAuth and Spec References

- ✅ Refer to **OAuth 2.1** in new content when the post advocates practices the upcoming spec reinforces: PKCE for authorization code flows, exact redirect URI matching, sender-constrained or single-use refresh tokens, and dropping the implicit and password grants. Sender-constraining mechanisms such as DPoP ([RFC 9449](https://www.rfc-editor.org/rfc/rfc9449)) push in the same direction.
- ❌ Don't flag "OAuth 2.1" as a factual error because the spec is still an IETF draft. The guidance it consolidates is settled, and new content should reflect where the standard is heading.
- Use **OAuth 2.0** when referring to the published specification itself, or to a mechanism OAuth 2.1 leaves unchanged.
- ❌ Don't retroactively rewrite the titles of already-published posts that say "OAuth 2.0."

---

## Image Markup

- ❌ Use the **custom Jekyll image macro**, not standard markdown or asciidoc syntax:
  ```
  {% img blog/<post-images-dir>/<image-file-name> alt:"<alt text>" width:"800" %}{: .center-image }
  ```
- ❌ All images must have the CSS class `center-image`.
- ❌ Alt text is required. Never start with "Image of" or "Diagram of."
- ❌ If the image is decorative, use null alt text `" "`.
- ❌ Images must be **JPG format**, min **800px wide** (1600px optimal), max **1800px wide**, max **500KB**. Check the image format, not just the file extension.

---

## Image and Diagram Guidelines

### General
- ❌ Prefer **JPG** over GIF, unless it's an animated GIF. Avoid PNG. Always check the file format, not just the file extension.
- ⚠️ Prefer **SVG** for mermaid diagrams.
- ❌ Min width: 800px (1600px optimal). Max width: 1800px. Max file size: 500KB.

### Okta Admin Console Screenshots
- ❌ Limit screenshots of the Okta Admin Console as much as possible. Use the `setup/integrator.md` include or written steps with bolded UI labels instead.
- ❌ Never recommend *adding* an Admin Console screenshot during review. The Admin Console UI changes, which silently invalidates screenshots and leaves posts describing a product that no longer looks that way. The `setup/integrator.md` include exists so setup instructions stay consistent and maintainable without them.
- ✅ To break up a long setup section, split it with headings rather than adding a screenshot.
- ✅ Screenshots of the reader's **own running application** are fine and expected — they show the reader what success looks like.

### Diagrams
- ❌ **White backgrounds only**. No color backgrounds, no transparent backgrounds.
- ❌ **No drop shadows**.
- ❌ **No borders** in diagrams.
- ❌ Do not put titles, descriptions, or captions inside the diagram — use surrounding content text instead.
- ⚠️ Prefer **Mermaid** for diagrams and add the diagram in SVG format.

### Social Images
- ❌ 1600x900 JPG at `blog/<post-slug>/social.jpg`, referenced by the `image:` front matter field. Under 400KB.
- ❌ Must be professional and safe for work.
- ✅ There is no required template or house layout. Illustrative, creative, and playful social images are all appropriate. Don't flag a social image for differing in style from other posts.
- ⚠️ The image should relate to what the post teaches.
- ❌ Respect image rights — see [Image Rights](#image-rights).
- ⚠️ Generated images shouldn't attempt to reproduce trademarked logos. AI-generated logos render inaccurately and raise trademark concerns. Add official logo assets separately if they're needed.

### Author Photos (if reviewing author content)
- ❌ Must be in color, head and shoulders only, max 500×500px, max 40KB.
- ❌ File must be named `avatar-<name>.jpg`.

---

## Content Update Rules

- ❌ If content materially changes guidance or tutorial instructions → **update the article** and add a changelog entry.
- ❌ If the technology or standards are superseded → **write a new article**. Do not just update the old one.
  - New article must reference which old article it supersedes.
  - Old article must have a note at the top pointing to the new article.
  - Do NOT add a changelog entry to the old article.
