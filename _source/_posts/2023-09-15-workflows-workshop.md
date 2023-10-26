---
layout: blog_post
title: "Enterprise Ready Workshop: Automate with no-code Okta Workflows"
author: max-katz
by: advocate
communities: [no-code,javascript]
description: "Add automated reporting with no-code Okta Workflows. Enhance customer satisfaction by enabling custom automation."
tags: [enterprise-ready-workshops, react, express, oidc, workflows, automation, no-code, low-code]
tweets:
- ""
image: blog/workflows-workshop/social.jpg
type: awareness
---

This tutorial is part of the on-demand workshop series. In this workshop, you'll enhance the base Todo application by creating an automated report using Okta's no-code Workflows platform.

{% include toc.md %}


You built a software as a service (SaaS) Todo application: 

{% img blog/workflows-workshop/Workflows_todoapp.jpg alt:"The Todo application showing five tasks" width:"800" %}{: .center-image }

The application allows entering todo items and marking them completed when done. 

But it's missing an important enterprise capability. 

You need to add a report that summarizes all the Todo items for your organization and automatically emails the report once a week. 

The email report looks like this: 

{% img blog/workflows-workshop/Workflows_email_report.jpg alt:"Todo email report showing each todo item from the Todo application with a boolean indicating completed state" width:"800" %}{: .center-image }


In this workshop, you'll enhance the SaaS Todo application by creating an automated report using Okta's no-code Workflows platform. 

You will complete the following steps: 

- Building an Okta Workflows flow and automation
- Scheduling the flow to run periodically
- Enhancing an SaaS Todo application with a new API service
- Calling the API service to retrieve todos items from an application
- Creating a todo summary and sending the summary via email
- Testing the flow

> The workshop uses a local application to make it straightforward to connect to its API without needing to deploy the application in the cloud. 
>
> The local setup is for demonstration purposes only. In the real world, the application would be deployed in the cloud.

|Posts in the enterprise-ready workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise-Ready Workshop: Terraform](/blog/2023/07/028/terraform-workshop) |
| 5. **Enterprise-Ready Workshop: Automate with no-code Okta Workflows** |


