---
layout: blog_post
title: "Tutorial: Ansible and Account Automation with Okta"
author: sudobinbash
by: contractor
communities: [devops]
description: "How to integrate Okta and Ansible to manage accounts in servers while abstracting account management from your playbooks"
tags: [devops]
tweets:
- "Learn how to integrate Okta and Ansible to manage server accounts and abstract account management from your playbooks"
- "Remove account management from your Ansible playbooks. Here's how"
image: blog/
type: conversion
---

If you use Ansible to automate configuration management across dynamic server fleets, there's a question about identity & access management – how do you get accounts and credentials on the machines?

A common practice is to push SSH Keys for every admin user to every server. This has major security implications, however. What happens when an administrator leaves the company? It is then up to someone to clear out those keys on each machine, oftentimes a manual process.

Another common practice is to front your servers with an LDAP interface, configuring a local PAM module on each machine to sync local server accounts with an upstream Identity Provider. This leaves a significant operational burden, however. Do you want to run an HA middleware service blocking your ability to scale in the cloud? This is a pain point no Ops Engineer wants.

In this tutorial, we will overcome both issues by seamlessly injecting Okta into your Ansible Infrastructure as Code to effectively [Shift Identity Left](https://www.okta.com/blog/2019/07/shift-identity-left-secure-devops-automation-with-okta/):

{% img blog/okta-ansible/conceptual-diagram.png alt:"Okta working together with Ansible" width:"800" %}{: .center-image }

**Note:** To follow this tutorial, you need to have an Advanced Server Access (ASA) team provisioned from your Okta Org. If you don't have an existing ASA team, you can sign up for free [here](https://app.scaleft.com/p/signupV2), which requires an Okta Administrator to [configure](https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/setup/getting-started.htm).

## Create a project and get an enrollment token in ASA

In Okta ASA, projects work as a collection of servers that share the same access and authorization controls. In a project, you define which users and groups from Okta can access your servers, when they can do so, and what they are allowed to do in the server (i.e. run only certain commands). Any changes in your project (users, group assignments, authorization) are periodically updated in your servers (providing idempotency for identity and access management).

Servers enroll in your project to apply the same security configuration using an ASA agent with a project enrollment token. The ASA agent periodically checks for updates in Okta to update the server configuration.

To get your servers running with Okta, lets create a project and get an enrollment token:

1. Access Okta ASA as Administrator.
2. Click **Projects** and then select or create a new project.
3. Click **Enrollment** > **Create Enrollment Token**.
4. Enter a name (i.e. `ansible-token`) and click **Submit**.
5. Copy the enrollment token:

{% img blog/okta-ansible/asa-get-token.png alt:"Enrollment token page" width:"800" %}{: .center-image }

## Download and configure playbook

Clone our sample playbook `git clone https://github.com/okta-server-asa/asa-ansible-example.git`

Optionally, review the `asa-playbook.yml` contents.

The playbook installs the Okta ASA server agent binaires. It supports multiple Linux distros using the server distro family to identify the ideal installation tasks:

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

{% img blog/okta-Ansible/asa-list-servers.png alt:"ASA: Servers Enrolled" width:"800" %}{: .center-image }

At this moment, your servers are enrolled in ASA. That means you can access your servers with users and groups from Okta associated with your project.

## Test access to servers with Okta

Now that all servers are enrolled in Okta, let's access the servers as a user:

[Install the ASA agent in your workstation](https://www.google.com/url?q=https://help.okta.com/en/prod/Content/Topics/Adv_Server_Access/docs/sft.htm&sa=D&ust=1610060131465000&usg=AOvVaw1omaR8RXzvDBwm3OddiJVk) (required to access servers as a user): `brew install okta-advanced-server-access --cask`

To setup the ASA agent, enter `sft enroll` and follow the instructions.

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

**What Okta ASA does for the login?**

- Okta ASA secures access to Linux and Windows servers in SSH and RDP connections using a lightweight server agent. The agent works alongside native OS features such as sudo, users, and openssh to control access.
- Because the agent is light and does not require firewalls or monolith privileged access servers, it can be easily distributed across any infrastructure (IaaS, VM, or physical) and embedded in your DevOps tools.
- To grant users access to servers, ASA issues ephemeral ssh keys for the user workstation and the OS for access. The keys are issued only after ensuring both user and his/her device complies with the organization security policies.
- The use of ephemeral keys provides many benefits. It eliminates the use of static keys and credentials for server access, ensures that both users and machines are audited before any new ssh connection, simplifies access revocation, eliminates the risk of "super account overuse", and simplifies access audit.

**Can I use this playbook with other Ansible provisioning modules?**

Yes. You can use this sample with any other module available in [Ansible](https://docs.ansible.com/ansible/latest/collections/index.html) or the Ansible Galaxy. This includes provisioning modules to IaaS providers and Hypervisors, such as [AWS](https://docs.ansible.com/ansible/latest/collections/amazon/aws), [VMWare](https://docs.ansible.com/ansible/latest/collections/community/vmware), [GCP](https://docs.ansible.com/ansible/latest/collections/google/cloud), [OpenStack](https://docs.ansible.com/ansible/latest/collections/openstack/cloud), and [Azure](https://docs.ansible.com/ansible/latest/collections/azure/azcollection). To do this, use the inventory plugins available with these modules to capture the inventory of servers and tags to apply the playbook.

## What's next?

After testing the playbook on some hosts, you expand it to more servers. To do so, tweak the playbook. You can, for example, store the enrollment token in [Ansible's vault](https://docs.ansible.com/ansible/2.8/user_guide/vault.html), and also secure access to the Ansible controller with ASA using the same playbook. – i.e. update your `asa-playbook.yml`, changing the hosts to `local`, and then run the playbook pointing to local: `ansible-playbook  -c local -i localhost asa-playbook.yml --extra-vars "asa_enrollment_token=<local>"`.

You can also turn on additional features in Okta ASA, such as setup sudo grants, time-based access, use of bastion hosts, and SSH session capture just to name a few. All these features reduce the load on your playbooks and allow provide consistent account configuration across multiple servers.