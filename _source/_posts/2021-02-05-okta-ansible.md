---
layout: blog_post
title: "Tutorial: Ansible and Account Automation with Okta"
author: frederico-hakamine
by: internal-contributor
communities: [devops]
description: "How to integrate Okta and Ansible to manage accounts in servers while abstracting account management from your playbooks"
tags: [devops]
tweets:
- "Learn how to integrate Okta and Ansible to manage server accounts and abstract account management from your playbooks"
- "Remove account management from your Ansible playbooks. Here's how"
image: blog/
type: conversion
---

**Tip:** This tutorial is part of our series on how to integrate Okta with popular Infrastructure as a Code solution. If you're not into Ansible, check out our [Puppet](/blog/2021/01/22/okta-puppet) and [Terraform](/blog/2020/04/24/okta-terraform-automate-identity-and-infrastructure) tutorials.

I love using Ansible to deploy and manage configuration at scale. However, like any other configuration management solution, Ansible works best when playbooks don't change often. This is easy to accomplish when you manage only server artifacts and binaries, but it can get tricky if your playbooks manage user accounts and credentials that will change quite often as people join, change roles, or leave your team.

To overcome this, admins would typically look at distributing SSH keys or using some sort of 3rd party LDAP/AD for login.

Distributing SSH Keys has major maintenance implications since it requires a lot of work anytime you need to rotate keys. If you use SSH keys for user logins, the recommendation is to rotate keys often – to reduce risks in case the keys are compromised – plus every time an admin leaves the company.

Integrating your infra to an AD/LDAP server – usually using a PAM module – may be even more challenging, since this type of server is usually monolithic and hosted on-prem. Getting a robust integration here is a tall order. From site-to-site VPNs (making your AD available everywhere) to adding additional servers (keeping compatibility across a variety of server distros), this is the kind of pain no Ops Engineer would like to sign up for.

