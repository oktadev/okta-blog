---
layout: blog_post
title: "Visualize your Okta logs with log streaming, AWS EventBridge and Log Insights"
author: andy-march
by: internal-contributor
communities: [devops, security]
description: "Learn how to centralize and inspect your Okta logs with AWS."
tags: [devops, security, okta, aws]
tweets:
  - ""
  - ""
image: blog/programming-security-and-why-rust/cover.jpg
type: awareness
---
You've deployed your identity service and your product is humming along, but how do you measure success? How do you identify where your users are getting stuck? How do you identify trends which might tell you when your service is under attack? Okta provides a comprehensive system log that records every event which is happening on the platform but much of that data is best used in the context of your applications.

Okta log streaming helps you to export the Okta system log in real-time to observability tools that you may already be using to run your application stack. In these tools, you can combine the rich authentication and authorization information from Okta with your application logs to gain insights into how users interact with your application.

This article will guide you through setting up Okta log streaming, sending logs to Amazon EventBridge, and how to inspect the data with Cloudwatch Log Insights.

The rest of this post assumes you already have at least one Okta account. If you don't, you can create a free-forever developer account by visiting <https://developer.okta.com/signup/>. You'll also need an AWS account, all of the examples used in this guide fall under the free tier.

## Getting started with Log Streaming

Before you can get started with log streaming we need to gather some information about where you will be streaming events to. Start by logging into the AWS console. From there locate your AWS account ID and region from the menu in the top right. 

{% img blog/log-streaming/log-streaming-1.png alt:"AWS Account Id" width:"800" %}{: .center-image }

In a separate tab open your Okta tenant's admin console. Log streaming is now generally available and enabled for all Okta instances giving you an additional option under **Reports** in the left-hand menu. To get started click the **Add Log Streaming** button in the center of the page, this will guide you through the process of configuring your EventBridge instance.

First, you need to select the type of stream to create. Select **AWS Event Bridge** and press **Next**

{% img blog/log-streaming/log-streaming-2.png alt:"Config AWS EventBridge" width:"800" %}{: .center-image }

Complete the general settings for the stream. The name is how this stream will appear in Okta, the event source name is the name of the source that will be created in your AWS EventBridge, make a note of this value as you will need it later. Press **Save**, and Okta will begin the setup for the stream for you in AWS.

Switch back to your AWS console, make sure you are in the same region that you told Okta to target, and search for EventBridge in the service menu. Under the Integration heading, select **Partner event sources** and you can see the event source that Okta created. Select the source and click **Associate with event bus**.


{% img blog/log-streaming/log-streaming-3.png alt:"AWS Partner event sources" width:"800" %}{: .center-image }

Accept the default permissions on the pop-up. This will create a new event bus with the same name as the source click **Associate** - take a note of the full long Name, you'll need this in the next step. 

The log stream is now active, but what is it doing? Right now, nothing. Okta is writing to the event source and AWS is publishing that data onto the event bus but there is nothing there to process the events. EventBridge defines rules for a bus to determine what to do when a matching event is seen on an event bus. This action can be wide-ranging; for example, you might run a system manager command, execute a lambda, or in this case write to CloudWatch. 
Pick rules from the left-hand menu then select **Create rule**. Name it 'Okta_to_CloudWatch'. 

Under **Define pattern**, select **Event pattern**. Next, create the matching behavior for the events which should trigger the action. Select **custom pattern** and paste in the following and replace the values and click Save:


```
{
  "account": ["<aws account id>"],
  "source": ["<your full event source name - example: aws.partner/okta.com/tenant-name/eventsourcename>"]
}
```

This pattern is matching all incoming events to your account from the event source created by Okta. If you wanted to filter the log or trigger a certain set of behaviors when a given event was seen you can drill into the detail object with this pattern to do that matching.

Under select event bus, pick the **custom or partner event bus** and pick your event bus from the list. Finally, you need to define a target. Targets are the actions that occur when an event that matches your pattern is seen in the event bus. For this example, you are just going to write the event to CloudWatch. Click the dropdown for the target type and pick **CloudWatch log group**. Enter a name for your new log group. Once this is done, click **Create** at the bottom of the page. 

