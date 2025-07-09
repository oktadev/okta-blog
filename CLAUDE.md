# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the source code repository for [Okta's developer blog](https://developer.okta.com/blog/). It's a Jekyll-based static site generator that publishes developer-focused content about authentication, authorization, and identity management.

## Essential Commands

### Local Development

```bash
# Install dependencies
gem install bundler
bundle install
npm install

# Start development server
npm start
# This runs: bundle exec jekyll serve --future --livereload --incremental --host=0.0.0.0
# Site will be available at http://localhost:4000

# Build for production
npm run build-prod
# This runs: JEKYLL_ENV=production bundle exec jekyll build

# Build for development
npm run build-dev
```

### Docker Development

```bash
# Build Docker image
docker build . -t okta-blog
# Or use: make build

# Run with Docker
docker run -p 4000:4000 -v $PWD:/app -it okta-blog npm start
# Or use: make develop

# Using docker-compose
docker-compose up
```

### Content Management

```bash
# Create a new blog post
npm run post create [post-name] [format] [date]
# Example: npm run post create build-crud-app-with-nodejs

# Stamp a post with current date
npm run post stamp [date]

# Clean development environment (removes old posts)
npm run dev
npm run dev-restore  # Restore deleted posts
```

### Testing and Validation

```bash
# Run all linting and validation
npm run markdown-lint
npm run validate-front-matter
npm run validate-images
npm run find-missing-slashes

# Optimize images
npm run optimize-images

# Jekyll doctor (check for issues)
npm run doctor
```

## Architecture Overview

### Jekyll Site Structure

- **`_source/`**: Main source directory for Jekyll
  - **`_posts/`**: Blog post content in Markdown/AsciiDoc format
  - **`_layouts/`**: HTML templates (blog_post.html, author.html, etc.)
  - **`_includes/`**: Reusable partial templates
  - **`_data/`**: YAML data files (authors.yml, docs.yml, etc.)
  - **`_assets/`**: Static assets (images, CSS, JS)
  - **`_plugins/`**: Custom Jekyll plugins for extended functionality

### Key Build Configuration

- **Jekyll config**: `_config.yml` - Main site configuration
- **Ruby dependencies**: `Gemfile` - Jekyll plugins and gems
- **Node dependencies**: `package.json` - Build scripts and utilities
- **Docker setup**: `Dockerfile` and `docker-compose.yml` for containerized development

### Custom Jekyll Plugins

The site uses several custom plugins in `_source/_plugins/`:

- **`twitter_tag.rb`**: Embed tweets with `{% twitter TWEET_ID %}`
- **`youtube_tag.rb`**: Embed YouTube videos with `{% youtube VIDEO_ID %}`
- **`gist_tag.rb`**: Embed GitHub gists with `{% gist GIST_ID %}`
- **`speakerdeck_tag.rb`**: Embed Speaker Deck presentations
- **`stackblitz.rb`**: Embed StackBlitz code examples
- **`excerpt.rb`**: Create excerpts from other blog posts
- **`data_page_generator.rb`**: Generate pages from data files

### Content Workflow

1. **Post Creation**: Use `npm run post create` to generate post template
2. **Development**: Use `npm start` for live reloading during writing
3. **Pre-commit Validation**: Scripts validate markdown, front matter, and images
4. **Build Process**: Jekyll compiles Markdown to HTML with layouts and includes
5. **Deployment**: Static files are generated to `dist/` directory

### Pre-push Validation

The `package.json` defines pre-push hooks that run:
- `dev-restore`: Restore any deleted posts
- `markdown-lint`: Check markdown formatting
- `validate-front-matter`: Validate YAML front matter
- `validate-images`: Check image sizes and formats

## Content Standards

### Blog Post Setup

Use the CLI setup includes for Okta app configuration:
```markdown
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080/callback" %}
```

### Markdown Conventions

- Directories/files: Use backticks (`` `filename.txt` ``)
- Code snippets: Use backticks for inline code
- UI elements: Use asterisks (**Done** button)
- Functions: Include parentheses (`` `render()` method ``)
- localhost URLs: Use backticks (`` `http://localhost:3000` ``)
- Internal links: Use relative paths (`/docs/whatever.html`)

### Image Handling

- Images should be under 400KB and preferably under 1800px width
- Use JPEG or WebP over PNG for blog content
- Social images should be 1600x900 pixels
- Store images in `_source/_assets/img/blog/[post-name]/`

### Custom Tags Usage

```markdown
# Twitter
{% twitter 1460993714227236868 %}

# YouTube
{% youtube 8vY-9tXlCW4 %}

# GitHub Gist
{% gist deepu105/127b220d0c7a3bbf06386cef8128d2f5 %}

# StackBlitz
{% stackblitz angular %}

# Table of Contents
{% include toc.md %}
```

## Development Tips

- The site uses Ruby 2.6.5 and Node 14.x (see Dockerfile)
- Jekyll serves on port 4000 with live reload enabled
- Use `npm run dev` to work with recent posts only for faster builds
- Always run `npm run dev-restore` before pushing to ensure all posts are included
- Image validation will fail builds if images are too large - use `npm run optimize-images`

## Common Issues

- **Slow builds**: Use `npm run dev` to work with recent posts only
- **Image size failures**: Run `npm run optimize-images` or manually optimize images
- **Broken links**: Check that internal links use relative paths
- **Front matter errors**: Validate YAML syntax in post headers
- **Docker issues**: Ensure Docker has sufficient memory allocation for Jekyll builds