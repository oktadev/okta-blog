---
layout: blog_post
title: "Build Secure Agent-to-App Connections with Cross App Access (XAA)"
author: sohail-pathan
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Learn how to securely connect agents to applications using Cross App Access (XAA) in this comprehensive guide."
tags: [xaa, cross-app-access, enterprise-ai, agentic-ai, mcp, oauth, sso]
tweets:
- ""
- ""
- ""
- ""
image: blog/cross-app-access/social.jpg
type: conversion
---

Secure access between independent applications that communicate with each other is a recognized gap in [OAuth 2.0](https://developer.okta.com/docs/concepts/oauth-openid/). Now, with the advent of AI agents that communicate across systems, the need to solve the gap is even greater.

[Cross App Access (XAA)](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm) is a new protocol that lets ISVs enable secure agent-to-app and app-to-app access. Instead of scattered integrations and repeated logins, enterprise IT admins gain centralized control: they can decide what connects, enforce security policies, and see exactly what's being accessed. This unlocks seamless, scalable integrations across apps — whether it's just two like Google Calendar and Zoom, or hundreds across the enterprise.

{% youtube 3VLzeT1EGrg %}

In this post, we'll go hands-on with Cross App Access. Using **Todo0** (Resource App) and **Agent0** (Requesting App) as our sample applications, and **Okta as the enterprise Identity Provider (IdP)**, we'll show you how to set up trust, exchange tokens, and enable secure API calls between apps. By the end, you'll not only understand how the protocol works but also have a working example you can adapt to your own integrations.

If you'd rather watch a video of the setup and how XAA works, check this one out. 
{% youtube vi5JpbGRATE %}

## Prerequisites

1. **Okta Developer Account (Integrator Free Plan)**: You'll need an Okta Developer Account with the Integrator Free Plan. This account will act as your Identity Provider (IdP) for setting up Cross-App Access.  
   * If you don't already have an account, sign up for a new one here: [Okta Integrator Free Plan](https://developer.okta.com/signup)  
   * Once created, log in to your new org.

2. **AWS Credentials:** You'll need an **AWS Access Key ID** and **AWS Secret Access Key**.  
   * The IAM user or role associated with these credentials must have access to **Amazon Bedrock,** specifically the **Claude 3.7 Sonnet model,** enabled.  
   * If you don't know how to obtain the credentials, [follow this guide](https://github.com/oktadev/okta-cross-app-access-mcp/blob/main/guide/aws-bedrock.md).

3. **Developer Tools:** These tools are essential for cloning, editing, building, and running your demo applications:  
   * **[Git](https://git-scm.com/downloads)** – to clone and manage the repository.  
   * **[VS Code](https://code.visualstudio.com/Download)** – for reading and modifying the sample source code.  
   * **[Dev Containers Extension (VS Code)](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)** – recommended, as it automatically configures dependencies and environments when you open the project.  
   * **[Docker](https://www.docker.com/products/docker-desktop/)** – required by the Dev Container to build and run the sample applications in isolated environments

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create applications in Okta Admin Console

Before we dive into the code, we need to register our apps with Okta. In this demo:

* **Agent0** → the **requesting app** (makes the API call on behalf of the user).  
* **Todo0** → the **resource app** (owns the protected API).  
* **Managed connection** → the trust relationship between the two apps, created in Okta.

We'll create both apps in your Okta Integrator Free Plan account, grab their client credentials, and then connect them.

### Enable Cross App Access (Early Access)

>⚠️ **Note:** Cross App Access is currently a **self-service Early Access (EA) feature**. It must be enabled through the Admin Console before the apps appear in the catalog. If you don't see the option right away, refresh and confirm you have the necessary admin permissions. Learn more in the [Okta documentation on managing EA and beta features](https://help.okta.com/oie/en-us/content/topics/security/manage-ea-and-beta-features.htm).

1. Sign in to your Okta Developer Account.  
2. In the **Okta Admin Console**, select  **Settings → Features**.  
3. Navigate to **Early access**.  
4. Find **Cross App Access** and select **Turn on** (enable the toggle).  
5. Refresh the Admin Console.

> TODO - add image

### Create the Resource App (Todo0)

1. In the Okta Admin console, navigate to **Applications → Applications**.  
2. Select **Browse App Catalog**.  
3. Search for **Todo0 \- Cross App Access (XAA) Sample Resource App**, and select it.  
4. Select **Add Integration**.  
5. Enter **Todo0** in the Application label field and click **Done.**  
6. Click the **Sign On** tab to view the **Client ID** and **Client** **secret**. These are required to include in your `.env.todo`

> TODO - add image

### Create the Requesting App (Agent0)

1. Go back to **Applications → Applications**.  
2. Select **Browse App Catalog**.  
3. Search for **Agent0 \- Cross App Access (XAA) Sample Requesting App**, and select it.  
4. Select **Add Integration**.  
5. Enter **Agent0** in the Application label field and click **Done.**  
6. Click the **Sign On** tab to view the **Client ID** and **Client** **secret**. These are required to be included in your `.env.agent`

> TODO - add image

### Connect Agent0 ↔ Todo0

1. From the **Applications** page, select the **Agent0** app.  
2. Go to the **Manage Connections** tab.  
3. Under **App granted consent**, select **Add requesting apps**, select **Todo0**, then **Save**.  
4. Under **Apps providing consent**, select **Add resource apps**, select **Todo0**, then **Save**.

> TODO - add image

Now **Agent0** and **Todo0** are connected. If you check the **Manage Connection** tab for either app, you'll see that the connection has been established.

## Create a user

Now that the apps are in place, we need a test user who will sign in and trigger the Cross App Access flow.

### Create the test user

1. In the **Okta Admin Console**, go to **Directory \> People**.  
2. Select **Add Person**.  
3. Fill in the details:  
   * **First name:** Bob  
   * **Last name:** Tables  
   * **Username / Email:** `bob@tables.fake`  
4. Under **Activations**, select **Activate now**,  mark **☑️ I will set password,** and create a temporary password.  
5. Optional: You can mark **☑️ User must change password on first login**   
6. Select **Save**. (If you don't see the new user right away, refresh the page.)

### Assign the Okta applications to the user

1. Open the **Bob Tables** user profile.  
2. Select **Assign Applications**.  
3. Assign both **Agent0** (requesting app) and **Todo0** (resource app) to Bob.

>TODO - add image

This ensures Bob can log in to Agent0, and Agent0 can securely request access to Todo0 on his behalf.

>**⚠️ Note: Bob will be the identity we use throughout this guide to demonstrate how Agent0 accesses Todo0's API through Cross App Access.**

## Clone and configure the project

With your Okta environment (apps and user) ready, let's set up the local project. Before we dive into configs, here's a quick look at what you'll be working with.

1. Clone the repository:

```shell
git clone https://github.com/oktadev/okta-cross-app-access-mcp
```

2. Change into the project directory:

```shell
cd okta-cross-app-access-mcp
```

3. Open **VS Code Command Palette** and run **"Dev Containers: Open Folder in Container**". To open Command Palette, select View \> Command Palette..., MacOS keyboard shortcut `Cmd+Shift+P`, or Windows keyboard shortcut \`Ctrl+Shift+P\`

>⚠️ Note: This sets up all dependencies, including Node, Redis, Prisma ORM, and Yarn.

>TODO - add image

### What's in the repo (at a glance)

```shell
okta-cross-app-access-mcp/
├─ packages/
│  ├─ agent0/               # Requesting app (UI + service) – runs on :3000
│  │  └─ .env               # Agent0 env (AWS creds)
│  ├─ todo0/                # Resource app (API/UI) – runs on :3001
│  ├─ authorization-server/ # Local auth server for ID-JAG + token exchange
│  │  └─ .env.agent         # IdP creds (Agent0 side)
│  │  └─ .env.todo          # IdP creds (Todo0 side)
│  ├─ id-assert-authz-grant-client/ # Implements Identity Assertion Authorization Grant client logic
├─ .devcontainer/           # VS Code Dev Containers setup
├─ guide/                   # Docs used by the README
├─ images/                  # Diagrams/screens used in README
├─ scripts/                 # Helper scripts
├─ package.json             
└─ tsconfig.json
```

## Configure environment files

At this point, you have:

* **Client IDs and Client Secrets** for both **Agent0** and **Todo0** (from the Okta Admin Console).  
* Your **Okta org URL**, visible in the top-right profile menu of the Admin Console. It usually looks like:

```
https://integrator-123456.okta.com
```

This URL will be your **IdP issuer URL** and is shared across both apps.

### Generate env files

From the project root, run:

```shell
yarn setup:env
```

This scaffolds the following files:

* `packages/authorization-server/.env.todo`  
* `packages/authorization-server/.env.agent`  
* `packages/agent0/.env`

### Fill required values

Open each file and update the placeholder with your org-specific values:

**`authorization-server/.env.todo`**

```
CUSTOMER1_EMAIL_DOMAIN=tables.fake
CUSTOMER1_AUTH_ISSUER=<Your integrator account URL>
CUSTOMER1_CLIENT_ID=<Todo0 client id>
CUSTOMER1_CLIENT_SECRET=<Todo0 client secret>
```

**`authorization-server/.env.agent`**

```
CUSTOMER1_EMAIL_DOMAIN=tables.fake
CUSTOMER1_AUTH_ISSUER=<Your integrator account URL>
CUSTOMER1_CLIENT_ID=<Agent0 client id>
CUSTOMER1_CLIENT_SECRET=<Agent0 client secret>
```

**`agent0/.env`**

```
AWS_ACCESS_KEY_ID=<your AWS access key id>
AWS_SECRET_ACCESS_KEY=<your AWS secret access key>
```

> **⚠️ Note:**
>1. The **issuer URL** (`CUSTOMER1_AUTH_ISSUER`) is the same in both `.env.todo` and `.env.agent`.    
>2. The **Client ID/Client secret** values differ because they come from the respective apps you created.   
>3. AWS credentials are required only for Agent0 (requesting app).

### Register redirect URIs in Okta

Finally, we need to tell Okta where to send the authentication response for each app.

1. From your Okta Admin Console, navigate to **Applications > Applications**.  
2. Open the **Agent0** app.  
3. Navigate to the **Sign On** tab.  
4. In the **Settings** section, select **Edit**.  
5. In the **Redirect URIs** field, add:

```
http://localhost:5000/openid/callback/customer1
```

6. Select **Save**.

Repeat the same steps for **Todo0**:

1. Open the **Todo0** app.  
2. Go to the **Sign On** tab → **Settings** → **Edit**.  
3. In the **Redirect URIs** field, add:

```
http://localhost:5001/openid/callback/customer1
```

4. Select **Save**.

Now both apps know where to redirect after authentication.

## Initialize the database and run the project

### Bootstrap the project 

From the root of the repo, install all workspaces and initialize the databases:

```shell
yarn bootstrap
```

Since this is your first run, you'll be asked whether to reset the database. Type "`y`" for both Todo0 and Agent0.

###  Run and access the apps in your browser

Once the bootstrap is complete, start both apps (and their authorization servers) with:

```shell
yarn start
```

Open the following ports in your Chrome browser's tab:

* **Todo0 (Resource App):** [http://localhost:3001](http://localhost:3001)  
* **Agent0 (Requesting App):** [http://localhost:3000](http://localhost:3000)

At this point, both apps should be live and connected through Okta. 🎉

## Test Cross App Access (XAA)

With everything configured, it's time to see Cross App Access in action.

### Interact with Todo0

1. In the **Work Email** field, enter: [bob@tables.fake](mailto:bob@tables.fake), and select **Continue**.  TODO - add image
2. You'll be redirected to the Okta Login page. Sign in with the test user credentials:  
   * **Username:** `bob@tables.fake`  
   * **Password:** the temporary password you created earlier.  
3. The first time you sign in, you'll be prompted to:  
   * Set a new password.  
   * Enroll in [**Okta Verify**](https://help.okta.com/en-us/content/topics/mobile/okta-verify-overview.htm) for MFA.  
4. Once logged in, add several tasks to your to-do list.   
5. Select one of the tasks and mark it as complete to verify that the application updates the status accurately. TODO - add image

### Let Agent0 access your todo's

1. Open the **Agent0** app in your browser. TODO - add image
2. Select **Initialize** to set up the AWS Bedrock client. Once connected, you'll see the following message:  `✅ Successfully connected to AWS Bedrock! You can now start chatting.`  
3. Select the **Connect to IdP** button.  
   * Behind the scenes, Agent0 requests an identity assertion from Okta and exchanges it for an access token to Todo0.  
   * If everything is configured correctly, you'll see the following message: `Authentication completed successfully! Welcome back.`
    TODO - add image
4. To confirm that **Agent0** is actually receiving tokens from Okta:  
    * Open a new browser tab and navigate to: `http://localhost:3000/api/tokens`  
    * You should see a JSON payload containing: **`accessToken`, `jagToken`, and `idToken`.** This verifies that Agent0 successfully authenticated through Okta and obtained the tokens needed to call Todo0.  
    TODO - add image
5. Now interact with Agent0 using natural prompts. For example: write this prompt 

```
What's on my plate in my to-do list?
```

> **⚠️ Note:** Agent0 will call the Todo0 API using the access token and return your pending tasks.  

TODO - add image

6. Let's try some more prompts:  
   * Ask Agent0 to **add a new task**.  
   * Ask it to **mark an existing task complete**.  
   * Refresh the Todo0 app — you'll see the changes reflected instantly.

TODO - add image

## Behind the scenes

**✅ Bob Tables** logs in once with Okta.  
⏩ **Agent0 (requesting app)** gets an identity assertion from Okta.  
🔄 Okta vouches for Bob and exchanges that assertion for an access token.  
👋 **Agent0** uses that token to securely call the **Todo0 (resource app)** API.

{% img blog/cross-app-access/mermaid.svg alt:"Illustration showing secure agent-to-app connections using Okta Cross App Access" width:"782" %}

🎉 Congratulations\! You've successfully configured and run the Cross App Access project.

## Support

If you run into any issues while setting up or testing this project, feel free to post your queries to the forum: 👉 [Okta Developer Forum](https://devforum.okta.com)

If you're interested in implementing **Cross App Access (XAA)** in your own application — whether as a **requesting app** or a **resource app** — and want to explore how Okta can support your use case, reach out to us at: 📩 **[xaa@okta.com](mailto:xaa@okta.com)**

## Next Steps

If this walkthrough helped you understand how Cross-App Access works in practice, you might enjoy diving deeper into the standards and conversations shaping it. Here are some resources to continue your journey:

* 📘 [Cross-App Access Documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm) – official guides and admin docs to configure and manage Cross-App Access in production.
* 🎙️ [Developer Podcast on MCP and Cross-App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s) – hear the backstory, use cases, and why this matters for developers.
* 📄 [OAuth Identity Assertion Authorization Grant (IETF Draft)](https://www.ietf.org/archive/id/draft-parecki-oauth-identity-assertion-authz-grant-05.html) – the emerging standard that powers this flow.


Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev), [Twitter](https://twitter.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel to see more content like this. If you have any questions, please comment below\!