{% img blog/log-streaming/log-streaming-4.png alt:"EventBridge targetting CloudWatch log groups" width:"800" %}{: .center-image }

Now check everything is working. Head to Cloudwatch / Logs / Log groups and open the CloudWatch Log group that you just created, when you make any change on your Okta tenant which would cause a system log event to be written the log group should add a new entry for this event. 

{% img blog/log-streaming/log-streaming-5.png alt:"Example CloudWatch log event" width:"800" %}{: .center-image }

You now have your Okta System Log being written into CloudWatch in a JSON format. 



## Visualization

Once you have started to collect log data in this way you can begin to mine that data for insights as to how the system is being used. Your exact use-cases will vary depending on what your product is doing and what metrics are important to you. For the sake of simplicity, we're going to look at using CloudWatch Insights to inspect the data. However, you can go as deep on this as you want directing the data into tools such as OpenSearch or Elastic to create much more in-depth analyses alongside other data sources you may already have.

From the CloudWatch dashboard select Logs / Logs Insights, from the log group pick the event group you created and hit run query this will just visualize the last 20 log events. 

{% img blog/log-streaming/log-streaming-7.png alt:"CloudWatch query" width:"800" %}{: .center-image }

From the right-hand side expand the fields menu. As the system log is written as JSON CloudWatch has automatically discovered the fields that are present in the messages. We can start using these fields to refine our queries. To start getting a better understanding of how the service is being used, drill down into an individual event. Update your query to look for the user session start event. This query is counting the number of sessions started in 15-minute buckets and categorizes them as successful or failed.

```
fields @timestamp, @message
| filter detail.eventType == "user.session.start"
| fields strcontains (detail.outcome.result, "SUCCESS") as @SUCCESS, strcontains(detail.outcome.result,"Failure") as @FAILURE
| stats count(@SUCCESS) as Success, count (@FAILURE) as failure by bin(15m)
```

By tracking this we'll be able to see when this deviates away from the normal. Click on the **Visualization** tab and we can plot this data onto a graph to get a glanceable view of the time series.

Press the **Add to Dashboard** button and create a new dashboard

{% img blog/log-streaming/log-streaming-8.png alt:"Log Insights dashboard creation" width:"800" %}{: .center-image }


This dashboard allows us to collect together our queries into a single view. You can also directly create visualizations from the dashboard, press **add widget** and pick the Pie and select Logs as the data source. This brings you back into the log insights view. Enter the following query which will break down the browser types used by each user who successfully authenticated. When you are done press create widget to add it to the dashboard.

```
fields @timestamp, @message
| filter detail.eventType == "user.session.start"
| filter detail.outcome.result == "SUCCESS"
| stats count(*) as UserAgent by detail.client.userAgent.browser
```

{% img blog/log-streaming/log-streaming-9.png alt:"Log Insights dashboard" width:"800" %}{: .center-image }

You can build out queries and visualization to view nearly any event combination based on what is in the system log.

## Retaining Logs

Okta will store the last 90 days worth of logs in the platform and allow you to run queries from the system log. With the data now being held in CloudWatch, you can retain this for as long as it is useful or however long you are legally required to do so. To do this within CloudWatch select the log group for the Lambda function, click **actions**, click **edit retention setting(s)**. You can then define your policy as to how long these logs should be persisted in CloudWatch. You may choose to create a more complex policy where you export logs from [CloudWatch to S3](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/S3Export.html) and then to Glacier, this is ideal for data that you need to keep for compliance but don't need to immediately query.

{% img blog/log-streaming/log-streaming-6.png alt:"CloudWatch Retention setting" width:"800" %}{: .center-image }

## Learn more about Okta and observability

You have now set up a log stream of Okta's system log to AWS EventBridge, created a custom retention policy for your log events, and visualized that data with Insights. This will allow you to include data from your identity provider in the same observability tools you are using for your application.

To continue learning about how Okta can integrate with your observability stack check out the links below.

- [Get Started with the ELK Stack](/blog/2019/09/26/get-started-elk-stack)
- [Testing your Okta visibility and detection with Dorothy and Elastic Security](https://www.elastic.co/blog/testing-okta-visibility-and-detection-dorothy)


If you liked this tutorial, chances are you will like the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.