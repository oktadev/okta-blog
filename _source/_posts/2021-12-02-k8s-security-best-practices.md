---
layout: blog_post
title: "How to Secure Your Kubernetes Clusters With Best Practices"
author: deepu-sasidharan
by: advocate
communities: [kubernetes, devops]
description: "What are the best practices when it comes to securing your Kubernetes clusters."
tags: [kubernetes, devops, oidc, okta]
tweets:
  - "Is your Kubernetes cluster secure? let's take a look at the security best practices for #k8s"
  - "Don't let your Kubernetes clusters be the weak link. Check out these best practices for securing your #Kubernetes clusters"
type: awareness
image: blog/k8s-security-best-practices/social.jpg
---

Kubernetes has become an unavoidable part of a software infrastructure these days. If you are an enterprise or medium/large company, chances are you are already running Kubernetes clusters for your workloads. If you are a DevOps engineer, there is a good chance you are maintaining either an on-prem Kubernetes cluster or a PaaS like Amazon EKS, Microsoft AKS, or GKE. But regardless of how you run your Kubernetes clusters, you need to make sure that they are secure.

The Kubernetes API server has multiple layers of security.

1. [**Transport security**](https://kubernetes.io/docs/concepts/security/controlling-access/): All API communication is done via TLS (transport layer security) using valid certificates.
2. [**Authentication**](https://kubernetes.io/docs/reference/access-authn-authz/authentication/): All API requests are authenticated with one of the several authentication mechanisms supported by Kubernetes.
3. [**Authorization**](https://kubernetes.io/docs/reference/access-authn-authz/authorization/): All authenticated requests are authorized using one or more of the supported authorization models.
4. [**Admission control**](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/): All authorized requests, except read/get requests, are validated by admission control modules.

Kubernetes comes with many security options out of the box, but to bulletproof your infrastructure, you need to consider many more security best practices. Today we will look into some of the vital security best practices for Kubernetes.

## 1. Use Kubernetes Role-Based Access Control (RBAC)

Kubernetes supports multiple authorization models for its API server. These are [ABAC (Attributed-Based Access Control)](https://kubernetes.io/docs/reference/access-authn-authz/abac/), [RBAC (Role-Based Access Control)](https://kubernetes.io/docs/reference/access-authn-authz/rbac/), [Node authorization](https://kubernetes.io/docs/reference/access-authn-authz/node/) and the [Webhook mode](https://kubernetes.io/docs/reference/access-authn-authz/webhook/). Out of all these, RBAC is the more secure and most widely used and is ideal for enterprises and medium to large organizations. With RBAC, you can define role-based access control that closely resembles your organization's business rules. RBAC also works great with OIDC authentication.

Most Kubernetes distributions have RBAC enabled by default. You can check this by running the command `kubectl cluster-info dump | grep authorization-mode`, which should have `authorization-mode=RBAC` in the output. If not, you can enable it using the `--authorization-mode` flag for the API server when creating or patching the cluster. For example, setting `--authorization-mode=RBAC,Node` will enable both RBAC and Node authorization on the cluster.

Once RBAC is enabled, you can create roles (`Role`/`ClusterRole`) and bindings (`RoleBinding`/`ClusterRoleBinding`) to control access to your resources. Here is an example of a role and role binding that lets users view pods and services.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: fancy-namespace
  name: pod-service-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods", "services]
  verbs: ["get", "watch", "list"]
```

The below binds the above role to a specific group of users.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-services
  namespace: fancy-namespace
roleRef:
  kind: Role #this must be Role or ClusterRole
  name: pod-service-reader # this must match the name of the Role or ClusterRole you wish to bind to
  apiGroup: rbac.authorization.k8s.io
subjects: # subject can be individual users or a group of users. Group is defined in the external authentication service, in this case, an OIDC server
  - kind: Group
    name: k8s-restricted-users
```

## 2. Secure the API server with OpenID Connect

Kubernetes supports many authentication mechanisms. Some of the most common are:

- Client certificates
- Basic authentication
- Tokens (Service account tokens, Bearer tokens, and so on)
- [OpenID Connect (OIDC)](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens)
- Proxy

Out of all these authentication mechanisms, OIDC is the most secure and scalable solution. It is ideal for clusters accessed by large teams as it provides a single sign-on solution for all users and makes it easy to onboard and offboard users. It is also way more secure than other mechanisms as you don't have to store any sensitive information on a user's computer, like client secrets and passwords. You can also use features like [MFA](https://en.wikipedia.org/wiki/Multi-factor_authentication) and Yubikey if supported by your OIDC provider.

{% img blog/k8s-api-server-oidc/kube-login-oidc.jpg alt:"K8s OIDC flow" width:"800" %}{: .center-image }

OIDC combined with RBAC becomes necessary as more and more people start accessing the cluster. It becomes essential to create groups and roles and provide limited access to specific groups. You can read more about this in my previous post [How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC](/blog/2021/11/08/k8s-api-server-oidc).

## 3. Use Secrets for all sensitive data with appropriate access

This one should be a no-brainer. Kubernetes has a [Secret](https://kubernetes.io/docs/concepts/configuration/secret) resource that can be used to store sensitive data. This is a great way to store passwords, keys, and other sensitive data. Secrets can be used for storing string data, docker config, certificates, tokens, files, and so on. Secrets can be mounted as data volumes or exposed as environment variables to be used in containers. Secrets can be plain text or encoded, but please don't be that person who uses plain text secrets.

Secrets are flexible and native to Kubernetes, so there is no reason for you not to use them. Also, make sure to implement proper RBAC for secrets so that not everyone has access to them.

## 4. Keep Kubernetes version up to date

Like any other software, Kubernetes also has bugs and issues. And from time to time, there might be a high severity bug that calls for a [CVE](https://en.wikipedia.org/wiki/Common_Vulnerabilities_and_Exposures). Hence, it's an excellent idea to keep the Kubernetes version up to date on the server and the CLI client. You can check the [Kubernetes security and disclosure information website](https://kubernetes.io/docs/reference/issues-security/security/) to see if there are known security vulnerabilities for your Kubernetes version. If you are using a managed PaaS, it should be pretty easy to upgrade, and for on-prem installations, there are tools like [kOps](https://kops.sigs.k8s.io/), [kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/), and so on, that makes it easy to upgrade clusters.

## 5. Restrict kubelet, API, and SSH access

[kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/) is the primary "node agent" running on each node, and by default, a kubelet's HTTP endpoints are not secured. This could allow unintended access and hence [should be restricted](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet-authentication-authorization/).

When someone has access to a Kubernetes cluster, they can access the k8s API server and SSH into the cluster nodes themselves. To limit node access, cluster access should be limited as much as possible. Disable SSH access for non-admin users. Secure the API server using OIDC and RBAC, as we saw earlier, so that only authenticated users with sufficient roles can access the API.

## 6. Secure container images

Securing the container images that run on the cluster is as important as securing the cluster itself. A malicious image running on a cluster could wreak havoc. Follow these best practices for container image security.

- Do not run containers as root as this would give the container unlimited access to the host. Always run the containers using a non-root user.
- Enable container image scanning in your CI/CD phase to catch known vulnerabilities using tools like [clair](https://github.com/quay/clair) or [Anchore](https://github.com/anchore/anchore-engine).
- Use minimal up-to-date official base images and remove all unwanted dependencies, packages, and debugging tools from the image as it will make it more secure and lightweight.
- Prevent loading unwanted kernel modules in the containers. These can be restricted using rules in `/etc/modprobe.d/kubernetes-blacklist.conf` of the node or by uninstalling the unwanted modules from the node.
- Use [official verified images](https://docs.docker.com/docker-hub/official_images/) for popular software. Use a trusted registry for non-official images and always verify the image publisher
- Use [Docker Bench for Security](https://github.com/docker/docker-bench-security) to audit your container images
- Use [Pod security policies](https://kubernetes.io/docs/concepts/policy/pod-security-policy/) to limit a container's access to the host further

You can read more about it in our "[Container Security: A Developer Guide](/blog/2019/07/18/container-security-a-developer-guide)".

## 7. Control traffic between pods and clusters

Generally, pods within the same cluster will be able to communicate with each other, and if you have multiple clusters in the same network, there may be traffic between them as well. Do not leave this all open, as it could lead to a compromised cluster when another in the network is affected. Use [Kubernetes network policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) to control traffic between pods and clusters and allow only necessary traffic.

## 8. Use namespaces to isolate workloads

Do not run all your workloads in a single namespace. Isolating workloads in different namespaces based on business needs is more secure and easier to manage with RBAC. This way, you can fine-tune RBAC even further to let users access only what they need to see. You can also use Kubernetes network policies to isolate traffic between namespaces where applicable.

## 9. Limit resource usages

As with securing APIs and the cluster itself, it is also essential to set resource limits on how much CPU, memory, and persistent disk space is used by namespaces and resources. This secures your cluster from denial of service attacks when a particular container uses up all the resources. [Resources quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/) and [limit ranges](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/memory-default-namespace/) can be used to set limits at the namespace level, and [Requests and limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) can be used to set resource limits at container level as well.

## 10. Use monitoring tools to monitor all traffic and enable audit logging

Finally, it is also extremely important to monitor and audit your clusters. [Enable audit logging for the cluster](https://kubernetes.io/docs/tasks/debug-application-cluster/audit/) and use monitoring tools to keep an eye on the networking traffic to, from and within a cluster. Monitoring can be done using open-source tools, like Prometheus, Grafana, or with proprietary tools.

## Bonus

Furthermore, keep these infrastructure best practices also in mind when securing your Kubernetes cluster.

- Ensure that all communication is done via TLS.
- Protect etcd with TLS, Firewall, and Encryption and restrict access to it using strong credentials.
- Set up IAM access policies in a supported environment like a PaaS.
- [Secure the Kubernetes Control Plane](https://www.cncf.io/blog/2021/08/20/how-to-secure-your-kubernetes-control-plane-and-node-components/).
- Rotate infrastructure credentials frequently.
- Restrict cloud metadata API access when running in a PaaS like AWS, Azure, or GCP.

# Learn more about Kubernetes and security

If you want to learn more about Kubernetes, OIDC, or using OIDC with Kubernetes, and security in general, check out these additional resources.

- [How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC](/blog/2021/11/08/k8s-api-server-oidc)
- [Securing a Cluster](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)
- [OpenID Connect Tokens](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens)
- [RBAC vs. ABAC: Definitions & When to Use](https://www.okta.com/identity-101/role-based-access-control-vs-attribute-based-access-control/)
- [OAuth 2.0 and OpenID Connect Overview](https://developer.okta.com/docs/concepts/oauth-openid/)
- [Secure Access to AWS EKS Clusters for Admins](/blog/2021/10/08/secure-access-to-aws-eks)
- [Managing Multiple Okta Instances with Terraform Cloud](/blog/2020/02/03/managing-multiple-okta-instances-with-terraform-cloud)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
