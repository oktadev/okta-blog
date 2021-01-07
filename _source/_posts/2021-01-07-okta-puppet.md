---
layout: blog_post
title: "Tutorial: Puppet and Account Automation with Okta"
author: sudobinbash
by: contractor
communities: [devops]
description: "How to integrate Okta and Puppet to manage accounts in servers while abstracting account management from your catalogs"
tags: [devops]
tweets:
- "Learn how to integrate Okta and Puppet to manage server accounts and abstract account management from your catalogs"
- "Remove account management from your Puppet catalogs. Here's how"
image: blog/
type: conversion
---

If you use Puppet to automate configuration management across dynamic server fleets, there's a question about identity & access management – how do you get accounts and credentials on the machines?

A common practice is to push SSH Keys for every admin user to every server. This has major security implications, however. What happens when an administrator leaves the company? It is then up to someone to clear out those keys on each machine, oftentimes a manual process.

Another common practice is to front your servers with an LDAP interface, configuring a local PAM module on each machine to sync local server accounts with an upstream Identity Provider. This leaves a significant operational burden, however. Do you want to run an HA middleware service blocking your ability to scale in the cloud? This is a pain point no Ops Engineer wants.

In this tutorial, we will overcome both issues by seamlessly injecting Okta into your Puppet Infrastructure as Code to effectively [Shift Identity Left](https://www.okta.com/blog/2019/07/shift-identity-left-secure-devops-automation-with-okta/):

{% img blog/okta-Puppet/conceptual-diagram.png alt:"Okta working together with Puppet" width:"800" %}{: .center-image }

**Note:** To follow this tutorial, you need to have an Advanced Server Access (ASA) team provisioned from your Okta Org. If you don't have an existing ASA team, you can sign up for free [here](https://app.scaleft.com/p/signupV2), which requires an Okta Administrator to [configure](https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/setup/getting-started.htm).

## Download and configure the sample puppet code

Get an enrollment token in ASA:

1. Access Okta ASA as Administrator.
2. Click **Projects** and then select or create a new project.
3. Click **Enrollment** > **Create Enrollment Token**.
4. Enter a name (i.e. `Puppet-token`) and click **Submit**.
5. Copy the enrollment token

{% img blog/okta-Puppet/asa-get-token.png alt:"Enrollment token page" width:"800" %}{: .center-image }

Clone our sample code `git clone https://github.com/okta-server-asa/asa-puppet-example.git`

Edit the `okta-asa-sample.pp` file and update line 2, with the asa enrollment token.

```rb
# ASA Enrollment token
$asa_enrollment_token = "ENROLLMENT_TOKEN_HERE"
```

Validate the example syntax: `puppet parser validate okta-asa-sample.pp`

Validate the example in the primary server (without executing the change): `puppet apply okta-asa-sample.pp --noop`

## Test the sample code

Its time to test the code. To do this, I'll apply the sample on my Puppet primary server to enroll this server in Okta ASA.

**Tip:** For this tutorial, I'm using a test environment. For use in production, we recommend tests isolated in a new puppet client before running on production clients and primary servers.

To test the sample code Puppet primary server in ASA, enter `puppet apply okta-asa-sample.pp`

To confirm the primary server is enrolled, check the list of servers in ASA:

{% img blog/okta-puppet/asa-puppet-primary.png alt:"ASA: Primary Server enrolled" width:"800" %}{: .center-image }

With the primary server enrolled, let's move to the clients.

Copy the sample manifest to the environment folder: `cp okta-asa-sample.pp /etc/puppetlabs/code/environments/production`

Access your puppet clients and execute the command `puppet agent -tv` (or wait until the clients fetch the new configuration from the primary server).

The Puppet client will fetch the manifest, install and configure ASA, and return the following:

```sh
root@cicd-puppet-3-ubuntu:~# puppet agent -tv
Info: Using configured environment 'production'
Info: Retrieving pluginfacts
Info: Retrieving plugin
Info: Loading facts
Info: Caching catalog for cicd-puppet-3-ubuntu.acme.com
Info: Applying configuration version '1608162283'
Notice: /Stage[main]/Enroll_server/File[/var/lib/sftd/enrollment.token]/ensure: defined content as '{sha256}123e122e122we2e'
Info: /Stage[main]/Enroll_server/File[/var/lib/sftd/enrollment.token]: Scheduling refresh of Service[sftd]
Notice: /Stage[main]/Enroll_server/Service[sftd]: Triggered 'refresh' from 1 event
```

In ASA, you will see the servers enrolled in your project:

{% img blog/okta-puppet/asa-puppet-all.png alt:"ASA: Puppet clients enrolled" width:"800" %}{: .center-image }

## Test access to servers with Okta

Now that all servers are enrolled in Okta, let's access the servers as a user:

Install the ASA agent in your workstation (required to access servers as a user):

```sh
brew install okta-advanced-server-access --cask
```

To setup the ASA agent, enter `sft enroll` and follow the instructions.

To see your servers, enter `sft list-servers`.

```sh
# sft list-servers
Waiting on browser...
Browser step completed successfully.
HOSTNAME                    OS_TYPE  PROJECT_NAME         ACCESS_ADDRESS
asa-puppet-1-main           linux    Frederico_Servers    192.168.0.101
asa-puppet-2-centos         linux    Frederico_Servers    192.168.0.102
asa-puppet-3-ubuntu         linux    Frederico_Servers    192.168.0.103
asa-puppet-4-suse           linux    Frederico_Servers    192.168.0.104
```

To ssh into your server, enter `sft ssh <name-of-your-server>`:

```sh
# sft ssh asa-puppet-3-ubuntu
/home/frederico_hakamine #  
```

## Wait, I have questions

**What Okta ASA does for the login?**

- Okta ASA secures access to Linux and Windows servers in SSH and RDP connections using a lightweight server agent. The agent works alongside native OS features such as sudo, users, and openssh to control access.
- Because the agent is light and does not require firewalls or monolith privileged access servers, it can be easily distributed across any infrastructure (IaaS, VM, or physical) and embedded in your DevOps tools.
- To grant users access to servers, ASA issues ephemeral ssh keys for the user workstation and the OS for access. The keys are issued only after ensuring both user and his/her device complies with the organization security policies.
- The use of ephemeral keys provides many benefits. It eliminates the use of static keys and credentials for server access, ensures that both users and machines are audited before any new ssh connection, simplifies access revocation, eliminates the risk of "super account overuse", and simplifies access audit.

**What does the `okta-asa-sample.pp` do?**

The example installs the ASA server agent and then enroll your servers into ASA for remote access.

The example supports different Linux distros using the server distro family fact:

```rb
#Class for installing ASA
class asa_setup {
    if $facts['os']['family'] == 'Debian' {
        notice("This is: ${::osfamily} - ${::fqdn}")
        include install_deb
    }
    elsif $facts['os']['family'] == 'RedHat' {
        notice("This is: ${::osfamily} - ${::fqdn}")
        include install_rpm
    }
    elsif $facts['os']['family'] == 'Suse' {
        notice("This is: ${::osfamily} - ${::fqdn}")
        include install_rpm
    }
    else {
        notice("This sample doesn't work yet on: ${::osfamily} - ${::fqdn}")
    }
}
```

The steps for enrolling the servers are the same across all Linux distros.

## What's next?

After testing the sample on some clients, you expand to the rest of your infrastructure and tweak the sample to take full advantage of your Puppet environment – i.e. Bolt, Hiera, secret management tools..., and best practices.

You can also turn on additional features in Okta ASA, such as setup sudo grants, time-based access, use of bastion hosts, and session recording just to name a few. All these features reduce the load on your catalogs and allow provide consistent account configuration across multiple servers.