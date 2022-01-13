---
layout: blog_post
title: "How to Run Secure Rust WebAssembly Workloads on Kubernetes with Krustlet"
author: deepu-sasidharan
by: advocate
communities: [devops, rust]
description: "Learn how to run secure WebAssembly workloads written with Rust on Kubernetes with Krustlet"
tags: [rust, webassembly, kubernetes, security]
tweets:
  - ""
  - ""
  - ""
image:
type: awareness
---

WebAssembly (wasm) is one of the most exciting technology to be invented in recent times, especially in the software development world. It's a binary instruction format for a stack-based virtual machine. It aims to execute at native speeds with a memory-safe and secure sandbox. Its portable, cross-platform and language agnostic. It's designed as a compilation target for languages. Though originally intended for the web as part of the open web platform, it now has found use cases beyond the web. Currently WebAssembly can be used on browsers, Node.js, Deno, Kubernetes and on IoT platform.

You can learn more about WebAssembly at [WebAssembly.org](https://webassembly.org/).

# WebAssembly on Kubernetes

WebAssembly, though originally designed for [the web](https://www.w3.org/wasm/), proved to be an ideal format for writing platform and language agnostic applications. We are used to something similar in the container world, Docker containers, and people figured WebAssembly is so similar and even more efficient since its fast, portable and secure running at native speeds. This means that we can use WebAssembly along side containers as workloads on Kubernetes. This was made possible by another WebAssembly initiative known as [WebAssembly System Interface (WASI)](https://wasi.dev/).

WebAssembly on Kubernetes is quite new and has some rough edges at the moment but its already proving to be revolutionary since WebAssembly workloads can be extremely fast, they can execute faster than a container takes to start. They are also sandboxed and hence much more secure than containers, and finally they are way smaller in size due to the binary format than containers.

If you want to learn more about WASI, check out [the announcement from Mozilla](https://hacks.mozilla.org/2019/03/standardizing-wasi-a-webassembly-system-interface/).

# Why Rust?

I previously wrote a blog post about [why Rust is a great language for the future](https://deepu.tech/my-second-impression-of-rust/), Tl;Dr; Rust is a secure and fast language without the compromises of most languages and Rust has the [best ecosystem and tooling](https://rustwasm.github.io/docs/book/) for WebAssembly. So Rust + WebAssembly makes it super secure and fast.

# Enter Krustlet

[Krustlet](https://krustlet.dev/) is a [Kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/) written in Rust for WebAssembly workloads (written in any language). It listens for new pods assigned to it based on tolerations specified on the manifest and runs them. Since the default Kubernetes nodes cannot run WebAssembly workloads natively we need something like Krustlet for that.

# Run WebAssembly workloads on Kubernetes with Krustlet

We will use Krustlet to run a WebAssembly workload written in Rust on Kubernetes today.

## Preparing the cluster

First we need to prepare a cluster and install Krustlet on the cluster so that we can run WebAssembly on it. I'm using k3d to run a local k3s cluster, you can also use [MiniKube](https://docs.krustlet.dev/howto/krustlet-on-minikube/), [MicroK8s](https://docs.krustlet.dev/howto/krustlet-on-microk8s/), kinD or [another Kubernetes cluster](https://docs.krustlet.dev/intro/quickstart/).

First step is to create a cluster with bootstrap token enabled using the API Server argument `enable-bootstrap-token-auth`. You can check if its enabled using the command `ps -ef | grep kube-apiserver | grep "enable-bootstrap-token-auth"`. For k3d the below command will create the proper cluster, for other k8s distributions you can follow the [quick start instructions](https://docs.krustlet.dev/intro/quickstart/) from Krustlet.

```bash
k3d cluster create wasm-test \
--k3s-arg "--kube-apiserver-arg=enable-bootstrap-token-auth@server:0"
```

or

```
kind create cluster
```

Now we need to bootstrap Krustlet and you will need `kubectl` installed and a kubeconfig that has access to create `Secrets` in the `kube-system` namespace and can approve `CertificateSigningRequests`. We can use the [handy script](https://github.com/krustlet/krustlet/tree/main/scripts) from Krustlet to do this. So download the appropriate script for your OS and run it.

```bash
curl https://raw.githubusercontent.com/krustlet/krustlet/main/scripts/bootstrap.sh | /bin/bash
```

Now we can install run Krustlet

Download a binary release from the [release page](https://github.com/krustlet/krustlet/releases) and run it.

```bash
# Download
curl -O https://krustlet.blob.core.windows.net/releases/krustlet-v1.0.0-alpha.1-linux-amd64.tar.gz
tar -xzf krustlet-v1.0.0-alpha.1-linux-amd64.tar.gz
# Install
KUBECONFIG=~/.krustlet/config/kubeconfig \
  ./krustlet-wasi \
  --node-ip=172.17.0.1 \
  --node-name=krustlet \
  --bootstrap-file ~/.krustlet/config/bootstrap.conf
```

You should see a prompt to manually approve TLS certs since the serving certs used by Krustlet needs to be manually approved. Open a new terminal and run the below command. The hostname will be shown in the prompt.

```bash
kubectl certificate approve <hostname>-tls
```

This will be required only for the first time, when you start the Krustlet. Keep the `krustlet-wasi` command running. You might see some errors being logged but lets ignore it for now as Krustlet is still in beta and there are some rough edges.

Lets see if the node is available. Run `kubectl get nodes -o wide` and you should see something like below

```bash
NAME                 STATUS   ROLES                  AGE   VERSION         INTERNAL-IP   EXTERNAL-IP   OS-IMAGE       KERNEL-VERSION            CONTAINER-RUNTIME
kind-control-plane   Ready    control-plane,master   16m   v1.21.1         172.21.0.2    <none>        Ubuntu 21.04   5.15.12-200.fc35.x86_64   containerd://1.5.2
krustlet             Ready    <none>                 12m   1.0.0-alpha.1   172.17.0.1    <none>        <unknown>      <unknown>                 mvp
```

Now lets test if the Krustlet is working as expected by applying the below WASM workload to it. As you can see we have tolerations defined so that this will not be scheduled on normal nodes.

```yml
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: hello-wasm
spec:
  containers:
  - name: hello-wasm
    image: webassembly.azurecr.io/hello-wasm:v1
  tolerations:
  - effect: NoExecute
    key: kubernetes.io/arch
    operator: Equal
    value: wasm32-wasi   # or wasm32-wasmcloud according to module target arch
  - effect: NoSchedule
    key: kubernetes.io/arch
    operator: Equal
    value: wasm32-wasi
EOF
```

Note: If you encounter any access control error from the pod then you might have to add ClusterRole and ClusterRoleBinding to allow `system:nodes` group to access storage classes as [shown in Krustlet docs](https://docs.krustlet.dev/howto/csi/#addendum-role-based-access-control).

Once applied, run `kubectl get pods --field-selector spec.nodeName=krustlet` and you should see the pod executed on the Krustlet node. Don't worry about the status.

```bash
NAME                    READY   STATUS       RESTARTS   AGE
hello-wasm              0/1     ExitCode:0   0          71m
hello-world-wasi-rust   0/1     ExitCode:0   0          74m
```

Lets check the logs for the pod by running `kubectl logs hello-wasm`

## Setting up Rust for WebAssembly

## WebAssembly workload

## Run the workload

# Learn more about Kubernetes and WebAssembly

If you want to learn more about Kubernetes, OIDC, or using OIDC with Kubernetes, and security in general, check out these additional resources.

- [How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC](/blog/2021/11/08/k8s-api-server-oidc)
- [Securing a Cluster](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)
- [OpenID Connect Tokens](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens)
- [RBAC vs. ABAC: Definitions & When to Use](https://www.okta.com/identity-101/role-based-access-control-vs-attribute-based-access-control/)
- [OAuth 2.0 and OpenID Connect Overview](https://developer.okta.com/docs/concepts/oauth-openid/)
- [Secure Access to AWS EKS Clusters for Admins](/blog/2021/10/08/secure-access-to-aws-eks)
- [Managing Multiple Okta Instances with Terraform Cloud](/blog/2020/02/03/managing-multiple-okta-instances-with-terraform-cloud)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
