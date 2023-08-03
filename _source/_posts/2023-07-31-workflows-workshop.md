---
layout: blog_post
title: "Enterprise Ready Workshop: Automate with with no-code Okta Workflows"
author: max-katz
by: advocate
communities: [no-code,javascript]
description: "Add automated reporting with no-code Okta Workflows. Enhance customer satisfaction by enabling custom automation."
tags: [enterprise-ready-workshops, workflows, no-code, low-code]
tweets:
- ""
image: blog/workflows-workshop/social.jpg
type: awareness
---

This tutorial is part of the Enterprise-ready workshop series. In this workshop, you'll enhance the base Todo application by creating an automated report using Okta's no-code Workflows. 

You built the following Todo application: 

{% img blog/workflows-workshop/Workflows_todoapp.jpg alt:"The Todo application you built showing tasks to try workflows, watch a workflows video, build your first animation, and read the workflows docs" width:"800" %}{: .center-image }
You need to add one additional enterprise capability. You need to add a todo report that summarizes all the todo items for your organization and automatically emails the report once a week. 

The email report looks like this: 

{% img blog/workflows-workshop/Workflows_email_report.jpg alt:"Todo email report showing each todo item from the Todo application with a boolean indicating completed state" width:"800" %}{: .center-image }

|Posts in the enterprise-ready workshop series|
| --- |
| 1. [How to get Going with the Enterprise-Ready Identity for SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise-Ready Workshop: Terraform](/blog/2023/07/028/terraform-workshop) |
| 5. **Enter-Ready Workshop: Automate with no-code Okta Workflows** |
**What you need to complete the workshop**
You need access to the following tools to complete this workshop. 

- The completed todo application ([download](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/oidc-workshop-completed))
- Access to Okta Worklfows. You will learn how to gain access to Workflows in a later section

You'll also want to ensure you're up and running with the base Todo application by following [How to Get Going with the Enterprise-Ready Identity for SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started).