## What is Okta Workflows?
[Okta Workflows](https://www.okta.com/platform/workflows/) is a no-code platform that allows building automations to help with identity processes. 

The following are use cases where you can use Workflows. 

**Provision and deprovision app accounts**

When an employee joins your company, Workflows simplifies the task of provisioning their account.

* Automatically create their identity in your apps
* Set user and group entitlements
* Assign shared folder
* Send a message to their manager or a welcome message to the team Slack channel

Similarly, when an employee leaves the company, Workflows can deactivate the user account, transfer their digital assets to a manager, and then deactivate the user account three days later.

**Sequence actions with logic and timing**

Workflows can create non-activated accounts in all apps one week before a new employee's start date and then activate them on their first day.

If an employee leaves your company, Workflows can deactivate the user account, remove their access to all apps except payroll, and then delete the account after a year.

**Send notifications for lifecycle events**

For a lifecycle event such as an app assignment or user suspension, Workflows can notify your IT team through email or Slack.

**Log and share lifecycle events**

\Workflows can query Okta APIs and System Log events, run logic, and even compile data into a CSV file. Then, Workflows can email that file to your teams.

This is a short list of what is possible.

**Okta Workflows flows**

In Workflows, you will create flows. A flow is a sequence of steps to complete a goal. It's similar to a script where every code line is a step to complete a goal. In Workflows, you will build the flow visually without writing any code. 

You will learn about the Workflows building blocks in a few minutes. First, let's create your first flow. 

## Getting access to Okta Workflows
There are two ways to access Workflows. 

1. You might be entitled to Workflows if you already use some Okta products
2. Access to Workflows as part of WIC (Workforce Identity Cloud) trial

**Workflows when using other Okta products**

If you have Okta SSO or Okta UD you might be entitled to Workflows. Check if you can access Workflows by going to **Okta organization > Admin > Workflows > Workflows console**. If you use these products but don't have access to Workflows, please contact your account manager. 

**Okta Workflows as part of WIC (Workforce Identity Cloud) trial**

To sign up for a Workforce Identity Cloud trial:

1. Go to the [Okta Workforce trial page](https://www.okta.com/free-trial/workforce-identity/)
2. Register for a trial to access Workflows

**Opening the Okta Workflows console**

To access Workflows:

1. Sign in to your Okta org
    * If you are using a trial, your org URL can be found in an email with the **Activate your Okta account** subject
    * It has the following format: `https://trial-<ID>.okta.com`. For example `https://trial-6093533.okta.com`
1. Click **Admin** (upper right) to access the Admin console
1. On the right-hand side menu, click **Workflows > Workflows console** to open Workflows


You will see the Workflows home page:

{% img blog/workflows-workshop/Workflows_console_main.jpg alt:"Workflows home page" %}{: .center-image }

## Creating a flow
To start, you will create a new flow. 

1. In the Workflows console, click **Flows** in the top navigation menu
1. Inside the **Default Folder**, click the **+ New Flow** to create a new flow
1. Click **Unnamed** (upper left corner)
1. For the name, enter **Todo Report**
1. It is also a good idea to enter a description **This flow sends automated Todo report email.** 
1. Check the **Save all data that passes through the Flow?** checkbox. You will be using this capability later in this tutorial
1. Click **Save** to save the flow name and description

{% img blog/workflows-workshop/Workflows_create_new_flow.jpg alt:"Creating new flow" %}{: .center-image }

Congratulations, you created a Workflows flow. 

{% img blog/workflows-workshop/Workflows_new_flow_created.jpg alt:"A new Workflows flow" %}{: .center-image }

## Okta Workflows building blocks
Before building the flow, you should learn about Workflows building blocks. 

Each card represents one step in a flow. 

A card has two types of fields: input and output. Input fields accept values. Output fields are values a card produces, which can be passed to subsequent cards.

This is an example of the **Text - Length** card. This card calculates and returns the number of characters in a text string.

- The **text** field is the card's input
- The **length** field is the card's output (the lower grey area)

{% img blog/workflows-workshop/Workflows_Text_Length_card.jpg alt:"The Text-Length card calculates text length" %}{: .center-image }

There are two types of cards:

- App action cards are steps that control other applications or web services. For example, Gmail, Slack, and Jira
- Function cards are steps to interact with, change, or control the data in a flow. Some examples of functions cards:
    - True/False: Evaluate values based on true or false conditions
    -  Flow Control: Manage and manipulate the structure of your flow
    -  Date & Time: Parse and manipulate times and dates
    -  List: Create and iterate over lists of items
    -  Number: Perform mathematical operations
    -  Text: Build, modify, and parse text


Here is again what you are going to build: 

- Calling an API service to retrieve all the todo items
- Creating a message from all the todo items
- Emailing the message
- Set up the flow to run on schedule

Before building the flow, you need to get the Todo application.  

## Setting up the Todo application
In this section, you will complete the following steps:  

1. Getting the Todo application
2. Installing application dependencies
3. Creating the database
4. Adding an organziation to the application
5. Running the application

 
 > If you would like to skip the **Setting up the Todo application** and **Enhancing the application with a new API** steps and jump to the Workflows part, [check out the fully built project on GitHub](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/workflows-workshop-completed). 


**Getting the Todo application**

In this step, you will get the Todo application.

> Read about the tools required for this application in [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started)

There are two ways to get the Todo application: 

  _Option 1: Clone the repository_
  1. Clone the [Todo application](https://github.com/oktadev/okta-enterprise-ready-workshops/) that already has OIDC support implemented. 
  2. Run the following command `git checkout oidc-workshop-complete`
  
  _Option 2: Download the application_
  1. Go to the [okta-enterprise-ready-workshops](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/oidc-workshop-complete) GitHub page
  2. Open the menu for the green **<> Code** button and select **Download Zip**



**Installing application dependencies**

1. Navigate to the folder where you cloned or downloaded the Todo application
    * If you downloaded the zip file, unzip the application file
2. Run the following commands to install application dependencies:

```
npm ci
npm install passport-http-bearer
npm install @types/passport-http-bearer -D
```

**Creating the database**

Run the following command to generate a database and seed it with two users.  

```
npm run init-db
```

> The command will write the application user names and passwords to the console. 



**Adding an organziation to the application**

In a later step, you will enhance the application with a new API service to get all the todo items. The new API retrieves all the todo items belonging to an organization. 

In this step, you will set up an organization in the application database. 

To launch the database viewer: 

1. In a new terminal tab or window, run the following command from the application folder:

```
npx prisma studio
```

You will see the following message:

```
Prisma Studio is up on http://localhost:5555
```

In a new browser window, go to http://localhost:5555 to view the database. The screenshot below shows the application database. The database has two users. 

{% img blog/workflows-workshop/Workflows_prisma_db.jpg alt:"Application database" %}{: .center-image }

To create a new organiziation in the application database: 

1. Click on the **Org** model
2. Click **Add record** to add a new record
3. In the **domain** column, enter **matrix.fake**
4. In the **apikey** column, enter **131313** (you might need to scroll to the right to see this column)
5. In the **User** column, click on **0 User** and select both users to add to this organziation (click outside the list to close it)
5. Click **Save 1 change** button to save the new organization and its API key

The organziation record should look like this (some columns are filtered/hidden to show domain, API, and User columns)

{% img blog/workflows-workshop/Workflows_prisma_db_org_record.jpg alt:"Database with new organization" %}{: .center-image }


You are ready to start the application and create the todo items. 

**Running the application**

To start the Todo application, run the following command from the application folder: 

```
npm start
```

The create serveral todo items:

1. In a browser, go to http://localhost:3000
1. Sign in to the application
    - Use one of the users written to the console in step **Creating the database**
1. Enter several todo items

{% img blog/workflows-workshop/Workflows_todoapp.jpg alt:"Todo application with several items" %}{: .center-image }

You can also use Prisma Studio to view the todo items in the database. 


## Enhancing the Todo application with a new API

In this step, you will add an API service to get all the items belonging to an organization. You will also add authentiation to the API service. 

The automation you will create later in this workshop will use this API service to retrieve the todo items and generate a report. 

1. In the application folder, open the file `apps/api/src/main.ts` in your favorite editor or IDE

**Importing the library for API authentication**

1. At the very top of the file, you will see several import statments. After the last statment, add the following code: 

``` ts
import passportBearer from 'passport-http-bearer';
```

This module allows authenticating HTTP requests using bearer tokens. 

**Setting up bearer token authentication strategy**

1. Go to the end of `main.ts` file and add the following code: 

``` ts
// Workshop code start
const BearerStrategy = passportBearer.Strategy;

passport.use(new BearerStrategy(
  async (apikey, done) => {
    const org = await prisma.org.findFirst({
      where: {
        apikey: apikey
      }
    });

    return done(null, org);
  }
));
```

This code sets up an authentication strategy using an HTTP bearer token. 

We are using the keys to look up the associated orgs. The way this is set up, it supports scaling across customers.

**Adding the API endpoint for retrieving todo items**

1. Right after the code above, add the following code:

``` ts
app.get('/api/org/todos',
  passport.authenticate('bearer'),
  async (req, res) => {
    const todos = await prisma.todo.findMany({
      where: {
        orgId: req.user['id']
      }
    });
    res.json({todos});
});
// Workshop code end
```

This code retrieves all the todo items belonging to an organization. 

Save the changes.

> If you look in the terminal where you started the application, you will see a message that the application detected changes and restarting. 

There is one last step before you start building the automation. In the next section, you will launch an API tunnel. 


## Launching the API in a local tunnel

Workflows runs on the cloud, and this application runs locally on your computer. For Workflows to call the API on your local machine, you need to create a tunnel. 

In a new terminal window (or tab), run the following command to start the tunnel: 

```
npx localtunnel --port 3333
```

The command output will be a random URL in the following format:  

```
your url is: https://some-name.loca.lt
```

For example:

```
your url is: https://swift-waves-hammer.loca.lt
```

> You will be using this URL later. If you restart the tunnel, a new URL will be created that you need to use in your flow. 

> You might see different tunnel URLs used in images in this workshop. 

You are ready to build the automation! 

## Building the Todo Report flow
In this section, you will complete the following steps:  

1. Calling the API service
2. Creating the message
3. Sending the message via email
4. Setting up the flow to run on schedule

**Calling the API service**

In this step, you will add a card to call the API to retrieve all the todo items. 

_Creating a connection to the API service_

In this step, you will create a connection to the API service. 

1. Return to the flow you created
2. Click **Add function** > find the **API Connector (HTTP)** section > select the **Get** card
1. Click **+ New Connection** to create a connection to the API
1. For **Connection Nickname**, enter **Todo API Connector**
1. For **Auth Type**, select **Custom**
    * For **Header Name**, enter **Authorization**
    * For **Header Value**, enter **Bearer 131313**
1. Click **Create** to create a connection

The card API connection is shown at the top: 

{% img blog/workflows-workshop/Workflows_Get_card_connection.jpg alt:"Card connection" %}{: .center-image }


_Setting the service URL_

In this step, you will set the service URL. 

1. For the **URL** field, enter the tunnel URL from step **Opening application API with a tunnel** and append the `/api/org/todos` endpoint. 

For example: 

```
https://swift-waves-hammer.loca.lt/api/org/todos
```

> The tunnel URL will change whenever you restart the tunnel.


Click the **Save** button to save changes.

The **API Connector - Get** card looks like this: 


{% img blog/workflows-workshop/Workflows_Get_card.jpg alt:"The API Connector - Get card" %}{: .center-image }

_Testing the card_

To test the **API Connector - Get** card:

1. Click the ▶️ button at the bottom of the card
2. Press **Test** to test the card and the API service
3. Expand the **Body** field to see the tasks from the application


{% img blog/workflows-workshop/Workflows_Get_card_testing.jpg alt:"Testing the Get card" %}{: .center-image }

To test the  flow: 

1. Click the **Close** button to go back to the
1. Click the **Run** button in the toolbar to run and test the flow

{% img blog/workflows-workshop/Workflows_Run_button.jpg alt:"Workflows Run button to run and test a flow" %}{: .center-image }

The **Execution History** page shows data passed from card to card for each card flow. 

{% img blog/workflows-workshop/Workflows_Get_card_testing_history.jpg alt:"Testing the flow" %}{: .center-image }

In the next section, you will create the text message. 

**Creating the message**

In this step, you will create a text message to send via email. Later, you will modify the message to include a list of all the todos. 

1. In the flow editor, click **Add function > Most popular (category) > Compose**
2. In the **Compose** card, enter the following text:

```
Todo Items
```

> Function cards are steps to interact with, change, or control the data in a flow

The **Compose** card looks like this: 

{% img blog/workflows-workshop/Workflows_Compose_card.jpg alt:"The Compose card" %}{: .center-image }

You can test the **Compose** card. Click the ▶️ button at the bottom of the card. 

Now, let's take the output from the **API Connector - Get** card and pass it to the **Compose** card. The output is not formatted-friendly, but we will fix it later. 

1. Take the **Body** field from the **Get** card and pass it over to the **Compose** card, placing it under the current text
    * Place the cursor after **Todo Items** and press enter to create more space between the lines if needed


{% img blog/workflows-workshop/workflows_get_connect_compose.gif alt:"Passing data to the Compose card" %}{: .center-image }


Click the **Test** button at the top of the flow to test it. 

You will see the output in the **Compose** card. It's not formatted (plain JSON for now), but that's OK. You will fix it in a later step. 

Now that you have two cards on a flow, using the **Flow History**, you can see how data is passed from card to card. 

For now, you build a flow that calls an external API service and displays the output. 

Next, you are going to add a step to email the result. 

{% img blog/workflows-workshop/Workflows_flow_history.jpg alt:"Flow history" %}{: .center-image }

Next, let's work on emailing the message. 

**Sending the message via email**

In this step, you will add a card to send the message you created in the previous step. 

_Adding the Gmail card_

To email the message, you will use the **Gmail** card. 

1. Click **Add app** action
2. Find the **Gmail** app
3. Find and click on the **Send Email** action
4. Click **+ New Connection** and follow the steps to authenticate your Gmail account
    - You need to have access to a Google Workspace account to use this card (not a personal Gmail account)


> App action cards are steps that control other applications or web services. For example, Gmail, Slack, and Jira.

The card looks like this:

{% img blog/workflows-workshop/Workflows_Gmail_Send_card.jpg alt:"The Gmail - Send Email card" %}{: .center-image }


Next, you need to set fields on the **Send Email** card. 

_Setting up the Gmail card_

1. For the **Email** field, enter your email (or any other email you can check)
2. For the **Subject** field, enter **Todo Report**
3. For the **Body** field, connect the output field from the **Compose** card to the **Body** field in **Send Email** card
4. All other fields are optional

_Testing the Gmail card_

To test the **Send Email** card: 

1. Click the ▶️ button on the card. You only need to enter the **Body** field
    * All other fields will carry the information you entered. 
1. Enter any text, and click the **Test** button
1. Check your email

_Testing the flow_
 
The flow looks like this: 

{% img blog/workflows-workshop/Workflows_Todo_report_flow.jpg alt:"The Todo Report flow" %}{: .center-image }

To test the flow, click the **Run** button and check that you received the email. 

The email looks like this: 

{% img blog/workflows-workshop/Workflows_email_report_not_formatted.jpg alt:"An email with the todo report" %}{: .center-image }

The email is not formatted yet. But it's neat that you can call an API, create a message, and email it without writing any code. 

There is one last step left before we make the message look pretty. The step is to make this flow run automatically. 

**Set up the flow to run on schedule**

In this step, you will configure the flow to run on schedule. 

1. In the flow editor, move to the beginning of the flow, to the area before the **API Connector - Get** card
1. In the box where it says **When this happens**, click the **Add event** button
{% img blog/workflows-workshop/Workflows_add_Schedule_card.jpg alt:"Adding the Schedule card" %}{: .center-image }

3. You will see the **Flow Schedule** dialog where you set when to run the flow
{% img blog/workflows-workshop/Workflows_flow_schedule_settings.jpg alt:"Flow schedule" %}{: .center-image }

4. Update the flow to run every **Friday at 9 am local time**
    * You can set a schedule that works for you
    * To test the flow, you don't need to wait for the schedule. You can always use the **Run** button
{% img blog/workflows-workshop/Workflows_flow_schedule_settings2.jpg alt:"Running the flow every Friday at 9 am" %}{: .center-image }

5. Click the **Save** to save the schedule

To see when the flow runs next: 

1. Open the **Flow is OFF** button menu
1. Toggle **Flow is OFF** to **Flow is ON**

{% img blog/workflows-workshop/Workflows_flow_off.jpg alt:"The flow is off" %}{: .center-image }

When the flow is on, you will see a time countdown until its next run:

{% img blog/workflows-workshop/Workflows_flow_on.jpg alt:"The flow is on" %}{: .center-image }

Your flow should look like this: 

{% img blog/workflows-workshop/Workflows_Todo_flow_final_1.jpg alt:"A flow to get the todo summary and send it via email" %}{: .center-image }

> You can turn off the flow while you build it. You can also remove and re-add the **Flow Schedule** card later.

## Updating the flow to send a pretty message
In this section, you will update the flow to send a pretty message. You will complete the following: 

1. Understand the JSON returned from the API service
2. Creating a helper flow
3. Setting up helper flow inputs
4. Building the message
5. Returning the message to the main flow
6. Adding the Reduce card to the main flow

**Understanding the JSON returned from the API service**

The response from the API service looks like this:

```
{
  "todos": [
    {
      "id": 1,
      "task": "Try Workflows tutorial",
      "completed": false,
      "userId": 2,
      "orgId": 1
    },
    {
      "id": 2,
      "task": "Watch a Workflows video",
      "completed": false,
      "userId": 2,
      "orgId": 1
    },
    {
      "id": 3,
      "task": "Build your first automation",
      "completed": false,
      "userId": 2,
      "orgId": 1
    },
    {
      "id": 4,
      "task": "Read Workflows docs",
      "completed": true,
      "userId": 2,
      "orgId": 1
    }
  ]
}
```

The above JSON is an array of objects. To create a pretty message, you need to process each JSON object. You will use the **task** and the **completed** paths for the new message.

You must use a helper workflow in Workflows to process a JSON array. A helper flow is a flow that another flow calls. A helper flow can also participate in a for-each-like logic. 

You will also use the **Reduce** card in Workflows to create a message. The Reduce card works similarly to the [reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) function in JavaScript. 

The reduce function takes a list of values and reduces the list to a single value. You have a list of todo items and must reduce them (and their status) into a single value (message). This message will then be sent via email.

**Creating the helper flow**

In this step, you will create the helper flow. 

1. Click on the **Default Folder** to go back to the folder
2. Click **+ New Flow** to create a new flow
3. Click **Unnamed** (upper left corner)
4. For the name, enter **Todo Report_Helper**
5. Check the **Save all data that passes through the Flow?** checkbox
6. Click the **Save** to save changes

You created another flow. 

A flow becomes a helper flow when the first card (step) is the **Helper Flow** card. 

1. Click the **Add event** button
2. Under **Okta Apps**, select the **Helper Flow** card

Your flow should look like this:
{% img blog/workflows-workshop/Workflows_helper_flow.jpg alt:"A helper flow" %}{: .center-image }

In the next step, you will set up the flow inputs. 

**Setting up helper flow inputs**

In this step, you will define inputs the main flow will pass to the helper flow. 

1. To add a flow input field, click inside the **Click or drag and create** box and enter **Item**
2. Move the mouse over the field type indicated by **Aa**, open the list, and select **Object** from the list
{% img blog/workflows-workshop/workflows_create_helper_flow_inputs.gif alt:"Creating helper flow inputs" %}{: .center-image }3. Under the **Item** field, create two fields:
    - Name: **task**, type: **Text**
    - Name: **completed**, type: **Text**

The **Helper Flow** card should look like this: 

{% img blog/workflows-workshop/Workflows_helper_flow_inputs.jpg alt:"Helper flow inputs" %}{: .center-image }

You need to create one more input field. This will be a new field, not part of the **Item** object.

1. Click inside the **Click or drag to create** box and create the **memo** field. Set its type to **Text** 

The final **Helper Flow** card looks like this:

{% img blog/workflows-workshop/Workflows_helper_flow_inputs_final.jpg alt:"Helper flow with inputs" %}{: .center-image }

Your helper flow is set up to accept two inputs. A JSON object with two fields: **task** and **completed** and a text field (**memo**). 

Next, you are going to create a pretty message. 

**Building the message**

You will use the **Compose** card to create the message in this step. 

1. To add the **Compose** card, click **Add function > Most popular (category) > Compose**
2. Next, place the **memo** field inside the **Compose** card, as shown in the screenshot below
3. Click **Enter** twice
4. Type **>** 
5. Take the **task** field and pass it to the **Compose** card as shown in the screenshot
6. Enter **( )** and inside place the **completed** field

The **Compose** card looks like this: 

{% img blog/workflows-workshop/Workflows_Compose_card_helper_flow.jpg alt:"The Compose card" %}{: .center-image }

**Returning the message to the main flow**

You need to return the message to the **Todo Report** flow using the **Return** card. 

1. Click **Add function > Flow Control (category) > Return**
2. Take the **Output** from the **Compose** card and connect it to the **Return** card

The helper flow looks like this: 

{% img blog/workflows-workshop/Workflows_helper_flow_final.jpg alt:"Completed helper flow" %}{: .center-image }

Next, you will update the main flow to call this helper flow. 

**Using the Reduce card**

In this step, you will update the **Todo Report** flow to call the **Todo Report_Helper** flow.  

_Adding the Reduce card_

1. Open the **Todo Report** flow
1. Click the **+** between the **Get** card and the **Compose** card
1. Select the **calculator icon > List (category) > Reduce** card. 

The flow will look like this:

{% img blog/workflows-workshop/Workflows_add_Reduce_card.jpg alt:"Adding the Reduce card" %}{: .center-image }

_Updating the Get card_

The **Reduce** card expects a list as input.  To pass a todo list from the **Get** card:

1. On the **API Connector - Get** card, add a **todos** field under the **Body** field. 
1. Set the field type to **Object** and also check the **List** option

The new field looks like this: 

{% img blog/workflows-workshop/Workflows_Get_card_adding_todos.jpg alt:"Adding the todos field on the Get card" %}{: .center-image }

_Setting up the Reduce card_

In this stept, you will pass data and configure the **Reduce** card. 

1. Take the **todos** field and connect it to the **list** field on the **Reduce** card
1. For **Helper Flow**, click the **Choose Flow** button 
1. Click on the **Default Folder**, select the **Todo Report_Helper** flow and click **Choose**
1. For the **memo** field, change its type to **Text** and enter **Todo Items** (delete the quotes)
1. For the **Item** field, click the arrow on the right side of the field and select **Item** from the list
{% img blog/workflows-workshop/Workflows_Reduce_card_helperflow_input1.jpg alt:"Selecting the data to send to the helper flow" %}{: .center-image }
1. For the **item** in the output section of the card, set its type to **Text**. 

The **Reduce** card looks like this:

{% img blog/workflows-workshop/Workflows_Reduce_card_final.jpg alt:"The Reduce card" %}{: .center-image } 

_Passing data to the Gmail card card_

To send the list to the **Gmail** card: 

1. Delete the **Compose** card
1. Connect the **item** field from the **Reduce** card to the **Body** field on the **Send Email** card. 

The final flow looks like this:

{% img blog/workflows-workshop/Workflows_Todo_flow_final_with_Reduce.jpg alt:"The Completed Todo Report flow" %}{: .center-image }

**How does the Reduce card work**

A good way to learn how the **Reduce** card works is to look at the **Todo Report_Helper** flow history. Reduce is a way to reduce a list to a single value. In this example, you take a list of todo items and reduce them to a single text message. 

The helper flow will run four times (the number of todo items in the Todo application). 

_First run_

On the first run, the **memo** field is set to:
```
Todo Items
```

The first todo item is added and returned to the main flow:

```
Todo Items

> Try Workflows tutorial (false)
```


{% img blog/workflows-workshop/Workflows_Reduce_flowhistory_test1.jpg alt:"Helper flow first run" %}{: .center-image }

_Second run_

The **memo** field is now set to what was returned after the first run:

```
Todo Items

> Try Workflows tutorial (false)
```

The second todo item is added and returned to the main flow:

```
Todo Item

> Try Workflows tutorial (false)

> Watch a Workflows video (false)
```
{% img blog/workflows-workshop/Workflows_Reduce_flowhistory_test2.jpg alt:"Helper flow second run" %}{: .center-image }

_Third run_

The **memo** field is now set to what was returned after the second run:

```
Todo Items

> Try Workflows tutorial (false)

> Watch a Workflows video (false)
```

The third item is added and returned to the main flow:

```
Todo Items

> Try Workflows tutorial (false)

> Watch a Workflows video (false)

> Build your first automation (false)
```

{% img blog/workflows-workshop/Workflows_Reduce_flowhistory_test3.jpg alt:"Helper flow third run" %}{: .center-image }

_Fourth run_

The **memo** field is now set to what was returned after the third run:

```
Todo Items

> Try Workflows tutorial (false)

> Watch a Workflows video (false)

> Build your first automation (false)
```

The fourth item is added and returned to the main flow:

```
Todo Items

> Try Workflows tutorial (false)

> Watch a Workflows video (false)

> Build your first automation (false)

> Read Workflows docs (true)
```

{% img blog/workflows-workshop/Workflows_Reduce_flowhistory_test4.jpg alt:"Helper flow fourth run" %}{: .center-image }

Since all the items were processed, the **Reduce** card is done and the flow execution moves on to the next card, the **Send Email** card. 

## The complete automation

Congratulations! You built an automation using no-code. 

This is the final **Todo Report** flow: 

{% img blog/workflows-workshop/Workflows_Todo_flow_final_with_Reduce.jpg alt:"The flow continues after the Reduce card processes all the items" %}{: .center-image }

This is the final **Todo Report_Helper** flow: 

{% img blog/workflows-workshop/Workflows_helper_flow_final.jpg alt:"Completed helper flow" %}{: .center-image }

You are ready to test the automation.

## Testing the automation

To test the flow: 

1. Check that the application's front end, back end, and tunnel are running
    - If the tunnel restarted, you need to update the tunnel URL in the **Get** card
2. Turn both the **Todo Report** and the **Todo Report_Helper** flows on
3. Click the **Test** button on the **Todo Report** flow

You will receive an email like this:

{% img blog/workflows-workshop/Workflows_email_report.jpg alt:"Todo email report" %}{: .center-image }

## What you learned
In this workshop, you learned the following:

- Building an Okta Workflows flow and automation
- Scheduling the flow to run periodically
- Enhancing an application with a new API service
- Calling the API service to retrieve todos items from an application
- Creating a todo summary and sending the summary via email
- Testing the flow


## Next steps

Now that you can run the application locally, you are ready to start on a workshop of your choice! Find the workshops you want to participate in:

|Posts in the enterprise-ready workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise-Ready Workshop: Terraform](/blog/2023/07/028/terraform-workshop) |
| 5. **Enterprise-Ready Workshop: Automate with no-code Okta Workflows** |

Ready to become enterprise-ready? Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel to get notified about new workshops. If you have any questions or want to share what workshops/base application tech stacks you'd like to see next, please comment below!

## Okta Workflows resources
More resources to help you learn more about Okta Workflows:

- [Videos](https://youtube.com/playlist?list=PLIid085fSVdvyK8F4xuk49EchBPmAVNHG)
- [Office Hours](https://calendly.com/oktaworkflows/group-office-hours-okta-workflows)
- [Knowledge Base articles](https://support.okta.com/help/s/global-search/%40uri?language=en_US#t=All&sort=relevancy&f:ProductFacet=[Workflows]&f:ContentTypeFacet=[Knowledge%20base])
- [Documentation](https://help.okta.com/wf/en-us/Content/Topics/Workflows/workflows-main.htm)
- [Slack community](http://macadmins.org) (join the #okta-workflows channel)
- Get help from support ([forum](https://support.okta.com/help/s/group/0F91Y000000PueUSAS/workflows?language=en_US), [questions](https://support.okta.com/help/s/global-search/%40uri?language=en_US#t=All&f:ProductFacet=[Workflows]&f:ContentTypeFacet=[Discussions]))
