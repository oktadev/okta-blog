---
layout: blog_post
title: "How Can DevOps Engineers Use Okta?"
author: edunham 
by: advocate
communities: [devops]
description: "Okta's most familiar use case is SSO to applications like mail, chat, AWS, GCP, Azure, Jenkins, Spinnaker, and CircleCi. But it can also help automate administration tasks with Terraform, manage server access with PAM and ASA, and provide data for metrics and monitoring."

tags: [devops]
tweets:
- "Do you know the 4 main ways that DevOps professionals can benefit from Okta's products?"
- "Could an identity provider help manage your CI/CD systems, SSH access controls, and more?"
- "DevOps doesn't work without managing identity. What tools will you choose?"
image: blog/where-okta-meets-devops/devops.png
type: awareness
---

## What is DevOps? 

DevOps is one of those buzzwords. Ask three DevOps professionals what it means, and you might get four different answers. Most will agree that DevOps usually describes a mix of tools and techniques combining aspects of systems administration, software development, IT, release engineering, security, and often QA. At its best, DevOps synergizes the strengths of these fields to reduce toil through automation and improve software quality through continuous testing and deployment, and [infrastructure as code](https://en.wikipedia.org/wiki/Infrastructure_as_code). At its worst, DevOps is used as an excuse to ask a single under-resourced team to do the work of several groups, in an ever-increasing spiral of tech debt. Most DevOps roles fall somewhere on the spectrum between these extremes. 

While many tech professionals know Okta and its competitors as the way they access their corporate email and chat, there are actually four main areas where Okta's product family interfaces with the DevOps skillset. 

## Accessing SaaS services and tooling

In 2022, it's vanishingly rare for a tech company to host every software product that they use on-premises. Although there are open or [self-hosted versions](https://github.com/awesome-selfhosted/awesome-selfhosted) of every major tool in the modern workflow, maintaining separate services gets prohibitively expensive. Instead of hosting physical servers, most organizations rent cloud resources. Instead of running email ([Mailman](https://list.org/)), chat ([IRC](https://datatracker.ietf.org/doc/html/rfc1459), [XMPP](https://xmpp.org/about/technology-overview/)), user account management ([LDAP](https://ldap.com/)), and more in-house, companies instead rent services providing these features from specialist providers. 

Before the pattern of using a central identity provider and protocols like OAuth became commonplace, users would have to manage a separate login and password to every software-as-a-service vendor that their company used. This created security and administrative headaches for everyone involved. But thanks to widespread adoption of the underlying protocols, a company can now use a single identity provider like Okta to allow everyone in the organization to access all of the software that it buys for them. 

As well as the obvious workplace services like Slack and email, DevOps engineers might use their Okta accounts to sign in to cloud service providers like [AWS](https://www.okta.com/aws/), [GCP](https://www.okta.com/%20partners/google/), or [Azure](https://www.okta.com/integrations/azure-portal-login/#overview).

In a CI/CD pipeline, one might use Okta to log in to [Jenkins](https://www.okta.com/integrations/jenkins/#overview), [Spinnaker](https://docs.armory.io/armory-enterprise/armory-admin/auth-okta-configure/), or even [CircleCI](https://www.okta.com/integrations/circleci/#overview). If an organization uses [GitHub Enterprise](https://saml-doc.okta.com/Provisioning_Docs/GitHub_Enterprise_Provisioning.html), DevOps personnel can use Okta to sign in there too. Okta can even help ensure that the right people can update infrastructure code by managing access to [Docker Hub](https://www.okta.com/integrations/docker-hub/#overview) or [Terraform Cloud](https://www.okta.com/integrations/terraform-cloud/#overview)!

## Automating Okta administration tasks
Just as sysadmins and IT managed identity for small to medium organizations in the olden days, DevOps engineers may be responsible for some administrative tasks in their company's Okta instance. 

Software and infrastructure administration and management tasks can be automated using a plethora of tools, including HashiCorp's Terraform. Terraform allows users to describe the desired state of their resources, and then changes the resources to match that description.  Using [Okta's Terraform provider](https://github.com/okta/terraform-provider-okta), users can manage their Okta resources and track their changes with version control. This is particularly useful for those whose business needs have them managing many different Okta accounts and trying to keep the settings consistent across all of them. 

## Managing server access

Modern code and infrastructure best practices recommend architecting systems to require minimal human access and intervention. But production-readiness is always a balancing act between aspirations and real-world limitations, and many successful codebases were architected before modern tooling made these hands-off design patterns feasible. Updating production code and infrastructure is often likened to repairing a jet engine while in flight: it has to keep working after every change that you make. When logging into servers is an important part of existing workflows, streamlining that process can be an essential step toward moving past the need to fix things by hand at all. 

One way to improve the security and user experience of SSHing or RDPing to servers is to stop asking users to manage their own keys, and stop asking servers to keep track of who's allowed to access them. In an organization whose identity provider already tracks which team members should have infrastructure access, [Okta's ASA](https://www.okta.com/demo/okta-advanced-server-access/) (formerly ScaleFT) provides a great way to reduce the value of SSH and RDP credentials by making them ephemeral. 

Additionally, Okta is working on [more new products](https://www.okta.com/press-room/press-releases/okta-introduces-new-okta-privileged-access-product-to-strengthen-security/) for privileged access management, which will be interesting in the DevOps use case. 

## Introspecting Okta

When DevOps refers to a catch-all role focused on the care and feeding of infrastructure, monitoring and alerting fall under its purview. 

So far, we've talked about information flowing from Okta to your software and services, answering questions like "is this login request legitimate?" Automating Okta administration tasks with Terraform pushes configuration from the user to Okta. There's one more direction that information can move relative to your identity provider, however: a stream of metadata about what the identity provider is doing can flow out of the provider and into your monitoring and alerting tools. 

Okta supports a variety of [integrations](https://support.okta.com/help/s/article/Exporting-Okta-Log-Data) for monitoring its various moving parts. For instance, integrations can be set up to exfiltrate Okta logs to [DataDog](https://docs.datadoghq.com/integrations/okta/), [Splunk](https://www.okta.com/integrations/splunk-add-on-for-okta/), or [SumoLogic](https://www.okta.com/integrations/sumologic/). These solutions can combine information about your Okta account with information from your other systems in ways limited only by your imagination: Would you like to get an alert when a user who has recently changed their password accesses a particular resource? How about if the total login failures involving a particular account, across Okta and your other systems, exceed a particular threshold? Would postmortems be easier if every user action logged by Okta showed up alongside the other data in your favorite monitoring tool?

## In Conclusion

Although the field itself is ambiguously defined, DevOps tools and practices constantly interface with identity. DevOps done right ensures that the people can access the resources they should, and not the ones they shouldn't. DevOps practitioners can use Okta to control identity-related behavior of their infrastructure through its many integrations, and can in turn customize and manage their Okta instances by using Terraform and Okta's metrics and monitoring APIs. 

If you work in DevOps, you can't escape the responsibility of managing identity as it relates to your infrastructure. But you can choose how to manage it: Will your organization support you in delegating these tasks to specialists? Do you have a use case where it's better to attempt to reinvent these wheels yourself?

* For more ways to watch what Okta is doing from within your own tools, see the [developer docs on monitoring](https://developer.okta.com/docs/concepts/monitor). 
* Checkout out the [Okta Terraform provider](https://github.com/okta/terraform-provider-okta)
* To learn about [securing Kubernetes with OpenID Connect and Okta](/blog/2021/11/08/k8s-api-server-oidc)
* For further information about managing server access with Okta's ASA, see [ASA's overview docs](https://help.okta.com/asa/en-us/Content/Topics/Adv_Server_Access/docs/asa-overview.htm)

To keep up to date with the latest informationa about Okta and what you can do with it, follow [@oktadev](https://twitter.com/oktadev) on Twitter, like us [on LinkedIn](https://www.linkedin.com/company/oktadev/), or subscribe to [our YouTube channel](https://www.youtube.com/oktadev)

