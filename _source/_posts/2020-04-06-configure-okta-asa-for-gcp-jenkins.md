---
disqus_thread_id: 7948070646
discourse_topic_id: 17230
discourse_comment_url: https://devforum.okta.com/t/17230
layout: blog_post
title: "Configure Okta Advanced Server Access (ASA) for GCP + Jenkins Service Account"
author: nicolas-triballier
by: internal-contributor
communities: [devops]
description: "Learn how to configure Okta's Advanced Server Access (ASA) product for GCP + Jenkins."
tags: [devops, google-cloud, gcp, asa, okta]
tweets:
- "Using @googlecloud? Check out our new tutorial on using @okta's advanced server access product with it!"
- "@okta + @googlecloud + #jenkins = win"
type: conversion
image: blog/asa-gcp-jenkins/architecture.png
---

{% img blog/asa-gcp-jenkins/example.gif alt:"example gif" %}{: .center-image }

In this tutorial, we'll configure Okta Advanced Server Access (aka 'ASA') so our DevOps team can securely access Virtual Machines (aka 'VMs') on Google Cloud Platform (aka 'GCP'). We'll also configure a service account so our Jenkins instance can connect to other VMs to run remote commands.

This tutorial highlights the steps you should complete to manually deploy those servers on GCP and enroll them in ASA.
At the end of this tutorial, we'll point to resources you can leverage to automate all those steps (including our [Terraform ASA provider](https://www.terraform.io/docs/providers/oktaasa/index.html)).

Below is the target architecture you'll be deploying:

{% img blog/asa-gcp-jenkins/architecture.png alt:"architecture for ASA + GCP + Jenkins" %}{: .center-image }

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## What is Okta's Advanced Server Access (ASA)?

In July of 2018, Okta acquired a San Francisco-based startup working on Zero Trust access solutions named ScaleFT. Okta rebranded the ScaleFT Server Access product as Okta **Advanced Server Access (ASA).**

ASA is an Okta application that manages access to Linux and Windows servers over SSH (Secure Shell) & RDP (Remote Desktop Protocol). It brings continuous, contextual access management to secure cloud infrastructure. It offers centralized access controls for organizations leveraging on-premises, hybrid, and cloud infrastructure in a seamless manner to mitigate the risk of credential theft, credential reuse, password sprawl, and abandoned administrative accounts.

ASA takes a modern approach to server access by entirely eliminating the need for static keys. Through a revolutionary ephemeral credential mechanism, ASA offers centralized access controls across any cloud environment supporting Linux and Windows servers (public, private, or hybrid), and cloud instances across AWS, GCP, and Azure.

Here's how ASA works when you try to SSH or RDP into a VM:

{% img blog/asa-gcp-jenkins/architecture-ssh.png alt:"architecture for ASA + SSH" %}{: .center-image }

## Who This Guide is For

This tutorial is intended for Okta administrators and technical teams as a quick-start guide to deploy ASA for Linux and Windows servers with their existing Okta organizations. Anyone with an interest in Okta's zero-trust technology can read this guide, but it assumes at least some knowledge of:

- Okta org functionality and administration, with features such as Okta Universal Directory, Okta Integration Network, and multifactor authentication
- Server endpoint (e.g. Windows, Linux) administration and configuration
- Cloud provider (e.g. Amazon Web Services, Google Cloud Platform) administration and provisioning/deprovisioning
- End-user workstation (e.g. MacOS, Windows, Linux) administration and configuration

## Getting Started Prerequisites

The prerequisites to complete this tutorial are:

- An existing Okta org (trial or active customer). If you don't have an existing Okta org, you can [create a new one here](https://www.okta.com/free-trial/).
	- One or more Okta administrative user(s)
	- One or more Okta test user(s)
	- Okta administrator rights
- Workstation(s) running a supported version of MacOS, Windows, or Linux
	- Installation permissions
	- SSH terminal application
	- MacFreeRDP client (MacOS clients only)
	- HTTPS web browser (recommended)

## How to Configure Okta ASA + Google Cloud Platform (GCP) + Jenkins

Let's start by configuring:

- An Okta ASA team
- A GCP project
- A gcp-ubuntu-bastion VM
- A gcp-ubuntu-target VM behind the gcp-ubuntu-bastion
- A gcp-jenkins VM with an ASA service-account, so Jenkins can run some builds
- A gcp-windows-target

### How to Configure Okta's ASA Team

Your existing Okta org contains:

* Users and groups within Okta Universal Directory (UD). You can create those users and groups directly within Okta or you can pull them in from your HR system (e.g.: Workday) or your enterprise directory (AD/LDAP)
* App sign-in policies and MFA factors

To configure ASA with Okta, we'll have to create a new ASA team and federate that ASA team with your Okta org.

To create a new ASA team:

