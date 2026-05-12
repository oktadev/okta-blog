Create a new blog post for the okta-blog. Arguments: $ARGUMENTS

SEO work must happen BEFORE the post is created — keywords drive the slug, title, headers, and description.

## Steps

1. **Identify SEO keywords (do this first).**
   - Ask the user: "Have you already identified your 2-3 SEO keywords from Google Keyword Planner?"
   - If not, remind them of the process:
     - Go to Google Keyword Planner, remove USA as the market region, and search with generic 2-3 word phrases (e.g. "python chatbot" not "okta documentation chatbot")
     - Target keywords with 300+ avg monthly searches; balance search volume against the integrity of the post
     - Pick 2-3 final keywords — these will feed everything below
   - Once keywords are confirmed, proceed.

2. **Gather post info.** Parse $ARGUMENTS for a post slug if provided. Ask the user for any missing required fields:
   - **Post slug** — the SEO keywords in kebab-case, used as the filename and image directory (e.g. `python-chatbot`). This is what `npm run post create` embeds into the URL — make it count.
   - **Title** — must include the keywords. Format in **Chicago style** title case:
     - Capitalize: first word, last word, all nouns, verbs, adjectives, adverbs, and pronouns
     - Lowercase: articles (a, an, the), coordinating conjunctions (and, but, or, nor, for, so, yet), and prepositions (in, on, at, by, for, with, to, of, from, about, etc.)
     - Hyphenated compounds: capitalize each element (e.g., `Low-Code`, not `Low-code`)
     - Run it through https://www.isitwp.com/headline-analyzer/ and aim for a high overall score before settling on the final title.
   - **Author slug** — must match a key in `_source/_data/authors.yml` (e.g. `semona-igama`)
   - **Description** — compelling, ~150 characters max; this feeds the post preview so make people want to click. Must include keywords.
   - **Communities** — comma-separated list from: `security`, `javascript`, `java`, `python`, `go`, `php`, `ruby`, `.net`, `mobile`, `devops` (pick all that apply)
   - **Tags** — comma-separated lowercase kebab-case tags relevant to the post content (e.g. `oauth, api-security, nodejs`)
   - **Type** — `awareness` (educational/thought leadership) or `conversion` (drives product adoption)
   - **GitHub repo URL** (optional) — link to a companion code repository
   - **Social image** (optional) — whether a social/cover image will be added (yes/no)

3. **Verify the author slug exists.**
   - Run: `grep -n "^{author-slug}:" _source/_data/authors.yml`
   - If no match is found, warn the user and ask them to confirm the slug or run `/new-author` first.

4. **Create the post and image directory using the project script.**
   - Run: `npm run post create {post-slug}`
   - This creates two things at once:
     - `_source/_posts/{YYYY-MM-DD}-{post-slug}.md` — the post file with a blank front matter template
     - `_source/_assets/img/blog/{post-slug}/` — the image directory for this post

5. **Fill in the front matter.**
   - Open the generated post file and replace its front matter with the following, omitting optional fields that were not provided:

     ```markdown
     ---
     layout: blog_post
     title: "{Title}"
     author: {author-slug}
     by: advocate
     communities: [{community1}, {community2}]
     description: "{Description}"
     tags: [{tag1}, {tag2}]
     tweets:
       - ""
       - ""
       - ""
       - ""
     image: blog/{post-slug}/social.jpg   # omit line if no social image
     github: {github_url}                  # omit line if not provided
     type: {awareness|conversion}
     ---
     ```

6. **Apply style guide standards to the post body.**
   - **Acronyms**: spell out on first use with abbreviation in parentheses: "single sign-on (SSO)". Common exceptions that don't need defining: JSON, HTTP, API. Subsequent uses can use the abbreviation alone.
   - **Bold**: reserved for UI elements only (button labels, menu items, field names). Do not bold for emphasis or to label list items.
   - **Internal links**: `developer.okta.com` links must use relative paths: `/docs/guides/...` not `https://developer.okta.com/docs/guides/...`
   - **Ellipsis**: use three plain periods `...` not the Unicode ellipsis character `…` — the pre-commit hook will reject it
   - **Smart quotes**: use straight quotes `"` and `'` not curly/smart quotes `"` `"` `'` `'` — also rejected by the pre-commit hook

8. **Remind about SEO in the post body.**
   - **H2 and H3 headers directly impact SEO.** Headers must incorporate the keywords plus context-specific terms (Okta-specific, technology names, etc.). A header like "Set up Okta" does nothing; "Add OIDC authentication to Python apps using Okta" is far better.
   - Use **sentence case** for all H2 and H3 headers: capitalize only the first word and proper nouns (product names, acronyms, brand names). Example: `## How to build low-code API integrations with Okta Workflows`
   - The post body starter should reflect this — update the placeholder `## Introduction` header to something keyword-rich in sentence case.

9. **Optimize images.**
   - **Image filenames must use kebab-case** (e.g. `add-integration-capabilities.jpeg`, not `addIntegrationCapabilities.jpeg`). Rename any camelCase files before adding them to the post.
   - Once all images have been added to `_source/_assets/img/blog/{post-slug}/`, run:
     ```
     npm run optimize-images
     ```
   - This resizes and compresses images in `_source/_assets/img/` and writes optimized versions to new files. Update any image references in the post to the optimized filenames and delete the originals.
   - All images must be under **400 KB**. Re-run or manually compress any that remain over the limit.
   - Prefer JPEG or WebP over PNG for blog post images.

10. **Verify the result.**
   - Confirm both paths exist:
     - `ls _source/_posts/{YYYY-MM-DD}-{post-slug}.md`
     - `ls _source/_assets/img/blog/{post-slug}/`
   - Read back the front matter and show it to the user.

11. **Summary.** Report what was created:
   - Full path of the new post file
   - Full path of the new image directory
   - If a social image was indicated:
     - Place it at `_source/_assets/img/blog/{post-slug}/social.jpg`
     - Social images must be **1600×900 px** — use the "Twitter Ad" template on Canva
   - In the post body, embed images with:
     ```
     {% img blog/{post-slug}/{image-file} alt:"description" width:"800" %}{: .center-image }
     ```
   - Remind the user to fill in the `tweets` array with shareable pull-quote text before publishing
   - **CTA**: every post must end with the following call-to-action paragraph (after the last section):
     ```
     Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about the topics you'd like to see and any questions you may have. Leave us a comment below!
     ```
