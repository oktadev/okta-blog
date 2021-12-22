---
disqus_thread_id: 7877138573
discourse_topic_id: 17216
discourse_comment_url: https://devforum.okta.com/t/17216
layout: blog_post
title: "Build a Secure Blog with Gatsby, React, and Netlify"
author: matt-raible
by: advocate
communities: [javascript]
description: "This tutorial shows how to build a secure blog app with Gatsby, React, and Netlify."
tags: [gatsby, netlify, react, jamstack]
tweets:
- "Learn how to build a blog with Gatsby, React, and Netlify in this guide from @mraible."
- "Blogging with Gatsby and Netlify: #JAMStack FTW!"
- "A concise guide on how to build a secure blogging site with @gatsbyjs and @netlify. "
image: blog/gatsby-netlify-okta/gatsby-netlify.png
type: conversion
changelog:
- 2021-04-14: Updated to use Gatsby CLI 3.3 and Okta Sign-In Widget v5.5. See the example app changes in [gatsby-netlify-okta-example#3](https://github.com/oktadeveloper/gatsby-netlify-okta-example/pull/3) and this post's changes in [okta-blog#671](https://github.com/oktadeveloper/okta-blog/pull/671).
---

Gatsby is a tool for creating static websites with React. It allows you to pull your data from virtually anywhere: content management systems (CMSs), Markdown files, APIs, and databases. Gatsby leverages GraphQL and webpack to combine your data and React code to generate static files for your website.

JAM - JavaScript, APIs, and Markup - apps are delivered by pre-rendering files and serving them directly from a CDN, removing the requirement to manage or run web servers. You may have heard of JAM apps as the JAMstack.

Netlify is a hosting company for static sites that offers continuous integration, HTML forms, AWS Lambda functions, and even content management.

{% img blog/gatsby-netlify-okta/gatsby-netlify.png alt:"Gatsby + Netlify" width:"800" %}{: .center-image }

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

In this tutorial, I'll show you how to use Gatsby to create a blog that integrates with Netlify CMS for content. The app you build will support authoring posts in Markdown and adding/editing posts from your browser or via Git! Finally, I'll show you how to secure a section of your app with Okta.

> Before you begin, there's a few things you'll need:
>
> * [Node 12+](https://nodejs.org/en/) installed
> * A [GitHub Account](https://github.com/join)
> * A [Netlify Account](https://app.netlify.com/signup)
> * An [Okta Developer Account](https://developer.okta.com/signup)

If you'd prefer to watch a video, you can [watch this tutorial as a screencast](https://youtu.be/T5a5nmbV_g4).
<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/T5a5nmbV_g4" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Install Gatsby CLI

To create a Gatsby site, you'll need to install the Gatsby CLI. This tool gets you up and running with a Gatsby app in no time. It also runs a development server and builds your Gatsby application for production.

```shell
npm install -g gatsby-cli@3.3.0
```

## Create a New Project with Gatsby

Run `gatsby new` to create an app using Gatsby's [Hello World starter](https://github.com/gatsbyjs/gatsby-starter-hello-world):

```shell
gatsby new gatsby-netlify-okta gatsbyjs/gatsby-starter-hello-world
```

If prompted to choose between yarn and npm, choose npm. This process creates a directory layout, adds a `package.json` with dependencies, and prints out instructions to continue.

```shell
Your new Gatsby site has been successfully bootstrapped. Start developing it by running:

  cd gatsby-netlify-okta
  gatsby develop
```

_**NOTE:** You can also use `npm start` as an alias for `gatsby develop`. I use `npm start` to do the default tasks on most of my Node projects. I love this attention to detail from the Gatsby developers! ❤️_

You can use the `tree` command to view your new project's directory structure.

```bash
$ cd gatsby-netlify-okta
$ tree -I node_modules
.
├── LICENSE
├── README.md
├── gatsby-config.js
├── package-lock.json
├── package.json
├── src
│   └── pages
│       └── index.js
└── static
    └── favicon.ico
```

Run `npm start` and check out your "Hello World" app at `http://localhost:8000`.

{% img blog/gatsby-netlify-okta/hello-world.png alt:"Hello World" width:"800" %}{: .center-image }

Now let's move on to adding a neat feature, [sourcing content from Netlify CMS](https://www.gatsbyjs.org/docs/sourcing-from-netlify-cms/)!

## Add Netlify CMS for Content Management

Netlify CMS is a single-page React app too! Its features include custom-styled previews, UI widgets, editor plugins, and backends to support different Git platform APIs.

You can install Netlify CMS and the Gatsby plugin for it using `npm`:

```
npm i netlify-cms-app@2.14.45 gatsby-plugin-netlify-cms@5.3.0
```

In `gatsby-config.js`, register the Netlify CMS plugin:

```js
module.exports = {
  plugins: [`gatsby-plugin-netlify-cms`],
}
```

Then create a `static/admin` directory and a `config.yml` file in it.

`static/admin/config.yml`
```yaml
backend:
  name: test-repo
  
media_folder: static/assets
public_folder: assets
  
collections:
  - name: blog
    label: Blog
    folder: blog
    create: true
    fields:
      - { name: path, label: Path }
      - { name: date, label: Date, widget: datetime }
      - { name: title, label: Title }
      - { name: body, label: Body, widget: markdown }
```

Restart your app using `Ctrl+C` and `npm start`.

You'll now be able to edit content at `http://localhost:8000/admin/`.

{% img blog/gatsby-netlify-okta/login.png alt:"Login to Admin Section" width:"800" %}{: .center-image }

Click the **Login** button and you'll see the screen below.

{% img blog/gatsby-netlify-okta/admin.png alt:"Admin Section" width:"800" %}{: .center-image }

Everyone can log in and everything is in-memory at this point. You can even add a new blog post:

{% img blog/gatsby-netlify-okta/create-post.png alt:"Create blog post" width:"800" %}{: .center-image }

Click **Publish** and you're in business!

{% img blog/gatsby-netlify-okta/blog-added.png alt:"Blog post added" width:"800" %}{: .center-image }

Unfortunately, you'll lose your post as soon as you restart your development server. However, you can update Netlify CMS to store files in Git instead!

## Integrate Netlify CMS with GitHub for Continuous Deployment

To save to a Git repository, you can create a repo on GitHub, for example, I created one at `oktadeveloper/gatsby-netlify-okta-example`.

You can add Git to your Gatsby project using the following commands:

```shell
git init
git add .
git commit -m "Add project to Git"
git remote add origin git@github.com:${user}/${repo}.git
git push origin main
```

Now you can publish your Gatsby site straight from GitHub using [Netlify's create a new site page](https://app.netlify.com/start).

{% img blog/gatsby-netlify-okta/netlify-start.png alt:"Netlify: create new site" width:"800" %}{: .center-image }

You'll be prompted for a Git hosting provider. Click on **GitHub**.

{% img blog/gatsby-netlify-okta/netlify-create.png alt:"Netlify: create site from Git" width:"800" %}{: .center-image }

Find the repository you deployed to.

{% img blog/gatsby-netlify-okta/netlify-find-github-app.png alt:"Netlify: find GitHub repo" width:"700" %}{: .center-image }

Accept all the default deploy settings and click **Deploy site**.

{% img blog/gatsby-netlify-okta/netlify-deploy-settings.png alt:"Netlify: Deploy settings" width:"700" %}{: .center-image }

You'll return to your site's dashboard and the build will be in progress.

{% img blog/gatsby-netlify-okta/netlify-deploy-inprogress.png alt:"Netlify: Deploy in progress" width:"500" %}{: .center-image }

In a couple of minutes, your site will be live!

{% img blog/gatsby-netlify-okta/netlify-deployed.png alt:"Netlify: Deployed!" width:"500" %}{: .center-image }

If you scroll down to the _Production deploys_ section, you can click on the build and see what happened.

{% img blog/gatsby-netlify-okta/netlify-deploy-summary.png alt:"Netlify: Deploy summary" width:"800" %}{: .center-image }

You've built a React app, checked it into source control, and published it to production - that's pretty cool! 

Not only that, but you automated the deployment process. Any changes you push to your GitHub repo will be automatically deployed by Netlify. 😎

## Add Your GitHub Repo as a Netlify CMS Backend

Netlify CMS will need to authenticate with GitHub to save your content changes to your repo.

Modify `static/admin/config.yml` to use your GitHub repo:

```yaml
backend:
  name: github
  repo: your-username/your-repo-name
  branch: main
```

In my case, I used:

```yaml
backend:
  name: github
  repo: oktadeveloper/gatsby-netlify-okta-example
  branch: main
```

Save `config.yml`, commit the change, and push it to your GitHub repo.

```
git add .
git commit -m "Add GitHub Backend"
git push origin main
```

When your changes finish deploying on Netlify (it should take around 30 seconds), navigate to your site's `/admin/` endpoint. You'll be prompted to log in with GitHub.

Click **Login with GitHub** and you'll see a page that says "No Auth Provider Found".

On Netlify, go to **Site settings** and navigate to **Access control** > (scroll down) **OAuth**.

Click **Install provider**. It will prompt you for a client ID and secret. To get this, navigate to [GitHub Developer settings](https://github.com/settings/apps) > **OAuth Apps** > **New OAuth App**.

Register a new application with the following settings:

* Application name: `My Gatsby Blog`
* Homepage URL: `<copy URL from Netlify>`
* Authorization callback URL: `https://api.netlify.com/auth/done`

{% img blog/gatsby-netlify-okta/register-github-app.png alt:"Register GitHub app" width:"550" %}{: .center-image }

Click **Register application** and you'll be provided with the client ID and secret you were looking for.

Copy and paste these values into your Netlify OAuth provider dialog and click **Install**.

Now if you go to your site's `/admin/` endpoint and log in with GitHub, you'll be prompted for authorization. Click the green **Authorize** button at the bottom to continue.

If you see an error the first time it loads, you can ignore it. It happens because no blogs exist. Add a new one and it'll go away. For the path, use something like `/blog/first-post`.

In a terminal window, run `git pull origin main` and you'll see your project is updated with the post you created.

```shell
$ git pull origin main
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 4 (delta 1), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (4/4), done.
From github.com:oktadeveloper/gatsby-netlify-okta-example
 * branch            main     -> FETCH_HEAD
   c1b8722..421a113  main     -> origin/main
Updating c1b8722..421a113
Fast-forward
 blog/1st-post.md | 6 ++++++
 1 file changed, 6 insertions(+)
 create mode 100644 blog/1st-post.md
```

Run `npm start` locally to see the blog at `http://localhost/admin/`. But how can others (without admin access) read it?

## Render Blogs with a New BlogRoll React Component

Create a `src/components/BlogRoll.js` file. This file will contain a React component that queries for blog posts using GraphQL.

```jsx
import React from 'react'
import PropTypes from 'prop-types'
import { Link, graphql, StaticQuery } from 'gatsby'

class BlogRoll extends React.Component {
  render() {
    const { data } = this.props;
    const { edges: posts } = data.allMarkdownRemark;

    return (
      <div className="columns is-multiline">
        {posts &&
          posts.map(({ node: post }) => (
            <div className="is-parent column is-6" key={post.id}>
              <article
                className={`blog-list-item tile is-child box notification ${
                  post.frontmatter.featuredpost ? 'is-featured' : ''
                }`}
              >
                <header>
                  <p className="post-meta">
                    <Link
                      className="title has-text-primary is-size-4"
                      to={post.frontmatter.path}
                    >
                      {post.frontmatter.title}
                    </Link>
                    <span> &bull; </span>
                    <span className="subtitle is-size-5 is-block">
                      {post.frontmatter.date}
                    </span>
                  </p>
                </header>
                <p>
                  {post.excerpt}
                  <br />
                  <br />
                  <Link className="button" to={post.frontmatter.path}>
                    Keep Reading →
                  </Link>
                </p>
              </article>
            </div>
          ))}
      </div>
    )
  }
}

BlogRoll.propTypes = {
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      edges: PropTypes.array,
    }),
  }),
};

const query = () => (
  <StaticQuery
    query={graphql`
      query BlogRollQuery {
        allMarkdownRemark(
          sort: { order: DESC, fields: [frontmatter___date] }
        ) {
          edges {
            node {
              excerpt(pruneLength: 400)
              id
              frontmatter {
                path
                title
                date(formatString: "MMMM DD, YYYY")
              }
            }
          }
        }
      }
    `}
    render={(data, count) => <BlogRoll data={data} count={count} />}
  />
)

export default query
```

Create a new page at `src/pages/blog.js` to serve as the index page for blogs.

```jsx
import React from 'react'

import BlogRoll from '../components/BlogRoll'

class BlogIndexPage extends React.Component {
  render() {
    return (
      <React.Fragment>
        <h1>Latest Posts</h1>
        <section>
          <div className="content">
            <BlogRoll />
          </div>
        </section>
      </React.Fragment>
    )
  }
}

export default BlogIndexPage
```

Then add a link to it in `src/pages/index.js`:

```jsx
import React from 'react'
import { Link } from 'gatsby'

const index = () => {
  return (
    <>
      Hello world!
      <p><Link to="/blog">View Blog</Link></p>
    </>)
}

export default index
```

Restart your Gatsby app using `npm start` and navigate to `http://localhost:8000`.

You'll receive an error because your project doesn't have Markdown support.

```bash
 ERROR #85923  GRAPHQL

There was an error in your GraphQL query:

Cannot query field "allMarkdownRemark" on type "Query".
...
File: src/components/BlogRoll.js:62:9

failed extract queries from components - 0.104s
```

## Add Markdown Support to Gatsby

Gatsby's [Add Markdown Pages docs](https://www.gatsbyjs.com/docs/how-to/routing/adding-markdown-pages/) show the process that it uses to create pages from Markdown files:

1. Read files into Gatsby from the filesystem
2. Transform Markdown to HTML and frontmatter to data
3. Add a Markdown file
4. Create a page component for the Markdown files
5. Create static pages using Gatsby's Node.js `createPage()` API

Install a couple of Gatsby plugins to make this happen.

```shell
npm i gatsby-source-filesystem gatsby-transformer-remark
```

Then configure them in `gatsby-config.js`:

```js
module.exports = {
  plugins: [
    `gatsby-plugin-netlify-cms`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/blog`,
        name: `markdown-pages`,
      },
    },
    `gatsby-transformer-remark`
  ]
}
```

Restart everything and you'll be able to see your blog posts at `/blog`.

{% img blog/gatsby-netlify-okta/blogroll.png alt:"Gatsby blogs" width:"800" %}{: .center-image }

However, if you try to navigate into a blog, it doesn't work because you didn't tell Gatsby to generate pages for each one.

## Use Gatsby's Node API to Generate Static Blog Pages

Create a `gatsby-node.js` in the root directory of your project and add code to create a static page for each blog.

```js
const path = require(`path`);

exports.createPages = async ({actions, graphql, reporter}) => {
  const {createPage} = actions;

  const blogPostTemplate = path.resolve(`src/templates/blog.js`);

  const result = await graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
    }
  `);

  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return
  }

  result.data.allMarkdownRemark.edges.forEach(({node}) => {
    createPage({
      path: node.frontmatter.path,
      component: blogPostTemplate,
      context: {}, // additional data can be passed via context
    })
  })
};
```

You might notice this JavaScript code uses a template at `src/templates/blog.js`. Create this file with the following code in it.

{% raw %}
```jsx
import React from "react"
import { graphql } from "gatsby"
export default function Template({
  data, // this prop will be injected by the GraphQL query below.
}) {
  const { markdownRemark } = data // data.markdownRemark holds your post data
  const { frontmatter, html } = markdownRemark
  return (
    <div className="blog-post-container">
      <div className="blog-post">
        <h1>{frontmatter.title}</h1>
        <h2>{frontmatter.date}</h2>
        <div
          className="blog-post-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        path
        title
      }
    }
  }
`
```
{% endraw %}

Restart your app to see Markdown rendering properly!

{% img blog/gatsby-netlify-okta/1st-post.png alt:"1st Post!" width:"800" %}{: .center-image }

Commit your changes and verify everything works in production.

```shell
git add .
git commit -m "Add /blog and Markdown support"
git push origin main
```

## Add an Account Section

Add an Account section for your site by creating a file at `src/pages/account.js`.

```jsx
import React from 'react'
import { Router } from '@reach/router'
import { Link } from 'gatsby'

const Home = () => <p>Home</p>;
const Settings = () => <p>Settings</p>;
const Account = () => {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>{' '}
        <Link to="/account">My Account</Link>{' '}
        <Link to="/account/settings">Settings</Link>{' '}
      </nav>
      <h1>My Account</h1>
      <Router>
        <Home path="/account"/>
        <Settings path="/account/settings"/>
      </Router>
    </>
  )
};

export default Account
```

Add a link to the account page in `src/pages/index.js`:

```jsx
import React from 'react'
import { Link } from 'gatsby'

const index = () => {
  return (
    <>
      Hello world!
      <p><Link to="/blog">View Blog</Link></p>
      <p><Link to="/account">My Account</Link></p>
    </>)
}

export default index
```

Since this section will have dynamic content that shouldn't be rendered statically, you need to exclude it from the build. Add the following JavaScript to the bottom of `gatsby-node.js` to indicate that `/account` is a client-only route.

```js
exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions;
  
  if (page.path.match(/^\/account/)) {
    page.matchPath = "/account/*";
    createPage(page)
  }
};
```

Restart with `npm start` and you should be able to navigate to this new section.

## Register Your App with Okta

{% include setup/cli.md type="spa" 
   loginRedirectUri="http://localhost:8000/account,http://localhost:9000/account,https://<your-site>.netlify.app/account"
   logoutRedirectUri="http://localhost:8000,http://localhost:9000,https://<your-site>.netlify.app" %}

Gatsby can run on two different ports (8000 and 9000) locally. One is for development and one is for production (invoked with `gatsby build` and `gatsby serve`). You also have your production Netlify site. That's why you need all the redirect URIs and trusted origins. 

## Protect Your Gatsby Account Section with Okta

Install Okta's Sign-In Widget:

```shell
npm i @okta/okta-signin-widget@5.5.2
```

Create a `Login` component in `src/components/Login.js`:

```jsx
import OktaSignIn from '@okta/okta-signin-widget'
import '@okta/okta-signin-widget/dist/css/okta-sign-in.min.css'
import React from 'react'

const config = {
  baseUrl: '<okta-org-url>',
  clientId: '<okta-client-id>',
  logo: '//logo.clearbit.com/gatsbyjs.org',
  redirectUri: typeof window !== 'undefined' && window.location.origin + '/account',
  el: '#signIn',
  authParams: {
    issuer: '<okta-org-url>/oauth2/default',
    scopes: ['openid', 'email', 'profile']
  }
};

export const signIn = typeof window !== 'undefined' && new OktaSignIn(config);

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user: false
    };

    this.signIn = signIn;
  }

  async componentDidMount() {
    this.signIn.remove();
    const tokens = await this.signIn.showSignInToGetTokens();
    await this.signIn.authClient.tokenManager.setTokens(tokens);
    window.location.reload();
  }

  render() {
    return (
      <div id="signIn"/>
    )
  }
}