In this tutorial, we will overcome both issues by seamlessly injecting Okta into your Ansible Infrastructure as Code to effectively [Shift Identity Left](https://www.okta.com/blog/2019/07/shift-identity-left-secure-devops-automation-with-okta/):

{% img blog/okta-ansible/conceptual-diagram.png alt:"Okta working together with Ansible" width:"800" %}{: .center-image }

**Note:** To follow this tutorial, you need to have an Advanced Server Access (ASA) team provisioned from your Okta Org. If you don't have an existing ASA team, you can sign up for free [here](https://app.scaleft.com/p/signupV2), which requires an Okta Administrator to [configure](https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/setup/getting-started.htm).

## Create a project and get an enrollment token in ASA

In Okta ASA, projects work as a collection of servers that share the same access and authorization controls. In a project, you define which users and groups from Okta can access your servers, when they can do so, and what they are allowed to do in the server (i.e. run only certain commands). Any changes in your project (users, group assignments, authorization) are periodically updated in your servers (providing idempotency for identity and access management).

Servers enroll in your project to apply the same security configuration using an ASA agent with a project enrollment token. The ASA agent periodically checks for updates in Okta to update the server configuration.

To get your servers running with Okta, let's create a project and get an enrollment token:

1. Access Okta ASA as Administrator.
2. Click **Projects** and then select or create a new project.
3. Click **Enrollment** > **Create Enrollment Token**.
4. Enter a name (i.e. `ansible-token`) and click **Submit**.
5. Copy the enrollment token:

{% img blog/okta-ansible/asa-get-token.png alt:"Enrollment token page" width:"800" %}{: .center-image }

## Download and configure playbook

Clone our sample playbook `git clone https://github.com/okta-server-asa/asa-ansible-example.git`

Optionally, review the `asa-playbook.yml` contents.

The playbook installs the Okta ASA server agent binaries. It supports multiple Linux distros using the server distro family to identify the ideal installation tasks:

```yaml
  tasks:     
    #INSTALL
    - name: Install Debian
      include_tasks: asa-samples/install-debian.yml
      when: ansible_facts['os_family'] == "Debian"
    
    - name: Install RedHat
      include_tasks: asa-samples/install-redhat.yml
      when: ansible_facts['os_family'] == "RedHat"
    
    - name: Install Suse
      include_tasks: asa-samples/install-suse.yml
      when: ansible_facts['os_family'] == "Suse"
```

After installing the agent binaries, the playbook:

- Defines the name of your server in ASA (canonical name)
- Enrolls your server into the ASA project using the enrollment token you got in the previous section
- Starts the ASA server agent

Edit the `asa-ansible-example/asa-playbook.yml`. On line 3, replace `<hosts>` with the hosts you want to enroll in ASA:

```yaml
-
  name: Install SFT
  hosts: <hosts>
```

If you have SUSE Linux servers, install the Ansible Galaxy module for zypper: `ansible-galaxy install community.general.zypper`

## Test playbook

Now that we have the playbook set, let's see it in action. To do this, I'll apply the playbook on a few servers to see how it works.

Enroll servers using the ansible-playbook command `ansible-playbook asa-playbook.yml -i <inventory> --extra-vars "asa_enrollment_token=<token>"`.

Replace:

- `<inventory>`: with your inventory file (or any list of servers)
- `<token>`: with the enrollment token from ASA

Ansible will run and register your servers, and return the following:

{% img blog/okta-ansible/ansible-summary.png alt:"Ansible Summary" width:"800" %}{: .center-image }

In ASA, you will see the servers enrolled in your project:

{% img blog/okta-ansible/asa-list-servers.png alt:"ASA: Servers Enrolled" width:"800" %}{: .center-image }

At this moment, your servers are enrolled in ASA. That means you can access your servers with users and groups from Okta associated with your project.

## Test access to servers with Okta

Now that all servers are enrolled in Okta, let's access the servers as a user:

[Install the ASA agent in your workstation](https://www.google.com/url?q=https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/sft.htm&sa=D&ust=1610060131465000&usg=AOvVaw1omaR8RXzvDBwm3OddiJVk) (required to access servers as a user): `brew install okta-advanced-server-access --cask`

To set up the ASA agent, enter `sft enroll` and follow the instructions.

To see your servers, enter `sft list-servers`.

```sh
# sft list-servers
Waiting on browser...
Browser step completed successfully.
HOSTNAME                    OS_TYPE  PROJECT_NAME         ACCESS_ADDRESS
asa-ansible2-centos         linux    Frederico_Servers    192.168.0.101
asa-ansible3-centos         linux    Frederico_Servers    192.168.0.102
asa-ansible4-suse           linux    Frederico_Servers    192.168.0.103
asa-ansible5-suse           linux    Frederico_Servers    192.168.0.104
asa-ansible4-ubuntu         linux    Frederico_Servers    192.168.0.105
asa-ansible5-ubuntu         linux    Frederico_Servers    192.168.0.106
```

To ssh into your server, enter `sft ssh <name-of-your-server>`:

```sh
# sft ssh asa-ansible4-ubuntu
/home/frederico_hakamine #  
```

## Wait, I have questions

**What is Okta ASA doing?**

- Okta ASA secures access to Linux and Windows servers in SSH and RDP connections using the server agent (the same one that enrolled the server in your project earlier).
- The ASA server agent, in addition to subscribing your server to a project, also works alongside native OS features such as sudo, users, and openssh to control access during runtime and to capture any login events for audit inspection.
- Because the agent is light and does not require firewalls and monolithic LDAP or privileged access servers, it can be easily distributed across any infrastructure (IaaS, VM, or physical) and embedded in your DevOps tools.
- To grant users access to servers, ASA operates a programmable Certificate Authority service as part of its SaaS, that issues ephemeral SSH Client Certificates for each authenticated and authorized request. The keys are issued only after ensuring both user and his/her device complies with the organization's security policies.
- The use of ephemeral keys provides many benefits. It eliminates the use of static keys and credentials for server access, ensures that both users and machines are audited before any new ssh connection, simplifies access revocation, eliminates the risk of "super account overuse", and simplifies access audit.

**Can I use this playbook with other Ansible provisioning modules?**

Yes. You can use this sample with any other module available in [Ansible](https://docs.ansible.com/ansible/latest/collections/index.html) or the Ansible Galaxy. This includes provisioning modules to IaaS providers and Hypervisors, such as [AWS](https://docs.ansible.com/ansible/latest/collections/amazon/aws), [VMWare](https://docs.ansible.com/ansible/latest/collections/community/vmware), [GCP](https://docs.ansible.com/ansible/latest/collections/google/cloud), [OpenStack](https://docs.ansible.com/ansible/latest/collections/openstack/cloud), and [Azure](https://docs.ansible.com/ansible/latest/collections/azure/azcollection). To do this, use the inventory plugins available with these modules to capture the inventory of servers and tags to apply the playbook.

## What's next?

After testing the playbook on some hosts, you expand it to more servers. To do so, tweak the playbook. You can, for example, store the enrollment token in [Ansible's vault](https://docs.ansible.com/ansible/2.8/user_guide/vault.html), and also secure access to the Ansible controller with ASA using the same playbook. – i.e. update your `asa-playbook.yml`, changing the hosts to `local`, and then run the playbook pointing to local:

```ansible-playbook  -c local -i localhost asa-playbook.yml --extra-vars "asa_enrollment_token=<local>"```

You can also turn on additional features in Okta ASA, such as setup sudo grants, time-based access, use of bastion hosts, and SSH session capture just to name a few. All these features reduce the load on your playbooks and provide consistent account configuration across multiple servers.
