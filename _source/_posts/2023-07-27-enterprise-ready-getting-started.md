---
layout: blog_post
title: "How to Get Going with the On-Demand SaaS Apps Workshops"
author: alisa-duncan
by: advocate
communities: [devops,security,.net,java,javascript,php,python]
description: "Start your journey to identity maturity for your SaaS applications in the enterprise-ready workshops! This post covers installing and running the base application in preparation for the upcoming workshops."
tags: [enterprise-ready-workshops, react, express]
image: blog/enterprise-ready-getting-started/social.jpg
type: awareness
github: https://github.com/oktadev/okta-enterprise-ready-workshops
---

Having an enterprise-ready SaaS application means your application supports authentication best practices, can scale across multiple customers and users, has automated means to re-create environments, and can securely add enhancements and value-adds your customers expect. Join this free virtual workshop series where we take your SaaS application on a journey of enterprise-ready identity — you'll wear the hat of a SaaS developer preparing your Todo application to support enterprise-level customers who want to use your Todo app within their organizations.

In this post you'll install the necessary tools to build and run the Todo application locally.

## Build enterprise-ready SaaS apps with help from these Okta workshops 

The base application is a minimal "to-do list" built as a B2C application. You'll see workshops to add multi-tenancy with the ability for customers to bring their own Identity Provider to authenticate their workforce, sync customer's users automatically into the Todo app, adding reporting capabilities, and automate environment creation.

You can pick which workshop to participate in and the order in which you participate. Choose the workshops that best address your next most pressing need.

|Posts in the on-demand workshop series|
| --- |
| 1. **How to Get Going with the On-Demand SaaS Apps Workshops** |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |

> We want to ensure you can follow the workshops and focus on understanding how to enhance the application for enterprise use cases, so don't use this base application as a template expecting a production-quality B2C or B2B application - it has some obvious intentional security shortcomings!

{% include toc.md %}

## Build an enterprise-ready SaaS application using ReactJS, Express APIs, and Prisma

While SaaS applications run a range of tech stacks, we'll focus on a React frontend with an API backend for this workshop series.

This application uses [React](https://react.dev/) for the frontend application and [Express](https://expressjs.com/) to build the API backend in [TypeScript](https://www.typescriptlang.org/). We'll need persistent storage, so you'll use [SQLite](https://www.sqlite.org/index.html) for a local database. To make inspecting and changing the database more effortless, you'll use an ORM that comes with a database visualization tool: [Prisma](https://www.prisma.io/). The entire project is in a [Nx workspace](https://nx.dev/) so you can manage the whole application with one set of dependency instructions and scripts to serve the app.

Do you want to see your framework of choice in a workshop? Let us know your preferred tech stack for an enterprise-ready SaaS application in the comments below!

## Install Node.js and required tools

Each tech stack has the required tooling to install on your machine. Depending on the specific workshop you're participating in, you may need some knowledge of JavaScript, REST concepts, and command line operations in addition to the installed tools.

Next, you'll install the required tools, get a local copy of the project, and walk through the commands to start and stop the application.

There's a [companion video for this post](https://youtu.be/FCSNMtLtwRg) that shows the installation process and running the application. 

{% youtube FCSNMtLtwRg %}

### Install Node, npm, and npx

You'll need [Node.js](https://nodejs.org/en) v18+. When you install Node.js, you'll automatically get npm, a command line tool to install, update, and manage dependencies. npm includes a command called npx, allowing you to run a npm package without installing it locally.

The application was built using Node v18.14.0, npm v9.3.1.

### Git and GitHub (optional)

You can find the source code for the project on [GitHub](https://github.com/). If you want to use source control for your work as you participate in the workshops, you may want to use [Git](https://git-scm.com/) and create a GitHub account. If you do not want to use Git, you can also download the source code from GitHub as a zip file.

### Code editor/Integrated development environment (IDE)

You will also need a code editor or IDE to make changes to the application. Feel free to use your favorite IDE. It may be helpful for your IDE to have built-in terminal access as there may be command-line operations to run in the workshops.

If you are searching for an IDE, I recommend [Visual Studio Code](https://code.visualstudio.com/).

## Install application dependencies

You can get a local copy of [the project](https://github.com/oktadev/okta-enterprise-ready-workshops) by forking or cloning the repository or downloading a project folder zip file from GitHub. 

To clone the repo, run 

```bash
git clone https://github.com/oktadev/okta-enterprise-ready-workshops.git
```

Once you have a local copy of the code, navigate into the project directory. The project directory is `okta-enterprise-ready-workshops` if you cloned the repository, or `okta-enterprise-ready-workshops-main` if you download a zip file of the repository. Install the required dependencies by running the commands shown below in your terminal:

```bash
cd okta-enterprise-ready-workshops
npm ci
```

The command `npm ci` install the dependencies listed in the `package.json` and uses the versions specified in the `package-lock.json`.

Next, seed the database with two users. Run the script below, and you'll see the users and their passwords written to the command line after the script completes:

```bash
npm run init-db
```

Before you voice concerns about writing the passwords to the console and storing the passwords in plaintext in the database, don't fear! One of the upcoming workshops replaces the username/password local database password store scheme with an enterprise-ready authentication mechanism! 

## Inspect the React and Express Nx TypeScript project

Open the project in your IDE. First, you'll see the README. The README has the npm commands we'll cover next in a quick reference format. 

The React frontend and Express API backend code are in the `apps` directory. Find the React app in `apps/todo-app/src` and the Express code in `apps/api/src/main.ts`.

If you want to peek at the database model, the Prisma schema resides outside the `apps` folder in the `prisma` directory. You can find it in `prisma/schema.prisma`.

## Run the React and Express API base application

You will use npm commands to start the application. Start both the React frontend and Express backend using the npm command below:

```bash
npm start
```

The React frontend todo application serves on `localhost:3000`, so open it up in your favorite web browser. You should see the following sign-in page:

{% img blog/enterprise-ready-getting-started/signin.jpg alt:"Screenshot of initial sign-in" %}{: .center-image }

You will sign in using the email and password of one of the two users, which will navigate you to the Todo app where you can start adding, completing, and deleting todos.

{% img blog/enterprise-ready-getting-started/todolist.jpg alt:"Screenshot of todo list" %}{: .center-image }

Stop serving the application by entering `Ctrl+c` in the terminal.

### Call the Express API endpoints directly

Some of the workshops only require the API backend. You can access the API on `localhost:3333` to target specific API endpoints using an HTTP client.

You can serve the Express API as part of the application using `npm start` or the `npm run serve-api` command.

## Manage the database using Prisma

You can inspect the database visually and change it using Prisma Studio. To run Prisma Studio, you'll use the `npx` command as shown below:

```bash
npx prisma studio
```

Prisma Studio runs on `localhost:5555` in your web browser. Feel free to take a peek at the users and their todos.

## Next steps on your journey for enterprise-ready identity maturity

Now that you can run the application locally, you're ready to start on a workshop of your choice! Find the workshops you want to participate in:

|Posts in the enterprise-ready workshop series|
| --- |
| 1. **How to Get Going with the Enterprise-Ready SaaS Apps Workshops** |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise-Ready Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |

Ready to become enterprise-ready? Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel to get notified about new workshops. If you have any questions or want to share what workshops/base application tech stacks you'd like to see next, please comment below!