export default Login
```

Replace the placeholders near the top of this file with your Okta app settings.

```js
const config = {
  baseUrl: '<okta-org-url>',
  clientId: '<okta-client-id>',
  ...
  authParams: {
    issuer: '<okta-org-url>/oauth2/default',
    ...
  }
};
```

For example:

```js
const config = {
  baseUrl: 'https://dev-133337.okta.com',
  clientId: '0oa2ee3nvkHIe8vzX357',
  ...
  authParams: {
    issuer: 'https://dev-133337.okta.com/oauth2/default',
    ...
  }
};
```

Modify `src/pages/account.js` to include an `Account` component that uses `signIn.authClient` to get ID tokens and logout.

```jsx
import React from 'react'
import { navigate, Router } from '@reach/router'
import { Link } from 'gatsby'
import Login, { signIn } from '../components/Login'

const Home = () => <p>Account Information</p>;
const Settings = () => <p>Settings</p>;

class Account extends React.Component {
  constructor(props) {
    super(props);

    this.state = {user: false};
    this.logout = this.logout.bind(this);
  }

  async componentDidMount() {
    const token = await signIn.authClient.tokenManager.get('idToken');
    if (token) {
      this.setState({user: token.claims.name});
    } else {
      // Token has expired
      this.setState({user: false});
    }
  }

