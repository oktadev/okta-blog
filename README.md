# Okta Developer Blog

This is the source code repository for [Okta's developer blog](https://developer.okta.com/blog/).

- If you're having problems running one of the tutorials for a blog post, please open an issue in this project or leave a comment on the blog post.
- If you have questions or need help with Okta's APIs or SDKs, please post to [StackOverflow](https://stackoverflow.com/questions/tagged/okta). If you think you've encountered a bug in one of our SDKs, please create a GitHub issue for that SDK.
- If you are looking for Okta's developer documentation, that has moved to [@okta/okta-developer-docs](https://github.com/okta/okta-developer-docs).

## Contribute

If you'd like to contribute to the blog, please [send us a pull request](#how-to-create-a-pull-request).

This site is built using [Jekyll](http://jekyllrb.com/). Blog post updates, bug fixes, and PRs are all welcome! You can create articles using Markdown (it's quite simple).

### Requirements

This blog depends on both Ruby and Node currently. It has a number of dependencies.

To begin, fork this repo to your personal GitHub, then clone it:

```bash
git clone git@github.com:<your-username>/okta-blog.git
```

Or, if you have access to push to this repo, you can clone it directly.

```bash
git clone git@github.com:oktadev/okta-blog.git
```

Then, install its dependencies.

```bash
gem install bundler
bundle install
npm i
```

If you have issues with this setup, see [setting up your environment](https://github.com/oktadev/okta-blog-archive/wiki/Setting-Up-Your-Environment) or [use Docker](#docker-instructions).

Now you can build and start the site.

```
npm start
```

Visit http://localhost:4000 in your browser.

To simplify the running of the blog, you can also [use Docker](#docker-instructions).

### How to Create a Pull Request

First, you'll want to create a branch. The name of the branch should contain your post's keywords for readability. For example:

```bash
git checkout -b angular-spring-boot
```

Then, create the Markdown file and images directory for your post.

```bash
npm run post create angular-spring-boot
```

A page for your blog post will be created in `_source/_posts`. Modify this file to have your blog post's content.

Start and view in your browser.

```
npm start
```

Your browser will automatically refresh the page when you make changes.

Please review our [Markdown standards](#markdown-standards) for conventions we use in posts.

### Docker Instructions

To begin, you should have [Docker](https://www.docker.com/) installed and working.

Then, clone this GitHub repo, or your fork:

```bash
git clone git@github.com:oktadev/okta-blog.git
```

Once you've cloned the repository, change into the `okta-blog` directory to get started:

```bash
cd okta-blog
```

#### Build the Docker Image

Next, you'll want to build the Docker image. To do this, run the following command:

```bash
docker build . -t okta-blog
```

There's also a `make build` command you can use.

What this command does is:

1. Download a Linux system image
2. Install Ruby, Node, and all of this project's dependencies

The resulting image will allow you to quickly and easily run the blog on your laptop without needing all of the blog dependencies installed. Nice, right?

**NOTE**: If you modify any of the blog software's dependencies (the Node or Ruby dependencies, specifically), you'll need to re-run that `docker build . -t okta-blog` command from before. This way you'll re-create the Docker image with all the updated dependencies installed!

#### Run the Blog

Now that you've got the Docker image setup, all you need to do is run the Docker image to start the blog locally.

Here's the command you'll want to run:

```bash
docker run -p 4000:4000 -v $PWD:/app -it okta-blog npm start
```

You can use `make develop` as a shortcut.

What this command does is:

- `-p 4000:4000` - This maps port `4000` from the Docker container to port `4000` on your computer's localhost. This way you can easily access the blog website.
- `-v $PWD:/app` - This mounts the current directory (the okta-blog source code repo) as `/app` in the Docker container's filesystem. This way, if you change articles or mess with the blog locally, your changes will be picked up by the blog software.
- `-it` - These CLI options just map the Docker container to your current terminal so that when you CTRL+c to exit the blog the Docker container will be killed.
- `okta-blog` - This is telling Docker to run the `okta-blog` image you created earlier using that `docker build` command. The `-t` option you specified earlier when running `docker build` assigned a name tag to the image so you could easily reference it.
- `npm start` - This is the actual command you're telling Docker to run to launch the blog sofware. Docker will start the container up and then run this command inside the container to launch the Jekyll blog.

After that, all you have to do is open your browser and visit `http://localhost:4000` to visit the site!

## Markdown Standards

This section describes Markdown standards we like to use in our blog posts. These conventions also pertain to AsciiDoc, if you choose to use it.

- [Use the Okta CLI](#use-the-okta-cli-to-register-your-app)
- [Blog Markdown Conventions](#blog-markdown-conventions)
- [Add a Changelog](#add-a-changelog)
- [Add a Canonical URL](#add-a-canonical-url)

### Use the Okta CLI to Register Your App

To describe how to setup a new application on Okta, please use the [`cli.md`](_source/_includes/setup/cli.md) or [`maven.md`](_source/_includes/setup/maven.md) includes.

These will render instructions using the [Okta CLI](https://cli.okta.com) (or [Okta Maven Plugin](https://github.com/oktadev/okta-maven-plugin)) and link to instructions for the Admin Console. Screenshots are discouraged because they're hard to keep up-to-date.

The basic syntax for using the Okta CLI to set up an app is:

```md
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080/callback" %}
```

Supported values for `type`: spa, web, native, service, token, and jhipster

Other parameters you can pass in:

| Parameter           | Possible values                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `framework`         | Angular, React, Vue, Okta Spring Boot Starter, Spring Boot, Quarkus, ASP.NET Core                   |
| `loginRedirectUri`  | Prints whatever you set, can be comma-delimited, or use an array for multiple values `[url1, url2]` |
| `logoutRedirectUri` | Prints whatever you set, or defaults if not set                                                     |
| `signup`            | `false` reduces opening paragraph to one sentence                                                   |
| `note`              | Prints whatever you set. See .NET example below                                                     |
| `install`           | `false` removes 'Install the Okta CLI' sentence                                                     |

See [How to Create an OIDC App on Okta](https://developer.okta.com/blog/setup) for this feature's documentation.

### Blog Markdown Conventions

- For directories and filenames, surround with back ticks (e.g. `filename.txt` or `/src/component/dummy.file`)
- For code snippets that are only a few words. Inline back ticks (e.g. Run `npm install` from the command line)
- For button or link names surround with two asterisks (e.g. Then click **Done**)
- When adding function names inline, add the parentheses and back ticks (e.g. This calls the `render()` method)
- http://localhost links should be wrapped in back ticks (e.g. `http://localhost:3000`)
- Links that start with developer.okta.com should be relative (e.g. instead of `https://developer.okta.com/docs/whatever.html`, just use `/docs/whatever.html`)
- Code with {{ variable }} needs a "raw" wrapper. For example:

<pre>
{% raw %}
```html
&lt;span>{{ title }} app is running!&lt;/span>
```
{% endraw %}
</pre>

For Markdown images, the macro looks as follows:

```
{% img blog/<post-images-dir>/<image-file-name> alt:"<text for screen readers>" width:"800" %}{: .center-image }
```

For AsciiDoc:

```
image::{% asset_path 'blog/<post-images-dir>/<image-file-name>' %}[alt=text for screen readers,width=800,align=center]
```

To add a table of contents, use the following:

```
{% include toc.md %}
```

For AciiDoc, add the following just after the front matter:

```
:page-liquid:
:toc: macro
```

Then, add the following wherever you'd like the table of contents to appear:

```
toc::[]
```

### Add a Changelog

If you update a post to fix a bug or upgrade dependencies, you should add a changelog. You can add this to the front matter with a `changelog` key.

Please be sure to link to the pull request that updates the post and the pull request that updates the example app on GitHub.

For example:

```yaml
---
layout: blog_post
...
changelog:
  - 2020-08-31: Updated GitHub repo to have proper starter files and fixed logout in Vue. You can see the changes in the [example app on GitHub](https://github.com/oktadev/okta-kotlin-spring-boot-vue-example/pull/4). Changes to this article can be viewed in [oktadev/okta-blog#392](https://github.com/oktadev/okta-blog/pull/392).
---
```

This will render a "last updated" date at the top, and a changelog at the bottom. The list should be ordered last to first. See [this post](https://developer.okta.com/blog/2020/06/26/spring-boot-vue-kotlin) ([source](https://raw.githubusercontent.com/oktadev/okta-blog/main/_source/_posts/2020-06-26-spring-boot-vue-kotlin.md)) for an example.

### Add a Canonical URL

If you're syndicating a post on this blog, you can add a canonical URL using the front matter.

For example:

```yaml
---
layout: blog_post
...
canonical: https://auth0.com/blog/full-stack-java-with-react-spring-boot-and-jhipster/
---
```

## Utilities

There are a number of scripts available to assist with content creation.

**NOTE**: If you're using Docker, prefix the commands below with:

```
docker run -v $PWD:/app -it okta-blog
```

### Create a New Post

```bash
npm run post create [post-name] [format] [date]
```

Creates a new post under `_source/_posts` with the given name and populates it the file with a blank front matter template. Also creates a folder with the same name for images under `_source/_assets/img/blog`. **Format** can be `md` (default), `adoc`, or any file extension. If **date** is not specified, it will default to today's date.

Example:

```bash
npm run post create build-crud-app-with-nodejs
```

### Stamp a Post

```bash
npm run post stamp [date]
```

Finds the latest blog post and updates the post date to the date specified. **Date** should be in ISO format (e.g. 2019-08-31). If no **date** is specified, today's date is used.

### Faster Rendering for Development

```bash
npm run dev
npm start
```

This command removes all posts from the local development environment except those dated within the last two weeks. If you pass in a file name (or comma-separated list of filenames), it'll keep those too.

### Restoring Deleted Posts Before Pushing to GitHub

Deleted posts are restored automatically before the push occurs. However, you can manually restore all deleted posts using the following.

```bash
npm run dev-restore
```

### Optimizing Images

The pre-push workflow will validate image size and fail if there are images bigger than 400kb in size. It will also warn you about using PNG images as they are lossless and occupy more space. For a blog post, JPEGs or WebP images are better suited. So do consider using those formats. And ideally, images should be under 1800px in width. The blog content is rendered in a 900px width container and [retina images](https://www.sleeplessmedia.com/2018/12/14/optimizing-website-images-and-graphics-for-retina-displays/) are 2x what's displayed.

You can use `npm run optimize-images` to optimize all images in the `_source/_assets/img` directory. This will resize and compress the images and write them to new files. So make sure to update the usage and delete the original file.

If a file has to be ignored for some reason, like pre-existing social images, it can be added to `scripts/image-validation-ignore.json`.

### Custom Jekyll tags

We have the following custom Jekyll plugins that can be used in a blog post

**Twitter**

Use the tweet ID from the Tweets URL

```bash
{% twitter <TWEET-ID> %}

# example from https://twitter.com/oktadev/status/1460993714227236868
{% twitter 1460993714227236868 %}
```

**GitHub Gist**

```bash
# filename is optional
{% gist <full url | user/gist_id | gist_id> [filename?] %}

# examples
{% gist https://gist.github.com/deepu105/127b220d0c7a3bbf06386cef8128d2f5 %}
{% gist deepu105/127b220d0c7a3bbf06386cef8128d2f5 %}
{% gist deepu105/127b220d0c7a3bbf06386cef8128d2f5 online-store.jdl %}
{% gist 127b220d0c7a3bbf06386cef8128d2f5 %}
{% gist 127b220d0c7a3bbf06386cef8128d2f5 online-store.jdl %}
```

**YouTube**

```bash
# width and height are optional (in px)
{% youtube <VIDEO-ID> [width? height?]%}

# example from https://www.youtube.com/watch?v=8vY-9tXlCW4
{% youtube 8vY-9tXlCW4 %} # default width and height of 700 x 394
{% youtube 8vY-9tXlCW4 900 %} # height calculated based on width
{% youtube 8vY-9tXlCW4 900 600 %}
```

**Speaker Deck**

```bash
# width is optional, default is 700px
{% speakerdeck <DATA-ID> [width?]%}

# example from embedd code <script async class="speakerdeck-embed" data-id="ffe22480dbfd4c1f83f66c380bba2283" ...></script>
{% speakerdeck ffe22480dbfd4c1f83f66c380bba2283 %}
{% speakerdeck ffe22480dbfd4c1f83f66c380bba2283 900px %}

```
