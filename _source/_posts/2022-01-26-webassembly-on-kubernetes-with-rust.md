---
layout: blog_post
title: "Containerless! How to Run WebAssembly Workloads on Kubernetes with Rust"
author: deepu-sasidharan
by: advocate
communities: [devops, rust]
description: "Learn how to run secure WebAssembly workloads written with Rust on Kubernetes with Krustlet."
tags: [rust, webassembly, kubernetes, security]
tweets:
  - "Do you want to go Containerless on Kubernetes? Learn how to run WebAssembly workloads written in Rust on Kubernetes. #rust #webassembly #kubernetes #security"
  - "Learn how to run secure WebAssembly workloads written with Rust on Kubernetes with Krustlet. #rust #webassembly #kubernetes #security"
  - "Is WebAssembly the future of Kubernetes? Learn all about Wasm on Kubernetes with Rust. #rust #webassembly #kubernetes #security"
image: blog/webassembly-on-kubernetes-with-rust/rust_wasm_k8s.jpg
type: awareness
---

WebAssembly (Wasm) is one of the most exciting and underestimated software technologies invented in recent times. It's a binary instruction format for a stack-based virtual machine that aims to execute at native speeds with a memory-safe and secure sandbox. Wasm is portable, cross-platform, and language-agnostic—designed as a compilation target for languages. Though originally part of the open web platform, it has found use cases beyond the web. WebAssembly is now used in browsers, Node.js, Deno, Kubernetes, and IoT platforms.