  logout() {
    signIn.authClient.signOut().catch((error) => {
      console.error('Sign out error: ' + error)
    }).then(() => {
      this.setState({user: false});
      navigate('/');
    });
  }

  render() {
    if (!this.state.user) {
      return (
        <Login/>
      );
    }

    return (
      <>
        <nav>
          <Link to="/">Home</Link>{' '}
          <Link to="/account">My Account</Link>{' '}
          <Link to="/account/settings">Settings</Link>{' '}
        </nav>
        <h1>My Account</h1>
        <React.Fragment>
          <p>Welcome, {this.state.user}. <button onClick={this.logout}>Logout</button></p>
        </React.Fragment>
        <Router>
          <Home path="/account"/>
          <Settings path="/account/settings"/>
        </Router>
      </>
    )
  }
}

export default Account
```

To prevent Gatsby from trying to server-side render the Sign-In Widget, disable the feature in `gatsby-config.js`:

```json
module.exports = {
  plugins: [
    ...
  ],
  flags: {
    DEV_SSR: false
  }
}
```

Restart your app with `npm start`, open `http://localhost:8000` in a private window, and click on **My Account**. You'll be prompted to log in.

{% img blog/gatsby-netlify-okta/okta-signin.png alt:"Okta Sign-In" width:"800" %}{: .center-image }

