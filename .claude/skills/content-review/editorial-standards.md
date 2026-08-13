# Editorial Standards

These are the primary editorial standards for OktaDev blog content. When conflicts arise with other guidelines, these rules take precedence.

---

## Content Quality

- ❌ Post should be around **1,000–1,500 words** (not counting code). Flag if significantly under or over.
- ❌ Post must be written **for developers** — not a general audience or marketing audience.
- ⚠️ Content must be **clear, insightful, and fun to read**. Flag dry, jargon-heavy, or confusing passages.
- ❌ Content must be **valuable, relevant, and actionable** — it should help developers do their job better, learn something new, or approach a problem differently.
- ❌ Claims and arguments must be **spell-checked and fact-checked**. Sources must be cited and linked.
- ⚠️ Posts should gently **encourage sign-up for Okta Integrator Free Plan** without being obnoxiously self-promotional. Flag any passages that feel like hard selling.
- ❌ Post must focus on **one topic or goal**. Flag if the scope is too broad or unfocused.
- ❌ Content should define acronyms and abbreviations before using them. Our blog audience include all experience levels and global distribution. We can't assume our readers know and understand all acronyms.
- ❌ Always verify user has run their content through Grammarly.

---

## Code Tutorials (if applicable)

- ❌ Tell the reader **why the post is valuable up front**.
- ❌ **Preface all tools and technologies** required (e.g. Okta account, AWS account, API key and secret).
- ⚠️ **Be careful with "first," "last," and "finally"** — these can confuse readers who are partway through. Flag any awkward use.
- ⚠️ Add **checkpoints** throughout the tutorial so readers can verify they are on the right track before moving to the next step.

---

## Post Footer

- ❌ Every post must end with a CTA. Include: links to related OktaDev posts, links to OktaDev Twitter and YouTube, and a prompt for reader engagement.

---

## Visual Breaks

- ⚠️ Aim for a **visual break (image, diagram, code block, embedded tweet, etc.) at least once every 300 words**. Flag long stretches of unbroken text.

---

## Image Rights

- ❌ Any photos included must be **free for commercial use**. Attribution-licensed images are acceptable as long as the image is attributed. Flag any image that appears to be used without a clear license.

---

## Legal and Privacy

- ❌ Avoid direct references to commercial products in titles and section headers.
- ⚠️ Flag any content references to commercial products (movies, books, TV shows for example) that go beyond relevant analogies and storytelling. We want to ensure we don't cross a line into licensing issues.
- ❌ Flag any content references to commercial products that aren't safe for work and professional use. Avoid references to commercial products that are insensitive or inappropriate so the user can replace them.
- ❌ Flag any user names based on commercial products (movies, books, TV shows for example). Example users should be made up or taken from demo user sources, such as from JSON Placeholder.
- ❌ Avoid mentioning Okta customers as it requires strict legal sign off. 
- ⚠️ Flag any mentions of Okta employees as they require consent.
- ❌ Flag any PII or data disclosure concerns.

---

## Okta Product terms

- ❌ Align Okta product terms with InfoDev's terminology
  - Correct: "Okta Admin Console"
  - Incorrect: "Admin dashboard"
  - Correct: "Okta Integrator Free Plan"
  - Incorrect: "Okta Dev Account"

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

### Diagrams
- ❌ **White backgrounds only**. No color backgrounds, no transparent backgrounds.
- ❌ **No drop shadows**.
- ❌ **No borders** in diagrams.
- ❌ Do not put titles, descriptions, or captions inside the diagram — use surrounding content text instead.
- ⚠️ Prefer **Mermaid** for diagrams and add the diagram in SVG format.

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
