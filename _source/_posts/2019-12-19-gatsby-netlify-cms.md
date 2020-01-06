---
layout: blog_post
title: "Build a Secure Blog with Gatsby and Netlify" // 65
title: "Build a Secure Blog with React, Gatsby, and Netlify" // 63
scores:
 - gatsby 301K
 - gatsby blog 1K
 - gatsby netlify 880
 - gatsby react 2400
author: mraible
description: "This tutorial shows how you to build a secure blog app with Gatsby and Netlify."
tags: [gatsby, netlify, react, jamstack]
tweets:
- "Learn how to build a blog with Gatsby, React, and Netlify in this guide from @mraible."
- "Blogging with Gatsby and Netlify: #JAMStack FTW!"
- "A concise guide on how to build a secure blogging site with @gatsbyjs and @netlify. "
image: 
---

Gatsby is a tool for creating static websites with React. It allows allows you to pull your data from virtually anywhere: content management systems (CMSs), Markdown files, APIs, and databases. It leverages GraphQL and webpack to combine your data and React code to produce static files. 

JAMstack - JavaScript, APIs, and Markup - apps are delivered by pre-rendering files and serving them directly from a CDN, removing the requirement to manage or run web servers.
 
https://www.gatsbyjs.org/docs/sourcing-from-netlify-cms/
https://auth0.com/blog/securing-gatsby-with-auth0/

Okta Single Site Sign on w/ Netlify Access Control & Serverless Functions > https://www.youtube.com/watch?v=cxieiiwms5k


Good example https://github.com/netlify-templates/gatsby-starter-netlify-cms

```
npm install -g gatsby-cli
```

```
gatsby new gatsby-netlify-login gatsbyjs/gatsby-starter-hello-world
```

or 

```
mkdir app
cd app
gatsby new . gatsbyjs/gatsby-starter-hello-world
```

If prompted to choose between yarn and npm, choose npm. Or at least, that's what I did.

```
cd gatsby-netlify-login && npm i netlify-cms-app@2.10.0 gatsby-plugin-netlify-cms@4.1.33
```

In `gatsby-config.js`, register the Netlify CMS plugin:

```js
module.exports = {
  plugins: [`gatsby-plugin-netlify-cms`],
}
```

```
mkdir static/admin
```

Edit `static/admin/config.yml`

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


Run it from the root directory:

```
gatsby develop
```

View site at http://localhost:8080. Edit at http://localhost:8000/admin/

Everything is in-memory at this point. To save to a Git repo:


Create a site on GitHub, for example, I created one at `oktadeveloper/okta-gatsby-netlify-cms-login-example`

```
git init
git add .
git commit -m "Add project to Git"
git remote add origin git@github.com:oktadeveloper/okta-gatsby-netlify-cms-login-example.git
git push origin master
```

Now you can publish your Gatsby site straight from GitHub using [Netlify's create a new site page](https://app.netlify.com/start).


Click on the GitHub button.

[image]

Authorize Netlify

[image]

Select your repo

Use the defaults for your deploy settings and click **Deploy site**.



Netlify CMS will need to authenticate with GitHub to save your content changes to your repo.

Modify `static/admin/config.yml` to use your GitHub repo:

```yaml
backend:
  name: github
  repo: your-username/your-repo-name
```

In my case:

```yaml
backend:
  name: github
  repo: oktadeveloper/okta-gatsby-netlify-cms-login-example
```

save the `config.yml` file, commit the change, and push it to your GitHub repo.`

```
git add .
git commit -m "Add GitHub Repo"
git push origin master
```

[image showing login with GitHub]

[image showing need to configure access]

Settings > Access control > (scroll down) OAuth

Click **Install provider**

GitHub 
Client ID
Client Secret

https://docs.netlify.com/visitor-access/oauth-provider-tokens/#setup-and-settings

In GitHub, go to your account Settings, and click Oauth Applications under Developer Settings (https://github.com/settings/developers)


Register a new application

Set Authorization callback URL https://api.netlify.com/auth/done


https://github.com/netlify/example-gated-content-with-okta


https://www.gatsbyjs.org/docs/adding-markdown-pages/

```
npm i gatsby-source-filesystem gatsby-transformer-remark
```

Fails because no front-matter

```
5:57:59 PM: failed Building static HTML for pages - 0.351s
5:57:59 PM: error Building static HTML failed for path "/hello-world"
5:57:59 PM:    5 | }) {
5:57:59 PM:    6 |   const { markdownRemark } = data // data.markdownRemark holds your post data
5:57:59 PM: >  7 |   const { frontmatter, html } = markdownRemark
5:57:59 PM:      |                                 ^
5:57:59 PM:    8 |   return (
5:57:59 PM:    9 |     <div className="blog-post-container">
5:57:59 PM:   10 |       <div className="blog-post">
5:57:59 PM: 
5:57:59 PM:   WebpackError: TypeError: Cannot destructure property `frontmatter` of 'undefin  ed' or 'null'.
```

https://www.gatsbyjs.org/packages/gatsby-plugin-netlify/ for better security headers

TypeError: Cannot read property 'frontmatter' of null

^^ happens because missing first slash


https://www.codespot.org/how-to-build-a-blog-with-gatsby-and-netlify/

ncu 


 gatsby  ^2.18.12  →  ^2.18.15
 
 
Aaron's video (blank slate): https://youtu.be/7b1iKuFWVSw?t=2264