Enter your credentials and click **Sign In** to browse the account section. You should also see your name and be able to logout.

{% img blog/gatsby-netlify-okta/okta-authenticated.png alt:"Okta Authenticated" width:"800" %}{: .center-image }

## Fix Gatsby Production Build

To test building your app for production, run `gatsby build`. You'll get an error because Okta's Sign-In Widget doesn't expect to be compiled for server-side rendering.

```shell
failed Building static HTML for pages - 0.792s

 ERROR #95313

Building static HTML failed
```

To fix this, you can exclude it from the compilation process. Modify the webpack build to exclude it from compilation by configuring webpack. Add the JavaScript below to the bottom of `gatsby-node.js`.

```js
exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === 'build-html') {
    // Exclude Sign-In Widget from compilation path
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /okta-sign-in/,
            use: loaders.null(),
          }
        ],
      },
    })
  }
};
```

Try `gatsby build` again, and it should work this time. Run `gatsby serve` to see if the production build works on `http://localhost:9000`. Rejoice when it does!

## Add User Registration

To give people the ability to sign-up for accounts, you have to enable self-service registration in the Okta Admin Console. Run `okta login` and open the returned URL in a browser. Sign in and go to > **Directory** > **Self-Service Registration** to enable this feature.

Modify `src/components/Login.js` to add Okta's user registration feature.

