Create a new author entry for the okta-blog. Arguments: $ARGUMENTS

## Steps

1. **Gather author info.** Parse $ARGUMENTS for a slug (lowercase-hyphenated, e.g. `jane-doe`). If not provided, ask the user for:
   - Author slug (lowercase, hyphen-separated — this becomes the YAML key and avatar filename prefix)
   - Full name
   - Display name (can match full name)
   - Avatar image path (local file the user has on disk)
   - Bio
   - Twitter URL (optional)
   - GitHub URL (optional)
   - LinkedIn URL (optional)
   - Personal website URL (optional)

2. **Handle the avatar image.**
   - The standard avatar size in this project is **600×595 px**.
   - Determine the source image extension. The destination filename must be `avatar-{slug}.{ext}` placed at `_source/_assets/img/`.
   - If the source image dimensions differ from 600×595, resize it using `sips`:
     ```
     sips -z 595 600 /path/to/source/image
     ```
   - Copy (or move if the user prefers) the resized image to `_source/_assets/img/avatar-{slug}.{ext}`.
   - Confirm the final dimensions with `sips -g pixelWidth -g pixelHeight`.

3. **Add the author to `_source/_data/authors.yml`.**
   - Append the new entry at the end of the file (before the final newline if one exists).
   - Only include optional fields (twitter, github, linkedin, web) if the user supplied them.
   - Use this format exactly, matching indentation of existing entries (2-space indent for fields):

     ```yaml
     {slug}:
       full_name: {Full Name}
       display_name: {Display Name}
       avatar: avatar-{slug}.{ext}
       twitter: {twitter_url}        # omit line if not provided
       github: {github_url}          # omit line if not provided
       linkedin: {linkedin_url}      # omit line if not provided
       web: {web_url}                # omit line if not provided
       bio: {bio text}
     ```

4. **Verify the result.**
   - Read back the newly added section from `authors.yml` and show it to the user.
   - Confirm the avatar file exists at the correct path with correct dimensions.

5. **Summary.** Report what was created:
   - The YAML key added to `authors.yml`
   - The avatar path and final dimensions
   - Remind the user that blog posts reference this author via `author: {slug}` in their front matter.
