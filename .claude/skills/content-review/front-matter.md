# Front Matter Validation

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

---

## Tags

- ❌ Flag any new tags. Tags feed into a tag view of related posts. There is no value to a tag only being used in one post. A new tag could establish a precedent for upcoming related posts, but if the user isn't aware of upcoming posts using a new tag, they shouldn't use them.
