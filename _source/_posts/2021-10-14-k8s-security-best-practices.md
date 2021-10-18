---
layout: blog_post
title: "How to Secure Your Kubernetes Clusters With Best Practices"
author: deepu-sasidharan
by: advocate
communities: [kubernetes, devops]
description: "What are the best practices when it comes to securing your Kubernetes clusters."
tags: [kubernetes, devops, oidc, okta]
tweets:
  - "Is your Kubernetes cluster secure? lets take a look at the security best practices for #k8s"
  - "Best practices for securing your #Kubernetes clusters"
type: awareness
image: blog/k8s-security-best-practices/social.jpeg
---

- Use Kubernetes Role-Based Access Control (RBAC)
- Secure the API server with OpenID Connect 
  - https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens
  - https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks
  
- Use Secrets for all sensitive data with appropriate access
- Keep Kubernetes version up to date
- Restrict API and SSH access
- Secure container images (https://developer.okta.com/blog/2019/07/18/container-security-a-developer-guide)
  - Do not run containers as root
  - Enable container image scanning to catch known vulnerabilities in your CI/CD phase
  - Use minimal up to date base images from official repositories
  - Remove all unwanted dependencies, packages and debugging tools from the image
- Use namespaces to0 isolate workloads
- Use Kubernetes network policies to control traffic between pods and clusters
- Use monitoring tools to monitor all traffic and enable audit logging
- Use Pod Security Policies


- Enable Kubernetes Role-Based Access Control (RBAC)
- Use secrets
- Use Third-Party Authentication for API Server
- Protect etcd with TLS, Firewall and Encryption
- Isolate Kubernetes Nodes
- Monitor Network Traffic to Limit Communications
- Use Process Whitelisting
- Turn on Audit Logging
- Keep Kubernetes Version Up to Date
- Lock Down Kubelet
- Restrict API access.
- Restrict SSH access
- Make sure you're using namespaces
- Use network policies to restrict access
- Do not run as root
- Set up IAM access
- Securing container images in a CI/CD pipeline
- Securing the Kubernetes Control Plane
- Reducing risk with Role-Based Access Control
- Securing Pods with Pod Security Policies
- Securing cloud-native workloads at runtime
