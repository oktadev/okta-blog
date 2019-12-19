---
layout: blog_post
title: ""
author: 
description: ""
tags: []
tweets:
- ""
- ""
- ""
image: 
---

https://www.gatsbyjs.org/docs/sourcing-from-netlify-cms/


```
npm i -g gatsby@2.18.15
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