* Visit the [ScaleFT signup page](https://app.scaleft.com/p/signup/)
* Enter your username, first name, last name, and pick a team name (we'll use `nicopowered` for this example)
* You'll then see an ASA screen asking you to go back to your Okta org and enter details about your ASA team. **Don't click on 'Authenticate with Okta' yet**.

{% img blog/asa-gcp-jenkins/configure-asa-okta.png alt:"configure ASA Okta" width:"600" %}{: .center-image }

* **Keep your ASA sign up tab open** and open your Okta org in a new tab. Go to your Okta admin console > **Applications** > **Applications** > Search for "Okta Advanced Server Access" > click on the matching result

{% img blog/asa-gcp-jenkins/okta-search-asa.png alt:"Okta search ASA" width:"600" %}{: .center-image }

* Click on **Add**:

{% img blog/asa-gcp-jenkins/add-asa.png alt:"add ASA" width:"600" %}{: .center-image }

* Follow the configuration wizard. Enter an **Application label** (we'll use
    'ASA team:nicopowered' here), then click on **Done**:

{% img blog/asa-gcp-jenkins/asa-application-label.png alt:"ASA application label" width:"600" %}{: .center-image }

You should see this:

{% img blog/asa-gcp-jenkins/asa-app-assignments.png alt:"ASA app assignments" width:"600" %}{: .center-image }

* Go to the **Assignments** tab > click on **Assign** > **Assign to People**:

{% img blog/asa-gcp-jenkins/asa-assign-to-people.png alt:"ASA assign to people" width:"600" %}{: .center-image }

* Search for your user, click on **Assign** in front of the matching item, then click on **Done**:

{% img blog/asa-gcp-jenkins/asa-assign.png alt:"ASA assign" width:"600" %}{: .center-image }

* Now go to the **Sign On** tab:

{% img blog/asa-gcp-jenkins/okta-sign-on.png alt:"Okta sign on" width:"700" %}{: .center-image }

* Enter the **Base URL** and **Audience Restriction** values from your ASA sign up page. Then click on **Save**.

* Still on the **Sign On** tab, right-click then copy the **Identity Provider metadata** link:

{% img blog/asa-gcp-jenkins/okta-sign-on-methods.png alt:"Okta sign on methods" width:"600" %}{: .center-image }

* Go back to your ASA sign up page, paste the **Identity Provider metadata** link Okta generated, and click on **Authenticate With Okta**

{% img blog/asa-gcp-jenkins/idp-metadata-url.png alt:"IdP metadata URL" width:"600" %}{: .center-image }

At this stage, you should be able to SSO into the ASA dashboard as an admin. You should see this:

{% img blog/asa-gcp-jenkins/asa-dashboard.png alt:"ASA dashboard" width:"600" %}{: .center-image }

Now, let's configure the ASA app to automatically push new users and groups to ASA from the Okta org.

* Create a group in Okta UD. Go to your Okta admin console > **Directory** > **Groups**. Click **Add group**. Pick a name and description. Here we'll use "DevOps"

{% img blog/asa-gcp-jenkins/okta-add-group.png alt:"Okta add group" width:"600" %}{: .center-image }

{% img blog/asa-gcp-jenkins/okta-group-config.png alt:"Okta group config" width:"600" %}{: .center-image }

* Then add yourself to this group. Open the freshly created group > click on **Manage People**

{% img blog/asa-gcp-jenkins/okta-manage-people.png alt:"Okta manage people" width:"600" %}{: .center-image }

* Search for your user, click on your matching user in the left column, then click on save

{% img blog/asa-gcp-jenkins/okta-group-management.png alt:"Okta group management" width:"600" %}{: .center-image }

You should see this:

{% img blog/asa-gcp-jenkins/updated-group-membership.png alt:"Okta updated group membership" width:"600" %}{: .center-image }

* Go back to **Applications** > **Applications** > your ASA app. Go to the **Provisioning** tab > **Integration**. Select **Enable API integration** > click on **Re-authenticate with Okta Advanced Server Access**:

{% img blog/asa-gcp-jenkins/okta-provisioning.png alt:"Okta provisioning" width:"600" %}{: .center-image }

* Okta should redirect you to a screen to consent to the API scopes Okta requires for provisioning. Pick a service account name (ex: service-scim):

{% img blog/asa-gcp-jenkins/asa-grant-permission.png alt:"ASA grant permission" width:"600" %}{: .center-image }

* Okta should redirect you back to the Okta **Provisioning** tab > **Integration**. Click **Save**:

{% img blog/asa-gcp-jenkins/okta-enable-api-integration.png alt:"Okta enable API integration" width:"600" %}{: .center-image }

* Then go to the **To App** section, click on **Edit**, select the **Create/Update/Deactivate** options, and click **Save**:

{% img blog/asa-gcp-jenkins/okta-enable-app.png alt:"Okta enable app" width:"600" %}{: .center-image }

* Go to the **Push Groups** tab > click on **Push Groups** > **Find groups by name**:

{% img blog/asa-gcp-jenkins/okta-push-groups.png alt:"Okta push groups" width:"600" %}{: .center-image }

* Enter your group name and select the matching result:

{% img blog/asa-gcp-jenkins/okta-push-groups-by-name.png alt:"Okta push groups by name" width:"600" %}{: .center-image }

* Leave the **Create Group** option selected, and click **Save**:

{% img blog/asa-gcp-jenkins/okta-push-groups-list.png alt:"Okta push groups list" width:"600" %}{: .center-image }

* Now we'll unassign our individual user from the ASA app (since we want to use group assignment instead). Go to the **Assignments** tab > **People** > unassign your user:

{% img blog/asa-gcp-jenkins/okta-group-assignments.png alt:"Okta group assignments" width:"600" %}{: .center-image }

You should see this:

{% img blog/asa-gcp-jenkins/okta-user-unassigned.png alt:"Okta user unassigned" width:"600" %}{: .center-image }

* Still on the **Assignments** tab > click **Assign** > **Assign to Groups**

{% img blog/asa-gcp-jenkins/assign-to-groups.png alt:"assign to groups" width:"600" %}{: .center-image }

* Search for your group, click **Assign** in front of the matching group, then click **Save**:

{% img blog/asa-gcp-jenkins/click-assign.png alt:"click assign" width:"600" %}{: .center-image }

Okta should redirect you to that view:

{% img blog/asa-gcp-jenkins/group-assigned.png alt:"group assigned" width:"600" %}{: .center-image }

* Because your user is a member of that group, if you switch to the **People** tab, you should see your user:

{% img blog/asa-gcp-jenkins/people.png alt:"people" width:"600" %}{: .center-image }

* Go to your ASA dashboard > **Groups** tab and double check that Okta pushed your DevOps groups to ASA:

{% img blog/asa-gcp-jenkins/devops-group.png alt:"devops group" width:"600" %}{: .center-image }

The configuration between your Okta org and your ASA team is complete. Now let's create the GCP VMs and enroll them into ASA.

### Configure a Google Cloud Platform (GCP) Project

- Go to the [GCP web console](https://console.cloud.google.com)
- Create a new GCP project:

{% img blog/asa-gcp-jenkins/gcp-new-project.png alt:"GCP new project" width:"600" %}{: .center-image }

- Select a name for your project:

{% img blog/asa-gcp-jenkins/gcp-new-project-config.png alt:"GCP new project config" width:"600" %}{: .center-image }

- Make sure your GCP project is selected in the top left before you start creating VMs:

{% img blog/asa-gcp-jenkins/gcp-menu.png alt:"GCP menu" width:"600" %}{: .center-image }

- Open the left menu, and then go to **Compute Engine** > **VM instances**

{% img blog/asa-gcp-jenkins/gcp-vm-instances-button.png alt:"GCP VM instances button" width:"600" %}{: .center-image }

- You should land on the list of the VMs for that GCP project:

{% img blog/asa-gcp-jenkins/gcp-vm-instances.png alt:"GCP VM instances" width:"600" %}{: .center-image }

### Create Google Cloud VMs

#### gcp-ubuntu-bastion

- Click on **Create Instance**

{% img blog/asa-gcp-jenkins/create-instance.png alt:"create instance" width:"600" %}{: .center-image }

- Enter a name for your instance: gcp-ubuntu-bastion

- Select Machine type drop-down list: choose **micro**

- Go to **Boot disk** > select **change** > select **Ubuntu 16.04 LTS**

- Optionally, select Firewall http/https traffic (not required for bastion and target, but required for the Jenkins VM to view the web console)

{% img blog/asa-gcp-jenkins/gcp-vm-config.png alt:"GCP vm config" width:"600" %}{: .center-image }

- Click on **Create**

#### gcp-ubuntu-target

Follow the same steps as above, and choose **gcp-ubuntu-target** as the VM name on Ubuntu 16.04 LTS.

#### gcp-jenkins

Follow the same steps as above, but choose **gcp-jenkins** as the VM name on **Ubuntu 18.04 LTS** and machine type **g1-small** (1 vCPU, 1.7 GB memory).

Then you will assign a static public IP for your VM, since you will want to load the Jenkins admin web panel, and bookmark that link in your web browser.

- Reserve a static public IP and [assign it to your VM](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address#reserve_new_static)

{% img blog/asa-gcp-jenkins/gcp-attach.png alt:"GCP attach" width:"600" %}{: .center-image }

- After 20 seconds, you should see your new static IP and verify that it's assigned to your VM:

{% img blog/asa-gcp-jenkins/gcp-verify.png alt:"GCP verify" width:"600" %}{: .center-image }

Note: if you already have a static IP to assign to your VM, read: [https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address#IP_assign](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address#IP_assign)

Then, you'll have to make that VM reachable from the internet over http 8080 to access the Jenkins web console:

- Open your left side bar > **VPC network** > **Firewall rules**

{% img blog/asa-gcp-jenkins/gcp-firewall-rules-button.png alt:"GCP firewall rules button" width:"600" %}{: .center-image }

- Click on **Create Firewall Rule**

{% img blog/asa-gcp-jenkins/gcp-create-firewall-rule-button.png alt:"GCP create firewall rule button" width:"500" %}{: .center-image }

- Name the rule "inbound-http-8080" | Direction: Ingress | Incoming IP ranges: 0.0.0.0/0 | select tcp port 8080 | click on **Create**

{% img blog/asa-gcp-jenkins/gcp-rule-config.png alt:"GCP rule config" width:"600" %}{: .center-image }

- You should see the new Firewall rule in the list now:

{% img blog/asa-gcp-jenkins/gcp-firewall-view.png alt:"GCP rule config" width:"600" %}{: .center-image }

#### gcp-windows-target

- Create a new VM
- Leave the default Machine type: 1vCPU + 3.75GB memory

{% img blog/asa-gcp-jenkins/gcp-machine-type.png alt:"GCP machine type" width:"450" %}{: .center-image }

- Go to **Boot disk** > select **change** > select **Windows Server 2016 Datacenter**
- Click on **Create**

Next, we'll set a username and password to be able to access that VM over RDP.

- Go back to the list of VMs, and next to your gcp-windows-target instance, click on the arrow down next to RDP, then click on **Set Windows password**

{% img blog/asa-gcp-jenkins/gcp-set-windows-password.png alt:"GCP set windows password" width:"600" %}{: .center-image }

- On the next screen, keep the default username, and click on **Set**

{% img blog/asa-gcp-jenkins/gcp-username.png alt:"GCP username" width:"600" %}{: .center-image }

- On the next screen, copy/save the Windows password that GCP generated

{% img blog/asa-gcp-jenkins/gcp-password.png alt:"GCP password" width:"600" %}{: .center-image }

We'll later use those Windows credentials to RDP to the VM and start the ASA enrollment.

- Then, go to **VPC Network** > **Firewall rules** > **New Firewall rule** > Name the rule "inbound-tcp-4421" | Direction: Ingress | Incoming IP ranges: 0.0.0.0/0 | select tcp port 4421 | click on **Create**

{% img blog/asa-gcp-jenkins/rule-config.png alt:"rule config" width:"600" %}{: .center-image }

- You should see the new Firewall rule in the list now:

{% img blog/asa-gcp-jenkins/rule-list.png alt:"rule list" width:"600" %}{: .center-image }

### Configure the Okta ASA Project

- Go to your ASA web console > **Projects**
- Click on **Create Project**
- Choose gcp-demo as project name > click on **Submit**

{% img blog/asa-gcp-jenkins/project-config.png alt:"project config" width:"600" %}{: .center-image }

- Configure the **Groups** and **Users** tab (see Prerequisites section above)
- Go to the **Enrollment** tab
- Click on **Create Enrollment Token**
- Create 4 tokens with the following names:
	- gcp-ubuntu-bastion
	- gcp-ubuntu-target
	- gcp-jenkins
	- gcp-windows-target

You should see this:

{% img blog/asa-gcp-jenkins/create-enrollment-token.png alt:"create enrollment token" width:"238" %}{: .center-image }

### Enroll VMs with Okta ASA

#### gcp-ubuntu-bastion

- Go to your ASA admin console
- Copy the value of your enrollment token for your gcp-ubuntu-bastion. You'll need it later.

{% img blog/asa-gcp-jenkins/token.png alt:"token" width:"600" %}{: .center-image }

- Go to your GCP console > list of VMs and click on **SSH in front of your bastion VM**

{% img blog/asa-gcp-jenkins/connect-via-ssh.png alt:"connect via ssh" width:"600" %}{: .center-image }

- That should open an SSH connection to your VM, in a browser window:

{% img blog/asa-gcp-jenkins/ssh-term.png alt:"ssh term" width:"600" %}{: .center-image }

- Type
	- `cd /var/`
	- `cd /lib/`
	- `ls`

- This is where we'll then create a folder "sftd", and create an enrollment key that the ASA agent can read to start the enrollment of that server

{% img blog/asa-gcp-jenkins/ssh-list.png alt:"ssh term" width:"600" %}{: .center-image }

- Create the sftd folder, type
	- `sudo mkdir -p /var/lib/sftd`

- Then, create the enrollment.token file that contains the value you got from the ASA console, type (don't forget to replace the XXXX with the value of your enrollment token)
	- `echo "XXXXXXXXXXXX" | sudo tee /var/lib/sftd/enrollment.token`

- Add the ScaleFT apt repo to your `/etc/apt/sources.list` system config file, type
	- `echo "deb http://pkg.scaleft.com/deb linux main" | sudo tee -a /etc/apt/sources.list`

- Trust the repository signing key, type
	- `curl -C - https://dist.scaleft.com/pki/scaleft_deb_key.asc | sudo apt-key add -`

- Retrieve information about new packages, type
	- `sudo apt-get update`

- Then, install the scaleft-server-tools package, type
	- `sudo apt-get install scaleft-server-tools`

- Then, you can come back to your ASA console and check that your server shows up in the Servers tab

{% img blog/asa-gcp-jenkins/bastion.png alt:"bastion" width:"600" %}{: .center-image }

At this stage, you should be able to SSH into your bastion using ASA:

{% img blog/asa-gcp-jenkins/asa-bastion.png alt:"ASA bastion" width:"600" %}{: .center-image }

#### gcp-ubuntu-target

For the target, there will be an extra step, as we need to configure it so we can access it through the bastion.

Technically, the flow should be: SSH into the bastion, and from the bastion SSH into the target.

As part of the target enrollment, we'll have to create a .yaml configuration file that the ASA agent can understand to start the enrollment.

- Go to your ASA admin console
- Copy the value of your enrollment token for your gcp-ubuntu-target. You'll need it later
- Go to your GCP console > list of VMs and click on **SSH** in front of your target VM
- That should open an SSH connection to your VM, in a browser window:

{% img blog/asa-gcp-jenkins/ssh-working.png alt:"SSH working" width:"600" %}{: .center-image }

- Type
	- `cd /etc/`

- Create a new folder, where we'll put the .yaml config file, type

- `sudo mkdir -p /etc/sft`

- Create a new empty file in that folder, type

- `echo -e "" | sudo tee /etc/sft/sftd.yaml`

- Edit the file

- `sudo nano /etc/sft/sftd.yaml`

- Copy and paste that content (4 lines). Use CTRL-O then ENTER to save, and then CTRL-X to exit

```
---
# CanonicalName: Specifies the name clients should use/see when connecting to this host.
CanonicalName: "gcp-ubuntu-target"
Bastion: "gcp-ubuntu-bastion"
```

- Once you close the file, go to the `/var/lib/` folder, type
	- `cd /var/`
	- `cd /lib/`
	- `ls`

From that point, the steps are similar to the enrollment of the bastion.

- Create the sftd folder, type
	- `sudo mkdir -p /var/lib/sftd`

- Then, create the enrollment.token file that contains the value you got from the ASA console, type (don't forget to replace the XXXX with the value of your enrollment token)
	- `echo "XXXXXXXXXXXX" | sudo tee /var/lib/sftd/enrollment.token`

- Add the ScaleFT apt repo to your `/etc/apt/sources.list` system config file, type
	- `echo "deb http://pkg.scaleft.com/deb linux main" | sudo tee -a /etc/apt/sources.list`

- Trust the repository signing key, type
	- `curl -C - https://dist.scaleft.com/pki/scaleft_deb_key.asc | sudo apt-key add -`

- Retrieve information about new packages, type
	- `sudo apt-get update`

- Then, install the scaleft-server-tools package, type
	- `sudo apt-get install scaleft-server-tools`

- Then, you can come back to your ASA console, and check that your server shows up in the Servers tab

{% img blog/asa-gcp-jenkins/target.png alt:"target" width:"600" %}{: .center-image }

- Then click on your gcp-ubuntu-target, and verify that it's configured behind the bastion:

{% img blog/asa-gcp-jenkins/list.png alt:"list" width:"600" %}{: .center-image }

At this stage, you should be able to SSH into your target through the bastion:

{% img blog/asa-gcp-jenkins/more-ssh.png alt:"more SSH" width:"600" %}{: .center-image }

Also, verify the 2 hops in ASA event logs:

{% img blog/asa-gcp-jenkins/related-info.png alt:"more SSH" width:"600" %}{: .center-image }

#### gcp-ubuntu-jenkins

In that section, we'll config the VM so we can SSH into it using ASA.

Then we'll install a Jenkins server on that VM, and we'll create an ASA service account so Jenkins can run its builds and SSH into other VMs to push code or execute remote commands.

As an example, Jenkins will SSH into the gcp-ubuntu-target and run **sudo apt-get update**.

Technically the ASA enrollment part for the gcp-jenkins VM is similar to the enrollment of gcp-ubuntu-target.

- Go to your ASA admin console.
- Copy the value of your enrollment token for your gcp-jenkins. You'll need it later.
- Go to your GCP console > list of VMs and click on SSH in front of your target VM.
- That should open an SSH connection to your VM, in a browser window:
- Once you close the file, type
	- `cd /var/`
	- `cd /lib/`
	- `ls`

- Create the sftd folder, type
	- `sudo mkdir -p /var/lib/sftd`

- Then, create the `enrollment.token` file that contains the value you got from the ASA console, type (don't forget to replace the XXXX with the value of your enrollment token)
	- `echo "XXXXXXXXXXXX" | sudo tee /var/lib/sftd/enrollment.token`

- Add the ScaleFT apt repo to your `/etc/apt/sources.list` system config file, type
	- `echo "deb http://pkg.scaleft.com/deb linux main" | sudo tee -a /etc/apt/sources.list`

- Trust the repository signing key, type
	- `curl -C - https://dist.scaleft.com/pki/scaleft_deb_key.asc | sudo apt-key add -`

- Retrieve information about new packages, type
	- `sudo apt-get update`

- Then, install the scaleft-server-tools package, type
	- `sudo apt-get install scaleft-server-tools`

- Then, you can come back to your ASA console, and check that your server shows up in the Servers tab

{% img blog/asa-gcp-jenkins/hostname.png alt:"hostname" width:"450" %}{: .center-image }

At this stage, you should be able to SSH into gcp-jenkins VM using ASA:

{% img blog/asa-gcp-jenkins/vm-asa.png alt:"VM ASA" width:"600" %}{: .center-image }

Now that we can SSH into our VM, let's install the Jenkins server (according to instructions from [Linuxize](https://linuxize.com/post/how-to-install-jenkins-on-ubuntu-18-04/#installing-jenkins)). Recap:

- Make sure you're SSHed into the VM

- First we'll install a Java Runtime Environment - Jenkins needs it:
	- `sudo apt update`
	- `sudo apt install openjdk-8-jre`

- Then download the Jenkins repo and install it:
	- `wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -`
	- `sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'`
	- `sudo apt-get update`
	- `sudo apt-get install jenkins`
	- `systemctl status jenkins`

You should see that the Jenkins instance is running:

{% img blog/asa-gcp-jenkins/sysctl-jenkins.png alt:"sysctl Jenkins" width:"600" %}{: .center-image }

Now let's access the Jenkins admin web console:
- Open `http://YOUR-GCP-JENKINS-VM-STATIC-IP:8080`

You should see the prompt to unlock Jenkins.

{% img blog/asa-gcp-jenkins/unlock-jenkins.png alt:"unlock Jenkins" width:"600" %}{: .center-image }

- Get back to your terminal, and run
	- `sudo nano /var/lib/jenkins/secrets/initialAdminPassword`

- Copy the value on your screen, then CTRL-X to close the editor
- Paste the value into the Unlock Jenkins screen
- On the next screen, select the default option: **Install suggested plugins**

{% img blog/asa-gcp-jenkins/install-plugins.png alt:"install plugins" width:"600" %}{: .center-image }

- Enter details for your first admin user, then click **Save** and **Continue**

{% img blog/asa-gcp-jenkins/create-first-user.png alt:"create first user" width:"600" %}{: .center-image }

- On the next screen, keep the default URL (it should be your static IP over http 8080)

{% img blog/asa-gcp-jenkins/jenkins-url.png alt:"jenkins url" width:"600" %}{: .center-image }

- Click on **Start using Jenkins**

{% img blog/asa-gcp-jenkins/jenkins-ready.png alt:"jenkins ready" width:"600" %}{: .center-image }

- You should land on that page:

{% img blog/asa-gcp-jenkins/create-jobs.png alt:"create jobs" width:"600" %}{: .center-image }

- Optionally, you can verify the Jenkins status, and stop and start it using those commands:
	- `sudo service jenkins status`
	- `sudo service jenkins stop`
	- `sudo service jenkins start`

Now that you've installed Jenkins, we'll follow the instructions on [that page](https://www.scaleft.com/blog/leveraging-service-users-for-privileged-devops-automation/)—recap below.

First, let's install the ASA client tool on the VM where Jenkins is running. Indeed, Jenkins will act as an SSH client that will connect to remote servers over SSH.

- Get back to your terminal and run:
	- `echo "deb http://pkg.scaleft.com/deb linux main" | sudo tee -a /etc/apt/sources.list`
	- `curl -C - https://dist.scaleft.com/pki/scaleft_deb_key.asc | sudo apt-key add -`
	- `sudo apt-get update`
	- `sudo apt-get install scaleft-client-tools`

{% img blog/asa-gcp-jenkins/curl.png alt:"curl" width:"600" %}{: .center-image }

{% img blog/asa-gcp-jenkins/apt-install.png alt:"apt install" width:"600" %}{: .center-image }

- Let's get the ID for the Jenkins user that comes with the Jenkins install
	- `id -u jenkins`

{% img blog/asa-gcp-jenkins/id.png alt:"id" width:"600" %}{: .center-image }

Now, we'll create a service account in ASA, mapped to that Jenkins user.

- Go to the ASA web console > **Users** > **Service Users** tab and click on **Create Service User**

{% img blog/asa-gcp-jenkins/create-service-user.png alt:"create service user" width:"600" %}{: .center-image }

- Enter as name `service-gcp-jenkins`

- Then go to **Groups** and add the service-gcp-jenkins user to a group with **admin** privileges (on your GCP VMs in your ASA project)

- Then go back to your list of servers and click on your gcp-jenkins instance

{% img blog/asa-gcp-jenkins/gcp-jenkins.png alt:"GCP jenkins" width:"600" %}{: .center-image }

- Go to **Services** tab > **Add Service**

{% img blog/asa-gcp-jenkins/add-service.png alt:"add service" width:"300" %}{: .center-image }

- Enter your Jenkins user ID. In our case above, that was 112. Then click **Submit**.

{% img blog/asa-gcp-jenkins/service-user.png alt:"service user" width:"600" %}{: .center-image }

- On the next screen, click on **Create API Key**

{% img blog/asa-gcp-jenkins/create-api-key.png alt:"create API key" width:"600" %}{: .center-image }

- Click **Ok**. You should see this:

{% img blog/asa-gcp-jenkins/status.png alt:"status" width:"600" %}{: .center-image }

Let's get back to the Jenkins server to configure the Jenkins user to SSH using the ASA service account.

- Get back to your terminal where you've SSHed in your Jenkins VM

- Switch your user to Jenkins, type:
	- `sudo su jenkins`

{% img blog/asa-gcp-jenkins/su-jenkins.png alt:"status" width:"600" %}{: .center-image }

At this stage, you are acting as the local Jenkins user. We'll now configure the Jenkins server to enable authentication via the ASA Service User when performing SSH commands.

- Run
	- `sft config service_auth.enable true`

{% img blog/asa-gcp-jenkins/sft.png alt:"status" width:"600" %}{: .center-image }

Note: Jenkins maps the Jenkins user (112) to the corresponding ASA service account. When performing sft ssh xxxx, the Jenkins user will authenticate using the corresponding API key that you've created above.

- Verify that, as the Jenkins user, you can ssh into the gcp-ubuntu-target. Type
	- `sft ssh gcp-ubuntu-target`

{% img blog/asa-gcp-jenkins/ssh-worked.png alt:"ssh worked" width:"600" %}{: .center-image }

Now, we can add a build configuration in Jenkins and test if the SSH connection via service user from Jenkins to another VM works fine.

Get back to Jenkins.

- Open http://YOUR-GCP-JENKINS-VM-STATIC-IP:8080

- Click on **New Item**

{% img blog/asa-gcp-jenkins/new-item.png alt:"new item" width:"233" %}{: .center-image }

- Enter Hello World as the title, and select "Freestyle project" as the type, then click **Ok**

{% img blog/asa-gcp-jenkins/freestyle-project.png alt:"freestyle project" width:"600" %}{: .center-image }

- Go to the **Build** tab

{% img blog/asa-gcp-jenkins/description.png alt:"description" width:"600" %}{: .center-image }

- Click on **Add build step**, then **Execute shell**

{% img blog/asa-gcp-jenkins/execute-shell.png alt:"execute shell" width:"600" %}{: .center-image }

- Paste the following code
	`sft ssh gcp-ubuntu-target << EOF`
	`sudo apt-get update`
	`EOF`

- It should look like this:

{% img blog/asa-gcp-jenkins/jenkins-command.png alt:"jenkins command" width:"600" %}{: .center-image }

- Click on **Save**
- On the next screen, click on **Build Now**

{% img blog/asa-gcp-jenkins/build-now.png alt:"build now" width:"204" %}{: .center-image }

- Open the latest build (it should have a blue dot icon)

{% img blog/asa-gcp-jenkins/build-number.png alt:"build number" width:"600" %}{: .center-image }

- Click on **Console Output** in the left side bar

{% img blog/asa-gcp-jenkins/running-as.png alt:"running-as" width:"600" %}{: .center-image }

Congrats, your Jenkins instance is properly configured with an ASA service account!

#### gcp-windows-target

Let's enroll our Windows VM with ASA. We'll start with instructions on [this page](https://www.scaleft.com/docs/windows/)

- Go to your ASA admin console

- Copy the value of your enrollment token for your gcp-windows-target—you'll need it later

- Go to your GCP console > list of VMs, and copy the external IP in front of your VM

{% img blog/asa-gcp-jenkins/external-ip.png alt:"external IP" width:"600" %}{: .center-image }

- Open your preferred RDP client, and connect to the external IP above with the GCP-generated username and password

{% img blog/asa-gcp-jenkins/windows-credentials.png alt:"windows credentials" width:"600" %}{: .center-image }

You should be connected to your windows server now.

{% img blog/asa-gcp-jenkins/server-manager.png alt:"server manager" width:"600" %}{: .center-image }

- Navigate to `C:\Windows\System32\config\systemprofile\AppData\Local

{% img blog/asa-gcp-jenkins/windows-fs.png alt:"windows fs" width:"600" %}{: .center-image }

- Create a new folder called ScaleFT, then open that folder

{% img blog/asa-gcp-jenkins/scaleft.png alt:"scaleft" width:"600" %}{: .center-image }

- Go to **View** > **Options**

{% img blog/asa-gcp-jenkins/options.png alt:"options" width:"600" %}{: .center-image }

- Unselect Hide extensions for known file types, then click on Apply + OK

{% img blog/asa-gcp-jenkins/apply.png alt:"options" width:"600" %}{: .center-image }

- In your ScaleFT folder, right click > **New** > **Text Document**

{% img blog/asa-gcp-jenkins/new-text-document.png alt:"new text document" width:"600" %}{: .center-image }

- Rename the file enrollment.token, and accept the file extension change

{% img blog/asa-gcp-jenkins/yes.png alt:"yes" width:"600" %}{: .center-image }

- Right click on the file > **Open with** > **Notepad**

{% img blog/asa-gcp-jenkins/notepad.png alt:"notepad" width:"600" %}{: .center-image }

- Paste the enrollment token you got from the ASA console, and save the file

{% img blog/asa-gcp-jenkins/etoken.png alt:"etoken" width:"600" %}{: .center-image }

- Open a web browser, download [this file](https://dist.scaleft.com/server-tools/windows/latest/ScaleFT-Server-Tools-latest.msi)

Note, if you're using IE, you may have to whitelist [https://dist.scaleft.com](https://dist.scaleft.com/) as Trusted site.

{% img blog/asa-gcp-jenkins/add-website.png alt:"add website" width:"600" %}{: .center-image }

- Run the MSI. This will install the ASA/ScaleFT Server Tools

{% img blog/asa-gcp-jenkins/install.png alt:"install" width:"600" %}{: .center-image }

After the install is complete, your WinServer should now be enrolled in ASA. Go to the ASA console > gcp-demo project > Servers tab and verify that you can see gcp-windows-target.

{% img blog/asa-gcp-jenkins/windows-target.png alt:"windows target" width:"600" %}{: .center-image }

- Close your RDP session (where you used the GCP-generated username and password)

- Open your terminal
	- `sft login`
	- `sft list-servers`

You should see your gcp-windows-target.

{% img blog/asa-gcp-jenkins/in-list.png alt:"in list" width:"600" %}{: .center-image }

- Now RDP to gcp-windows-target
	- `sft rdp gcp-windows-target`

That will leverage your native RDP client to connect to the gcp-windows-target instance.

{% img blog/asa-gcp-jenkins/config.png alt:"config" width:"600" %}{: .center-image }

Note: in that example, we're accessing the gcp-windows-target directly, but we could have configured it so the access is via the gcp-ubuntu-bastion.

You can use the configuration steps for gcp-ubuntu-target and the custom .yaml file format if you want the WinServer behind the bastion.

#### Troubleshooting

If you're facing issues during the ASA server enrollment, check the health of the sftd agent. Here are couple of useful commands:

- `sudo systemctl status sftd`

{% img blog/asa-gcp-jenkins/sftd.png alt:"stfd" width:"600" %}{: .center-image }

- `sudo systemctl stop sftd`
- `sudo systemctl start sftd`

If you deleted a server from the ASA console that was previously enrolled in ASA and you want to re-enroll it with the same hostname, follow these steps:

- Stop the sftd agent
	- `sudo systemctl stop sftd`

- Remove the sftd state folder
	- `sudo rm -rf /var/lib/sftd`

- Re-create the sftd folder

- Re-add your enrollment key

- Restart the sftd agent
	- `sudo systemctl start sftd`

The server should appear again in your ASA web console.

## How to Block SSH Public Keys and Force ASA Authentication to VMs

Advanced Server Access doesn't restrict the authentication methods available on servers. Inherently, SSH public keys can be used to bypass Okta sign-on and MFA. This simple SSH configuration can be used to force certificate-based authentication for all, or for groups of users.

### Instructions / Examples

After making changes to `sshd_config`, restart sshd.

Append the following lines to `/etc/ssh/sshd_config` to restrict members of the sft-admin group from being able to log in with anything but ASA certificates.

```
Match Group sft-admin
  PubkeyAcceptedKeyTypes ssh-rsa-cert-v01@openssh.com
```

Append the following lines to `/etc/ssh/sshd_config` to restrict members of the sft_everyone group from being able to log in with anything but ASA certificates. Please ensure the group is being synced to the server as part of the project.

```
Match Group sft_everyone
  PubkeyAcceptedKeyTypes ssh-rsa-cert-v01@openssh.com
```

Append the following lines to `/etc/ssh/sshd_config` to restrict members of sft-admin and sft_everyone from being able to log in with anything but ASA certificates. Please ensure the group is being synced to the server as part of the project.

```
Match Group sft_everyone
  PubkeyAcceptedKeyTypes ssh-rsa-cert-v01@openssh.com
Match Group sft-admin
  PubkeyAcceptedKeyTypes ssh-rsa-cert-v01@openssh.com
```

Place the following line in `/etc/ssh/sshd_config` above any Match lines to restrict all users from logging in with anything but ASA certificates. Note: This will break access to any service accounts using public key authentication.

```
PubkeyAcceptedKeyTypes ssh-rsa-cert-v01@openssh.com
```
## Automate ASA enrollment with existing CI/CD tools

- Terraform: [Okta ASA Terraform Provider](https://registry.terraform.io/providers/oktadeveloper/oktaasa/latest/docs), [Tutorial](/blog/2020/04/24/okta-terraform-automate-identity-and-infrastructure)
- Ansible: [Tutorial](/blog/2021/02/05/okta-ansible)
- Puppet: [Tutorial](/blog/2021/01/22/okta-puppet)
- Chef: [Tutorial](/blog/2021/02/10/okta-chef)

And... That's all! Have any questions? Please leave a comment below. Or, if
you'd like to see more content like this, consider following us on
[Twitter](https://twitter.com/oktadev) or subscribing to our [YouTube channel](https://www.youtube.com/c/oktadev).