## What is Okta Workflows?
[Okta Workflows](https://www.okta.com/platform/workflows/) is a no-code platform that allows building automation to help with identity processes. For example, you can build the following workflows without asking IT or developers for help:

- Reset password end user sessions when suspicious activity is detected
- Give or remove user access to applications
- Send notifications (Slack, email, and others) when a user is activated or suspended (this tutorial)
- Create basic reports

This is a short list of what is possible.

### Workflows flows
In Workflows, you will be building flows. A flow is a sequence of steps to complete a goal. It's similar to a  script where every code line is a step to complete a goal. In Workflows, you will build the flow visually without writing any code. 

You will learn about the Workflows building blocks in a few minutes. First, let's create your first flow. 

## Getting access to Workflows
There are two ways to access Workflows. 

1. You might be entitled to Workflows if you already use some Okta products
2. Access to Workflows as part of WIC (Workforce Identity Cloud) trial


### Workflows when using other Okta products
If you have Okta SSO or Okta UD you might be entitled to Workflows. Check if you can access Workflows by going to **Okta organization > Admin > Workflows > Workflows console**. If you use these products but don't have access to Workflows, please contact your CSM

### Workflows as part of WIC trial
To sign up for a WIC trial:

1. Go to the [Okta Workforce trial page](https://www.okta.com/free-trial/workforce-identity/)
2. Register for a trial to access Workflows

### Opening the Workflows console

To access Workflows:

1. Go to **Okta organization > Admin > Workflows > Workflows**

You will see the Workflows home page:


{% img blog/workflows-workshop/Workflows_console_main.jpg alt:"Workflows home page" %}{: .center-image }
## You will build
In this workshop, you will learn how to build an automated email report in Okta Workflows. You will learn and complete the following steps to build the automated report: 

- Build your first Workflows flow
- Set up the flow to run on schedule
- Call the application API service to retrieve todo items
- Create a todo summary and email the summary
- Test the flow

**Note:**
> 
This workshop uses a locally deployed application and its API.

> The workshop uses a local application to make it straightforward to connect to its API without needing to deploy the application in the cloud. 

> The local setup is for demonstration purposes only. In the real world, the application would be deployed in the cloud.

## Creating a new flow
To start, you will create a new flow. 

1. In the Workflows console, click **Flows** in the top navigation menu
2. In the **Folders** panel, use the **+** to create a new folder
3. For the folder name, enter **Enterprise workshop**. Click the **Save** button to create a new folder
4. Inside the folder, Click **+ New Flow** to create a new flow
5. Click **Unnamed** (upper left corner)
6. For the name, enter **Todo Report**
7. It is also a good idea to enter a description **This flow sends automated todo report email** 
8. Check the **Save all data that passes through the Flow?** checkbox. You will be using this capability at the end of this tutorial
9. Click **Save** to save the flow name and description

{% img blog/workflows-workshop/Workflows_create_new_flow.jpg alt:"Creating new flow" %}{: .center-image }
Congratulations, you created a Workflows flow. 

{% img blog/workflows-workshop/Workflows_new_flow_created.jpg alt:"A new Workflows flow" %}{: .center-image }
## Workflows building blocks
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

Before you start building the flow, you need to get the Todo application.  

## Getting the Todo application
In this section, you will: 

1. Download Todo application
2. Launch the application
3. Populate the application with todo items


### Downloading the Todo application
In this step, you will download the Todo application.

1. [Download](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/oidc-workshop-completed) the Todo application

### Launching the Todo application

You will complete the following steps to launch the application: 
- Installing application dependencies
- Creating the database
- Starting the application

#### Installing application dependencies

1. Navigate to a folder where you downloaded the application zip file
2. Unzip the application zip file
3. Run the following commands to install application dependencies:
```
npm ci
npm install passport-http-bearer
npm install @types/passport-http-bearer -D
```

#### Creating the database

Run the following command to generate a database and seed it with two users.  The user's name and password will write to the console.
```
npm run init-db
```

The users are 
- User: trinity@whiterabbit.fake, password: Zion
- User: bob@tables.fake, password: correct horse battery staple

If you need to peek into the database, run the following command:
```
npx prisma studio
```

#### Starting the application

To start both the front end and the API back end, run the following command:

```
npm start
```

#### Accessing application API with a tunnel

Workflows is running on the cloud, and this application runs locally on your computer. For Workflows to be able to call the API on your local machine, you need to create a tunnel. 

In a new terminal window (or tab), run the following command to start the tunnel: 

```
npx localtunnel --port 3333
```

The command output will be: 

```
your url is: https://some-name.loca.lt
```

For example:

```
your url is: https://curvy-clowns-show.loca.lt
```

**Note**: 

> You will be using this URL later. If you relaunch the tunnel, a new URL will be created that you need to use in Workflows. 

### Populating the todo items


In this step, you will create several todo items. 

1. In a browser, go to http://localhost:3000
2. Sign in to the application. You can use one of the following users:
    - User: trinity@whiterabbit.fake, password: Zion
    - User: bob@tables.fake, password: correct horse battery staple
3. Enter several todo items


{% img blog/workflows-workshop/Workflows_todoapp.jpg alt:"Todo application with several items" %}{: .center-image }
## Building the Todo Report flow
In this section, you will build a flow that does the following: 

1.Calls an API service
2.Creates a message
3.Sends the message via email
4.Update the flow to run on schedule

### Calling the API service

In this step, you will add a card to call the application API end point to retrieve all the todo items.
 

1. Return to the flow you created
2. Click **Add function** > find the **API Connector (HTTP)** section > select the **Get** card
3. For the **URL** field, enter the tunnel URL from step **Opening application API with a tunnel** and append the 
`/api/org/todos` endpoint. 
    - For example `https://curvy-clowns-show.loca.lt/api/org/todos`
    - **Note:** the tunnel URL will change whenever you restart the tunnel
4. For the **Headers** field, enter the authorization token: 

```
{
   "Authorization": "Bearer 131313"
}
```

Click the **Save** button to save changes


{% img blog/workflows-workshop/Workflows_Get_card.jpg alt:"The API Connector - Get card" %}{: .center-image }
You can test the **Get** card. 

1. Click the ▶️ button at the bottom of the card
2. Press Test to test the card and the API service
3. Expand the Body field to see the tasks from the application


{% img blog/workflows-workshop/Workflows_Get_card_testing.jpg alt:"Testing the Get card" %}{: .center-image }
You can also test the flow. Click the **Close** button to go back to flow editing. Click the **Test** button to test the flow. 

The **Flow History** page shows data passed from card to card for each card flow. 

{% img blog/workflows-workshop/Workflows_Get_card_testing_history.jpg alt:"Testing the flow" %}{: .center-image }
In the next section, you will create the text message. 

### Creating the message

In this step, you will create a text message to send via email. Later, you will modify the message to include a list of all the todos. 

1. In the flow editor, click **Add function > Most popular (category) > Compose**
2. In the **Compose** card, enter the following text:

```
Todos Items
```

Your card should look like this: 

https://katzmax.files.wordpress.com/2023/07/workflows_compose_card.png

{% img blog/workflows-workshop/Workflows_Compose_card.jpg alt:"The Compose card" %}{: .center-image }
If you want, you can test the **Compose** card. Click the ▶️ button at the bottom of the card. 

Now, let's take the output from the **API Connector - Get** card and pass it to the **Compose** card. The output is not formatted-friendly, but we will fix it later. 

1. Take the **Body** field from the **Get** card and pass it over to the **Compose** card, placing it under the current text

{% img blog/workflows-workshop/workflows_get_connect_compose.gif alt:"Passing data to the Compose card" %}{: .center-image }
Now, click the **Test** button at the top of the flow to test it. 

You will see the output in the **Compose** card. It's not formatted (plain JSON for now), but that's OK. You will fix it in a later step. 

Now that you have two cards on a flow, using the **Flow History**, you can see how data is passed from card to card. 

For now, you build a flow that calls an external API service and displays the output. Next, you are going to add a step to email the result. 

{% img blog/workflows-workshop/Workflows_flow_history.jpg alt:"Flow history" %}{: .center-image }
Next, let's work on emailing the message. 

### Sending the message via email

In this step, you will add a card to send the message you created in the previous step. 

To email the message, you are going to use the **Gmail** card. 

1. Click **Add app** action
2. Find the **Gmail** app
3. Find and click on the **Send Email** action
4. Click **+ New Connection** and follow the steps to authenticate your Gmail account
    - You need to have access to a Google Workspace account to use this card (not a personal Gmail account)

The card should look like this when added:

{% img blog/workflows-workshop/Workflows_Gmail_Send_card.jpg alt:"The Gmail - Send Email card" %}{: .center-image }
Next, you need to set fields on the **Send Email** card. 

1. For the **Email** field, enter your email (or any other email you can check)
2. For the **Subject** field, enter **Todo Report**
3. For the **Body** field, connect the output field from the **Compose** card to the **Body** field in **Send Email** card
4. All other fields are optional
5. Let's test the **Send Email** card. Click the ▶️ button on the card. You only need to enter the **Body** field. All other fields will carry the information you entered. Enter any text and click the **Test** button. Now check your email.
 
The flow should look like this: 

{% img blog/workflows-workshop/Workflows_Todo_report_flow.jpg alt:"The Todo Report flow" %}{: .center-image }
Go ahead and test the flow. Click the **Test** button and check that you received the email. 

You should receive an email that looks like this: 

{% img blog/workflows-workshop/Workflows_email_report_not_formatted.jpg alt:"An email with the todo report" %}{: .center-image }
The email is not formatted yet. But it's neat that you can call an API, create a message, and email it without writing any code. 

There is one last step left before we make the message look pretty. The step is to make this flow run automatically. 

### Running the flow on schedule

You need this flow to run on schedule. For example, you want to run this flow every Friday at 9 am local time. 

1. In the flow editor, move to the beginning of the flow, to the area before the **API Connector - Get** card
2. In the box where it says **When this happens**, click the **Add event** button
{% img blog/workflows-workshop/Workflows_add_Schedule_card.jpg alt:"Adding the Schedule card" %}{: .center-image }3. You will right away see a Flow Schedule dialog where you can set when to run the flow
{% img blog/workflows-workshop/Workflows_flow_schedule_settings.jpg alt:"Flow schedule" %}{: .center-image }4. Update the flow to run every **Friday at 9 am local time**. Feel free to set a schedule that works for you. To test the flow, you don't need to wait for the schedule. You can always use the **Test** button
{% img blog/workflows-workshop/Workflows_flow_schedule_settings2.jpg alt:"Running the flow every Friday at 9 am" %}{: .center-image }5. Click the **Save** button to save the schedule
6. To see when the flow runs next, toggle the **Flow is OFF**

{% img blog/workflows-workshop/Workflows_flow_off.jpg alt:"The flow is off" %}{: .center-image }
When the flow is on, you will see the next time it runs: 

{% img blog/workflows-workshop/Workflows_flow_on.jpg alt:"The flow is on" %}{: .center-image }
Your flow should look like this: 

{% img blog/workflows-workshop/Workflows_Todo_flow_final_1.jpg alt:"A flow to get the todo summary and send it via email" %}{: .center-image }
## Updating the flow to send a pretty message
In this section, you will update the flow to send a pretty message. You will complete the following: 

1. Understand the JSON returned from the API service
2. Creating a helper flow
3. Setting up helper flow inputs
4. Building the message
5. Returning the message to the main flow
6. Adding the Reduce card to the main flow

### Understanding the JSON returned from the API service
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

To process a JSON array, you must use a helper workflow in Workflows. A helper flow is a flow that another flow calls. A helper flow can also participate in a for-each-like logic. 

You will also use the **Reduce** card in Workflows to create a message. The Reduce card works similarly to the [reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) function in JavaScript. 

The reduce function takes a list of values and reduces the list to a single value. You have a list of todo items and must reduce them (and their status) into a single value (message). This message will then be sent via email.

### Creating the helper flow
In this step, you will create the helper flow. 

1. Click on the Flows at the top navigation bar to exit back to the folder
2. Click + New Flow to create a new flow
3. Click Unnamed (upper left corner)
4. For the name, enter Todo Report_Helper
5. Check the Save all data that passes through the Flow? Checkbox
6. Click the Save button to save all the changes

You created another flow. 

A flow becomes a helper flow when the first card (step) is the **Helper Flow** card. 

1. Click the **Add event** button
2. Under **Okta Apps**, select the **Helper Flow** card

Your flow should look like this:
{% img blog/workflows-workshop/Workflows_helper_flow.jpg alt:"A helper flow" %}{: .center-image }
In the next step, you will set up the flow inputs. 

### Setting up helper flow inputs
In this step, you will define inputs the main flow will pass to the helper flow. 

1. To add a flow input field, click inside the **Click or drag and create** box and enter **Item**
2. Move the mouse over the field type indicated by **Aa**, open the list, and select **Object** from the list
{% img blog/workflows-workshop/workflows_create_helper_flow_inputs.gif alt:"Creating helper flow inputs" %}{: .center-image }3. Under the **Item**, create the following two fields:
    - Name: **task**, type: **Text**
    - Name: **completed**, type: **Text**

The **Helper Flow** card should look like this: 

{% img blog/workflows-workshop/Workflows_helper_flow_inputs.jpg alt:"Helper flow inputs" %}{: .center-image }
You need to create one more input field. This will be a new field, not part of the Item object.

1. Click inside the **Click or drag to create** box and create the **memo** field. Set its type to **Text** 

The final **Helper Flow** card looks like this:

{% img blog/workflows-workshop/Workflows_helper_flow_inputs_final.jpg alt:"Helper flow with inputs" %}{: .center-image }
Your helper flow is set up to accept two inputs. A JSON object with two fields: **task** and **completed** and a text field (**memo**). Next, you are going to create a pretty message. 

### Building the message

In this step, you will use the **Compose** card to create the message. 

1. To add the **Compose** card, click **Add function > Most popular (category) > Compose**
2. Next, place the **memo** field inside the **Compose** card, as shown in the screenshot below
3. Click **Enter** twice
4. Type **>** 
5. Take the **task** field and pass it to the **Compose** card as shown in the screenshot
6. Enter **( )** and inside place the **completed** field

The **Compose** card should look like this: 

{% img blog/workflows-workshop/Workflows_Compose_card_helper_flow.jpg alt:"The Compose card" %}{: .center-image }
### Returning the message to the main flow

To complete this flow, you must return the message to the main flow. 

1. To add the **Return** card, click **Add function > Flow Control (category) > Return**
2. Take the **Output** from the **Compose** card and connect it to the **Return** card

The flow should look like this:

{% img blog/workflows-workshop/Workflows_helper_flow_final.jpg alt:"Completed helper flow" %}{: .center-image }
Next, you will update the main flow to call this helper flow. 

### Adding the Reduce card

In this step, you will update the main flow to call the helper flow. 

1. Open the **Todo Report** flow
2. You are going to add the **List - Reduce** card. Click the **+** between the **Get** card and the **Compose** card, select the **calculator icon > List (category) > Reduce** card. Your flow should look like this:
{% img blog/workflows-workshop/Workflows_add_Reduce_card.jpg alt:"Adding the Reduce card" %}{: .center-image }3. On the **Get** card, add **todos** field under the **Body** field. Set the field type to **Object**
{% img blog/workflows-workshop/Workflows_Get_card_adding_todos.jpg alt:"Adding the todos field on the Get card" %}{: .center-image }4. Take the **todos** field and connect it to the list field on the **Reduce** card
5. For **Helper Flow**, click the **Choose Flow** button and select the **Todo Report_Helper** flow
6. For the **memo** field, change its type to **Text** and enter **Todo Items**
7. For the **Item** field, click the arrow on the right side of the field and select **Item** from the list
{% img blog/workflows-workshop/Workflows_Reduce_card_helperflow_input1.jpg alt:"Selecting the data to send to the helper flow" %}{: .center-image }8. For the item in the output section of the card, set its type to **Text**. The **Reduce** card should look like this:
{% img blog/workflows-workshop/Workflows_Reduce_card_final.jpg alt:"The Reduce card" %}{: .center-image }9. Delete the **Compose** card
10. Connect the **item** field from the **Reduce** card to the **Body** field on the **Send Email** card. The final flow should look like this:

{% img blog/workflows-workshop/Workflows_Todo_flow_final_with_Reduce.jpg alt:"The Completed Todo Report flow" %}{: .center-image }
### How does the Reduce card work

A good way to learn how the **Reduce** card works is to look at the **Todo Report_Helper** flow history. Reduce is a way to take a list and reduce it to a single value. In this example, you take a list of todo items and reduce them to a single text message. 

The helper flow will run four times (the number of todo items in the Todo application). 

#### First run

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

#### Second run
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
#### Third run

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
#### Fourth run

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

{% img blog/workflows-workshop/Workflows_Todo_flow_final_with_Reduce.jpg alt:"The flow continues after the Reduce card processes all the items" %}{: .center-image }

## Testing the flow

To test the flow: 

1. Check that the application's front end, back end, and tunnel are running
    - If the tunnel restarted, you need to update the tunnel URL in the **Get** card
2. Turn both the **Todo Report** and the **Todo Report_Helper** flows on
3. Click the **Test** button on the **Todo Report** flow

You will receive an email like this:

{% img blog/workflows-workshop/Workflows_email_report.jpg alt:"Todo email report" %}{: .center-image }
## What you learned
In this tutorial, you built and learned the following:

- Built your first Workflows flow
- Scheduled the flow to run periodically
- Called an API service to retrieve todos items from an application
- Created a todo summary and sent the summary via email
- Tested the flow


## Workflows resources
More resources to help you learn more about Okta Workflows.

- [Videos](https://youtube.com/playlist?list=PLIid085fSVdvyK8F4xuk49EchBPmAVNHG)
- [Office Hours](https://calendly.com/oktaworkflows/group-office-hours-okta-workflows)
- [Knowledge Base articles](https://support.okta.com/help/s/global-search/%40uri?language=en_US#t=All&sort=relevancy&f:ProductFacet=[Workflows]&f:ContentTypeFacet=[Knowledge%20base])
- [Documentation](https://help.okta.com/wf/en-us/Content/Topics/Workflows/workflows-main.htm)
- [Slack community](http://macadmins.org) (join the #okta-workflows channel)
- Get help from support ([forum](https://support.okta.com/help/s/group/0F91Y000000PueUSAS/workflows?language=en_US), [questions](https://support.okta.com/help/s/global-search/%40uri?language=en_US#t=All&f:ProductFacet=[Workflows]&f:ContentTypeFacet=[Discussions]))



















 












