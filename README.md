# Okta Developer Blog

This is the source code repository for [Okta's developer blog](https://developer.okta.com/blog/).

- If you're having problems running one of the tutorials for a blog post, please open an issue in this project or leave a comment on the blog post.
- If you have questions or need help with Okta's APIs or SDKs, please post to [StackOverflow](https://stackoverflow.com/questions/tagged/okta). If you think you've encountered a bug in one of our SDKs, please create a GitHub issue for that SDK.
- If you are looking for Okta's developer documentation, that has moved to [@okta/okta-developer-docs](https://github.com/okta/okta-developer-docs).

## Contribute

If you'd like to contribute to the blog, please send us a pull request.

This site is built using [Jekyll](http://jekyllrb.com/). Blog post updates, bug fixes, and PRs are all welcome! You can create articles using Markdown (it's quite simple).

### Requirements

This blog depends on both Ruby and Node currently. It has a number of dependencies.

To simplify the running of the blog, we're using Docker. This means that before you try to contribute to this site, you should have [Docker](https://www.docker.com/) installed and working.

### Getting Set Up

Once you have Docker installed and working, the next step to clone this GitHub repo:

```bash
git clone git@github.com:oktadeveloper/okta-blog.git
```

Once you've cloned the repository, change into the `okta-blog` directory to get started:

```bash
cd okta-blog
```

### Build the Docker Image

Next, you'll want to build the Docker image. To do this, run the following command:

```bash
docker build . -t okta-blog
```

What this command does is:

1. Download a Linux system image
2. Install Ruby, Node, and all of this project's dependencies

The resulting image will allow you to quickly and easily run the blog on your laptop without needing all of the blog dependencies installed. Nice, right?

**NOTE**: If you modify any of the blog software's dependencies (the Node or Ruby dependencies, specifically), you'll need to re-run that `docker build . -t okta-blog` command from before. This way you'll re-create the Docker image with all the updated dependencies installed!

### Run the Blog

Now that you've got the Docker image setup, all you need to do is run the Docker image to start the blog locally.

Here's the command you'll want to run:

```bash
docker run -p 4000:4000 -v $PWD:/app -it okta-blog npm start
```

What this command does is:

- `-p 4000:4000` - This maps port `4000` from the Docker container to port `4000` on your computer's localhost. This way you can easily access the blog website.
- `-v $PWD:/app` - This mounts the current directory (the okta-blog source code repo) as `/app` in the Docker container's filesystem. This way, if you change articles or mess with the blog locally, your changes will be picked up by the blog software.
- `-it` - These CLI options just map the Docker container to your current terminal so that when you CTRL+c to exit the blog the Docker container will be killed.
- `okta-blog` - This is telling Docker to run the `okta-blog` image you created earlier using that `docker build` command. The `-t` option you specified earlier when running `docker build` assigned a name tag to the image so you could easily reference it.
- `npm start` - This is the actual command you're telling Docker to run to launch the blog sofware. Docker will start the container up and then run this command inside the container to launch the Jekyll blog.

After that, all you have to do is open your browser and visit http://localhost:4000 to visit the site!

## Utilities

There are a number of scripts available to assist with content creation.

### Create a New Post

```bash
docker run -it okta-blog npm run post create [post-name] [format] [date]
```

Creates a new post under `_source/_posts` with the given name and populates it the file with a blank front matter template. Also creates a folder with the same name for images under `_source/_assets/img/blog`. **Format** can be `md` (default), `adoc`, or any file extension. If **date** is not specified, it will default to today's date.

Example:

```bash
docker run -it okta-blog npm run post create build-crud-app-with-nodejs
```

### Stamp a Post

```bash
docker run -it okta-blog npm run post stamp [date]
```

Finds the latest blog post and updates the post date to the date specified. **Date** should be in ISO format (e.g. 2019-08-31). If no **date** is specified, today's date is used.

### Faster Rendering for Development

```bash
docker run -it okta-blog npm run dev
```

This command removes all posts from the local development environment except those dated within the last two weeks.

### Restoring Deleted Posts Before Pushing to GitHub

Deleted posts are restored automatically before the push occurs. However, you can manually restore all deleted posts using the following.

```bash
docker run -it okta-blog npm run dev-restore
```