You can learn more about WebAssembly at [WebAssembly.org](https://webassembly.org/).

# WebAssembly on Kubernetes

Though initially designed for [the web](https://www.w3.org/wasm/), WebAssembly proved to be an ideal format for writing platform and language-agnostic applications. You may be aware of something similar in the container world—Docker containers. People, including Docker co-founder Solomon Hykes, recognized the similarity and acknowledged that WebAssembly is even more efficient since it's fast, portable, and secure, running at native speeds. This means that you can use WebAssembly alongside containers as workloads on Kubernetes. Another WebAssembly initiative known as [WebAssembly System Interface (WASI)](https://wasi.dev/) along with the [Wasmtime](https://github.com/bytecodealliance/wasmtime) project make this possible.

{% twitter 1111004913222324225 %}

WebAssembly on Kubernetes is relatively new and has some rough edges at the moment, but it's already proving to be revolutionary. Wasm workloads can be extremely fast as they can execute faster than a container takes to start. The workloads are sandboxed and hence much more secure than containers; they are way smaller in size due to the binary format than containers.

If you want to learn more about WASI, check out [the original announcement from Mozilla](https://hacks.mozilla.org/2019/03/standardizing-wasi-a-webassembly-system-interface/).

# Why Rust?

I previously wrote a blog post about [why Rust is a great language for the future](https://deepu.tech/my-second-impression-of-rust/), Tl;Dr; Rust is secure and fast without the compromises of most modern languages, and Rust has the [best ecosystem and tooling](https://rustwasm.github.io/docs/book/) for WebAssembly. So Rust + Wasm makes it super secure and fast.

# Enter Krustlet

[Krustlet](https://krustlet.dev/) is a [Kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/) written in Rust for WebAssembly workloads (written in any language). It listens for new pods assignments based on `tolerations` specified on the manifest and runs them. Since the default Kubernetes nodes cannot run Wasm workloads natively, you need a Kubelet that can, and this is where Krustlet comes in.

# Run WebAssembly workloads on Kubernetes with Krustlet

Today, you will use Krustlet to run a Wasm workload written in Rust on Kubernetes.

**Prerequisites**

- [Docker](https://docs.docker.com/engine/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) or another local kubernetes distribution
- [Rust toolkit](https://www.rust-lang.org/learn/get-started) (Includes rustup, rustc, and cargo)

## Preparing the cluster

First, you need to prepare a cluster and install Krustlet on the cluster to run WebAssembly on it. I'm using [kind](https://kind.sigs.k8s.io/) to run a local Kubernetes cluster; you can also use [MiniKube](https://docs.krustlet.dev/howto/krustlet-on-minikube/), [MicroK8s](https://docs.krustlet.dev/howto/krustlet-on-microk8s/), or [another Kubernetes distribution](https://docs.krustlet.dev/intro/quickstart/).

The first step is to create a cluster with the below command:

```bash
kind create cluster
```

Now you need to bootstrap Krustlet. For this, you will need `kubectl` installed and a kubeconfig that has access to create `Secrets` in the `kube-system` namespace and can approve `CertificateSigningRequests`. You can use these [handy scripts](https://github.com/krustlet/krustlet/tree/main/scripts) from Krustlet to download and run the appropriate setup script for your OS:

```bash
# Setup for Linux/macOS
curl https://raw.githubusercontent.com/krustlet/krustlet/main/scripts/bootstrap.sh | /bin/bash
```

Now you can install and run Krustlet.

Download a binary release from the [release page](https://github.com/krustlet/krustlet/releases) and run it. Download the appropriate version for your OS.

```bash
# Download for Linux
curl -O https://krustlet.blob.core.windows.net/releases/krustlet-v1.0.0-alpha.1-linux-amd64.tar.gz
tar -xzf krustlet-v1.0.0-alpha.1-linux-amd64.tar.gz
# Install for Linux
KUBECONFIG=~/.krustlet/config/kubeconfig \
  ./krustlet-wasi \
  --node-ip=172.17.0.1 \
  --node-name=krustlet \
  --bootstrap-file=${HOME}/.krustlet/config/bootstrap.conf
```

**Note**: If you use Docker for Mac, the node-ip will be different. Follow [the instructions from the Krustlet docs](https://docs.krustlet.dev/howto/krustlet-on-kind/#special-note-docker-desktop-for-mac) to figure out the IP. If you get the error "krustlet-wasi cannot be opened because the developer cannot be verified," you can allow it with the `allow anyway` button found at `System Preferences` > `Security & Privacy` > `General` on macOS.

You should see a prompt to manually approve TLS certs since the serving certs Krustlet uses must be manually approved. Open a new terminal and run the below command. The hostname will be shown in the prompt from the Krustlet server.

```bash
kubectl certificate approve <hostname>-tls
```

This will be required only for the first time when you start the Krustlet. Keep the Krustlet server running. You might see some errors being logged, but let's ignore it for now as Krustlet is still in beta, and there are some rough edges.

Let's see if the node is available. Run `kubectl get nodes`, and you should see something like this: 

```bash
kubectl get nodes -o wide
# Output
NAME                 STATUS   ROLES                  AGE   VERSION         INTERNAL-IP   EXTERNAL-IP   OS-IMAGE       KERNEL-VERSION            CONTAINER-RUNTIME
kind-control-plane   Ready    control-plane,master   16m   v1.21.1         172.21.0.2    <none>        Ubuntu 21.04   5.15.12-200.fc35.x86_64   containerd://1.5.2
krustlet             Ready    <none>                 12m   1.0.0-alpha.1   172.17.0.1    <none>        <unknown>      <unknown>                 mvp
```

Now let's test if the Krustlet is working as expected by applying the Wasm workload below. As you can see, we have `tolerations` defined so that this will not be scheduled on normal nodes.

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

Once applied, run `kubectl get pods` as shown below, and you should see the pod running on the Krustlet node.

```bash
kubectl get pods --field-selector spec.nodeName=krustlet
# Output
NAME                    READY   STATUS       RESTARTS   AGE
hello-wasm              0/1     ExitCode:0   0          71m
```

Don't worry about the status. It's [normal](https://github.com/kubernetes/kubernetes/issues/72020) for a workload that terminates normally to have `ExitCode:0`. Let's check the logs for the pod by running `kubectl logs`.

```bash
kubectl logs hello-wasm
# Output
Hello, World!
```

You have successfully set up a Kubelet that can run Wasm workloads on your cluster.

## Setting up Rust for WebAssembly

Now let us prepare an environment for WebAssembly with Rust. Make sure you are using a stable Rust version and not a nightly release.

First, you need to add `wasm32-wasi` target for Rust so that you can compile Rust apps to WebAssembly. Run the below command:

```bash
rustup target add wasm32-wasi
```

Now you can create a new Rust application with Cargo.

```bash
cargo new --bin rust-wasm
```

Open the created `rust-wasm` folder in your favorite IDE. I use Visual Studio Code with the fantastic [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=matklad.rust-analyzer) and [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb) plugins to develop in Rust.

## Create the WebAssembly workload

Let's write a small service that will print random cat facts on the console. For this, you could use a free public [API that provides random cat facts](https://catfact.ninja/fact).

Edit `cargo.toml` and add the following dependencies:

```toml
[dependencies]
wasi-experimental-http = "0.7"
http = "0.2.5"
serde_json = "1.0.74"
env_logger = "0.9"
log = "0.4"
```

Then edit `src/main.rs` and add the following code:

```rust
use http;
use serde_json::Value;
use std::{str, thread, time};

fn main() {
    env_logger::init();
    let url = "https://catfact.ninja/fact".to_string();
    loop {
        let req = http::request::Builder::new()
            .method(http::Method::GET)
            .uri(&url)
            .header("Content-Type", "text/plain");
        let req = req.body(None).unwrap();

        log::debug!("Request: {:?}", req);

        // send request using the experimental bindings for http on wasi
        let mut res = wasi_experimental_http::request(req).expect("cannot make request");

        let response_body = res.body_read_all().unwrap();
        let response_text = str::from_utf8(&response_body).unwrap().to_string();
        let headers = res.headers_get_all().unwrap();

        log::debug!("{}", res.status_code);
        log::debug!("Response: {:?} {:?}", headers, response_text);

        // parse the response to json
        let cat_fact: Value = serde_json::from_str(&response_text).unwrap();

        log::info!("Cat Fact: {}", cat_fact["fact"].as_str().unwrap());

        thread::sleep(time::Duration::new(60, 0));
    }
}
```

The code is simple. It makes a GET request to the API and parses and prints the response every 60 seconds. Now you can build this into a Wasm binary using this Cargo command:

```bash
cargo build --release --target wasm32-wasi
```

That's it. You have successfully created a WebAssembly binary using Rust.

## Run the workload locally (optional)

Let's run the workload locally using [Wasmtime](https://wasmtime.dev), a small JIT-style runtime for Wasm and WASI. Since Wasmtime doesn't support networking out of the box, we need to use the [wrapper](https://github.com/deislabs/wasi-experimental-http#testing-using-the-wasmtime-http-binary) provided by [wasi-experimental-http](https://github.com/deislabs/wasi-experimental-http). You can build it from source using the below command.

```bash
git clone https://github.com/deislabs/wasi-experimental-http.git
# Build for your platform
cargo build
# move to any location that is added to your PATH variable
mv ./target/debug/wasmtime-http ~/bin/wasmtime-http
```

Now run the below command from the `rust-wasm` project folder:

```bash
wasmtime-http target/wasm32-wasi/release/rust-wasm.wasm -a https://catfact.ninja/fact -e RUST_LOG=info
```

## Run the workload in Kubernetes

Before you can run the workload in Kubernetes, you need to push the binary to a registry that supports OCI artifacts. OCI-compliant registries can be used for any OCI artifact, including Docker images, Wasm binaries, and so on. Docker Hub currently does not support OCI artifacts; hence you can use another registry like [GitHub Package Registry](https://github.com/features/packages), [Azure Container Registry](https://azure.microsoft.com/en-in/services/container-registry/) or [Google Artifact Registry](https://cloud.google.com/artifact-registry). I'll be using GitHub Package Registry as it's the simplest to get started, and most of you might already have a GitHub account.

First, you need to log in to GitHub Package Registry using `docker login`. Create a [personal access token on GitHub](https://github.com/settings/tokens) with the `write:packages` scope and use that to log in to the registry.

```bash
export CR_PAT=<your-token>
echo $CR_PAT | docker login ghcr.io -u <Your GitHub username> --password-stdin
```

Now you need to push your Wasm binary as an OCI artifact; for this, you can use the [wasm-to-oci](https://github.com/engineerd/wasm-to-oci/releases) CLI. Use the below command to install it on your machine. Download the appropriate version for your OS.

```bash
# Install for Linux
curl -LO https://github.com/engineerd/wasm-to-oci/releases/download/v0.1.2/linux-amd64-wasm-to-oci
# move to any location that is added to your PATH variable
mv linux-amd64-wasm-to-oci ~/bin/wasm-to-oci
```

Now you can push the binary you built earlier to the GitHub Package Registry. Run the below command from the `rust-wasm` folder.

```bash
wasm-to-oci push target/wasm32-wasi/release/rust-wasm.wasm ghcr.io/<your GitHub user>/rust-wasm:latest
```

You should see a successful message. Now check the GitHub Packages page on your profile, and you should see the artifact listed.

{% img blog/webassembly-on-kubernetes-with-rust/gchr_repo.png alt:"GitHub Packages Registry" width:"800" %}{: .center-image }

By default, the artifact would be private, but you need to make it public so that you can access it from the Krustlet cluster. Click the package name and click the **Package settings** button, scroll down, click **Change visibility**, and change to **public**.

You can check this by pulling the artifact using the below command:

```bash
wasm-to-oci pull ghcr.io/<your GitHub user>/rust-wasm:latest
```

Yay! You have successfully pushed your first Wasm artifact to an OCI registry. Now let's deploy this to the Kubernetes cluster you created earlier.

Create a YAML file, let's say `k8s.yaml`, with the following contents:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: rust-wasi-example
  labels:
    app: rust-wasi-example
  annotations:
    alpha.wasi.krustlet.dev/allowed-domains: '["https://catfact.ninja/fact"]'
    alpha.wasi.krustlet.dev/max-concurrent-requests: "42"
spec:
  automountServiceAccountToken: false
  containers:
    - image: ghcr.io/<your GitHub user>/rust-wasm:latest
      imagePullPolicy: Always
      name: rust-wasi-example
      env:
        - name: RUST_LOG
          value: info
        - name: RUST_BACKTRACE
          value: "1"
  tolerations:
    - key: "node.kubernetes.io/network-unavailable"
      operator: "Exists"
      effect: "NoSchedule"
    - key: "kubernetes.io/arch"
      operator: "Equal"
      value: "wasm32-wasi"
      effect: "NoExecute"
    - key: "kubernetes.io/arch"
      operator: "Equal"
      value: "wasm32-wasi"
      effect: "NoSchedule"
```

**Note**: Remember to replace `<your GitHub user>` with your own GitHub username.

The `annotations` and `tolerations` are significant. The annotations are used to allow external network calls from the krustlet, and the tolerations limit the pod to only schedule/run on Wasm nodes. We are also passing some environment variables that the application will use.

Now apply the manifest using the below command and check the pod status.

```bash
kubectl apply -f k8s.yaml

kubectl get pods -o wide
# Output
NAME                READY   STATUS    RESTARTS   AGE     IP       NODE       NOMINATED NODE   READINESS GATES
rust-wasi-example   1/1     Running   0          6m50s   <none>   krustlet   <none>           <none>
```

You should see the Wasm workload running successfully on the Krustlet node. Let's check the logs.

```bash
kubectl logs rust-wasi-example
# Output
[2022-01-16T11:42:20Z INFO  rust_wasm] Cat Fact: Polydactyl cats (a cat with 1-2 extra toes on their paws) have this as a result of a genetic mutation. These cats are also referred to as 'Hemingway cats' because writer Ernest Hemingway reportedly owned dozens of them at his home in Key West, Florida.
[2022-01-16T11:43:21Z INFO  rust_wasm] Cat Fact: The way you treat a kitten in the early stages of its life will render its personality traits later in life.
```

Awesome. You have successfully created a Wasm workload using Rust and deployed it to a Kubernetes cluster without using containers.
If you'd like to take a look at this solution in full, check out the [GitHub repo](https://github.com/oktadev/okta-rust-webassembly-k8s-example).

# So, are we ready to replace containers with WebAssembly?

WebAssembly on Kubernetes is not yet production-ready as a lot of the supporting ecosystem is still experimental, and WASI itself is still maturing. [Networking is not yet stable](https://radu-matei.com/blog/towards-sockets-networking-wasi/) and the library ecosystem is only just coming along. Krustlet is also still in beta, and there is no straightforward way to run networking workloads, especially servers on it. [WasmEdge](https://wasmedge.org/) is a more mature alternative solution for networking workloads, but it's much more involved to set up and run than Krustlet on Kubernetes. [WasmCloud](https://wasmcloud.dev/) is another project to keep an eye on. So, for the time being, Krustlet is suitable for running workloads for jobs and use cases involving cluster monitoring and so on. These are areas where you could use the extra performance anyway.

So, while Wasm on Kubernetes is exciting, and containerless on Kubernetes is definitely on the horizon.  containerized applications are still the way to go for production use. This is especially true for networking workloads like microservices and web applications. But, given how fast the ecosystem is evolving, especially in the Rust + Wasm + WASI space, soon I expect we will be able to use Wasm workloads on Kubernetes for production.

# Learn more about Kubernetes and WebAssembly

If you want to learn more about Kubernetes and security in general, check out these additional resources.

- [How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC](/blog/2021/11/08/k8s-api-server-oidc)
- [How to Secure Your Kubernetes Clusters With Best Practices](/blog/2021/12/02/k8s-security-best-practices)
- [How to Build Securely with Blazor WebAssembly (WASM)](/blog/2020/09/30/blazor-webassembly-wasm-dotnetcore)
- [Securing a Cluster](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)
- [RBAC vs. ABAC: Definitions & When to Use](https://www.okta.com/identity-101/role-based-access-control-vs-attribute-based-access-control/)
- [Secure Access to AWS EKS Clusters for Admins](/blog/2021/10/08/secure-access-to-aws-eks)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