```js
const config = {
  ...
  authParams: {...},
  features: {
    registration: true
  }
};
```

Then build for production and serve it up again.

```shell
gatsby build
gatsby serve
```

You will now see a **Sign Up** link at the bottom of the login form.

{% img blog/gatsby-netlify-okta/okta-signup.png alt:"Okta Sign-Up" width:"800" %}{: .center-image }

Click the link to see the user registration form.

{% img blog/gatsby-netlify-okta/okta-create-account.png alt:"Okta User Registration" width:"800" %}{: .center-image }

Hooray - you did it! Check-in your code and rejoice in your new-found knowledge. 🥳

### Extend Your Gatsby Account Functionality

Armed with Okta for authentication, you could develop features in the account settings of your application. For example, a setting where people can sign up for a newsletter (e.g., with [TinyLetter](https://tinyletter.com/)). You could store this setting in Okta by creating a Node app that uses the [Okta Node SDK](https://github.com/okta/okta-sdk-nodejs) to update user attributes.

In fact, you might even develop a Java or .NET backend to handle this and communicate to it from your Gatsby application using `fetch()` and an OAuth 2.0 access token retrieved from the Sign-In Widget.

```js
async componentDidMount() {
  try {
    const response = await fetch('http://<node-server-url>/user/settings', {
      headers: {
        Authorization: 'Bearer ' + await signIn.authClient.tokenManager.get('accessToken')
      }
    });
    const data = await response.json();
    this.setState({ settings: data.settings });
  } catch (err) {
    // handle error as needed
    console.error(err);
  }
}
```

## Learn More about Netlify, Gatsby, React, and Authentication

_Phew!_ This tutorial packed a punch! 💥👊

You learned how to build a new site with Gatsby, automate its deployment with Netlify, integrate Gatsby with Netlify CMS, process Markdown files, store your files in Git, and use Okta for authentication. Okta leverages OAuth 2.0 and OpenID Connect for its developer APIs. They're awesome! 

You can find the source code for this example on GitHub in the [oktadeveloper/gatsby-netlify-okta-example](https://github.com/oktadeveloper/gatsby-netlify-okta-example) repository.

If you want to make your Gatsby site even more secure, you can use the [Gatsby Netlify plugin](https://www.gatsbyjs.org/packages/gatsby-plugin-netlify/) as it adds a bunch of basic security headers. After installing, configuring, and deploying, you can test your site's security with [securityheaders.com](https://securityheaders.com/).

I learned a bunch about Gatsby and authentication from [Jason Lengstorf](https://twitter.com/jlengstorf) and [Aaron Parecki](https://twitter.com/aaronpk) in their [Add authentication to your apps with Okta](https://youtu.be/7b1iKuFWVSw?t=2264) video.

[Gatsby's documentation](https://www.gatsbyjs.org/docs/) was extremely helpful in writing this post, as was the [Gatsby + Netlify CMS Starter](https://github.com/netlify-templates/gatsby-starter-netlify-cms).

To see how the Okta Sign-In Widget can be customized, check out [developer.okta.com/live-widget](https://developer.okta.com/live-widget).

To learn more about Netlify, React, OAuth 2.0, and OIDC, I recommend some of our other blog posts:

* [How to Configure Better Web Site Security with Cloudflare and Netlify](/blog/2019/04/11/site-security-cloudflare-netlify)
* [Simple User Authentication in React](/blog/2019/03/06/simple-user-authentication-in-react)
* [Build a Basic CRUD App with Node and React](/blog/2018/07/10/build-a-basic-crud-app-with-node-and-react)
* [Create a React Native App with Login in 10 Minutes](/blog/2019/04/11/site-security-cloudflare-netlify)
* [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)

If you liked this tutorial, please follow [@oktadev on Twitter](https://twitter.com/oktadev). We also like to do screencasts and post them to our [YouTube channel](https://youtube.com/c/oktadev). If you have any questions, I'd be happy to answer them in the comments below. 🙂
