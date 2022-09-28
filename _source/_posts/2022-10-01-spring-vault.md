---
layout: blog_post
title: "Secure Secrets With Spring Cloud Config and Vault"
author: jimena-garbarino
by: contractor
community: [java]
description: "Storing secrets in your code is a bad idea. Learn how to use Spring Cloud Config and HashiCorp Vault to make your app more secure."
tags: [spring-vault, oidc, java, spring, spring-boot, vault, hashicorp, spring-cloud-vault]
tweets:
- "Learn how to secure your secrets with @springcloud vault and @HashiCorp Vault!"
- "Securing your secrets is a must if you want to be secure by design. This tutorial shows you how!"
- "Please secure your secrets. Fight for your users!"
image: blog/spring-vault/spring-vault.png
github: https://github.com/oktadev/okta-spring-vault-example
type: conversion
---

In 2013, GitHub released a search feature that allows users to scan code all public repositories. A day after the release, however, they had to partially shut it down. It was speculated that the shutdown was because the feature allowed any user to search for all kinds of secrets stored in GitHub repositories. Later, in 2014, data on 50,000 Uber drivers was stolen. It seems someone got access to the company's database using login credentials found in a GitHub public repository. Hashicorp Vault, a tool for managing secrets and encrypting data in transit, was first announced in 2015 and Spring Vault, the integration of Spring with Vault was first released in 2017.

It seems like a long time ago, right? Secrets leakage seems to remain pervasive and constant, happening to all kinds of developers—as explained by [this study from NC State University](https://www.ndss-symposium.org/ndss-paper/how-bad-can-it-git-characterizing-secret-leakage-in-public-github-repositories/). Exposed secrets leads to cyber-attacks, data loss or corruption, sensitive data breaches, and crypto-jacking (cryptocurrency mining using a victim's cloud computer power). With tools like Hashicorp's Vault and Spring Cloud Vault, the risk can be reduced.

Nowadays it is widely recommended to never store secret values in code. Therefore, this tutorial will demonstrate the following alternatives:

- Using environment variables for Spring Boot secrets
- Secrets encryption with Spring Cloud Config
- Secrets management with HashiCorp's Vault
- Using Spring Cloud Vault

> **This tutorial was created with the following frameworks and tools**:
> - [JHipster 7.9.3](https://www.jhipster.tech/installation/)
> - [Java OpenJDK 17](https://jdk.java.net/java-se-ri/17)
> - [Okta CLI 0.10.0](https://cli.okta.com)
> - [Docker 20.10.12](https://docs.docker.com/engine/install/)
> - [HTTPie 3.2.1](https://httpie.io/docs/cli/installation)
> - [Vault 1.11.3](https://hub.docker.com/_/vault)

{% include toc.md %}

## Use Environment Variables for Secrets; a Precursor to Spring Vault

Spring Boot applications can bind property values from environment variables. To demonstrate, create a `vault-demo-app` with OpenID Connect (OIDC) authentication, using the Spring Initializr. Then add `web`, `okta`, and `cloud-config-client` dependencies, some of which will be required later in the tutorial:

```shell
https start.spring.io/starter.zip \
  bootVersion==2.7.4 \
  dependencies==web,okta,cloud-config-client \
  groupId==com.okta.developer \
  artifactId==vault-demo-app  \
  name=="Spring Boot Application" \
  description=="Demo project of a Spring Boot application with Vault protected secrets" \
  packageName==com.okta.developer.vault > vault-demo-app.zip
```

Unzip the file and open the project. Modify its `src/main/java/.../Application.java` class to add the `/` HTTP endpoint:

```java
package com.okta.developer.vault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @GetMapping("/")
    String hello(@AuthenticationPrincipal OidcUser user) {
        return String.format("Welcome, %s", user.getFullName());
    }

}
```

Disable the cloud configuration for the first run. Edit `application.properties` and add the following value:

```properties
spring.cloud.config.enabled=false
```

### OpenID Connect authentication with Okta

In a command line session, go to the `vault-demo-app` root folder.

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}

Instead of storing Okta credentials in `application.properties` as part of the project code, Spring Boot allows you to bind properties from environment variables. You can see this in action by starting your application with the Maven command below:

```shell
OKTA_OAUTH2_ISSUER={yourOktaIssuerURI} \
OKTA_OAUTH2_CLIENT_ID={yourOktaClientId} \
OKTA_OAUTH2_CLIENT_SECRET={yourOktaClientSecret} \
./mvnw spring-boot:run
```

**NOTE**: Copy the values of `yourOktaIssuerURI`, `yourOktaClientId` and `yourOktaClientSecret` as you will need them for configuration in the next sections. You can also just keep at hand `yourOktaClientId` and retrieve the configuration with `okta apps config --app {yourOktaClientId}`.

In an incognito window, go to `http://localhost:8080`. Here, you should see the Okta login page:

{% img blog/spring-vault-update/okta-login.png alt:"Okta login form" width:"400" %}{: .center-image }

In the application logs, you'll see the security filter chain initializes an OAuth 2.0 authentication flow:

<pre><code>
2022-09-07 08:50:09.460  INFO 20676 --- [           main] o.s.s.web.DefaultSecurityFilterChain     : Will secure any request with<br> [org.springframework.security.web.session.DisableEncodeUrlFilter@6b4a4e40,<br> org.springframework.security.web.context.request.async.WebAsyncManagerIntegrationFilter@46a8c2b4,<br> org.springframework.security.web.context.SecurityContextPersistenceFilter@640d604,<br> org.springframework.security.web.header.HeaderWriterFilter@7b96de8d,<br> org.springframework.security.web.csrf.CsrfFilter@2a0b901c,<br> org.springframework.security.web.authentication.logout.LogoutFilter@38ac8968,<br> org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter@7739aac4,<br> org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter@36c07c75,<br> org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter@353c6da1,<br> org.springframework.security.web.authentication.ui.DefaultLoginPageGeneratingFilter@7e61e25c,<br> org.springframework.security.web.authentication.ui.DefaultLogoutPageGeneratingFilter@4f664bee,<br> org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationFilter@21b51e59,<br> org.springframework.security.web.savedrequest.RequestCacheAwareFilter@5438fa43,<br> org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter@512abf25,<br> org.springframework.security.web.authentication.AnonymousAuthenticationFilter@76563ae7,<br> org.springframework.security.oauth2.client.web.OAuth2AuthorizationCodeGrantFilter@3e14d390,<br> org.springframework.security.web.session.SessionManagementFilter@4dc52559,<br> org.springframework.security.web.access.ExceptionTranslationFilter@51ac12ac,<br> org.springframework.security.web.access.intercept.FilterSecurityInterceptor@2407a36c]
</code></pre>

Using environment variables for passing secrets to containerized applications is now considered bad practice because the environment can be inspected or logged in a number of cases. So, let's move on to using Spring Cloud Config server for secrets storage.

### Use Auth0 for OpenID Connect

For using Auth0 as OIDC provider, you need to add the `spring-boot-starter-oauth2-client` dependency, as the Okta Spring Boot Starter [does not support Auth0](https://github.com/okta/okta-spring-boot/issues/358) yet.

You can create a demo application with Spring Initializr too:

```shell
https start.spring.io/starter.zip \
  bootVersion==2.7.4 \
  dependencies==web,oauth2-client,cloud-config-client \
  groupId==com.okta.developer \
  artifactId==vault-demo-app-auth0  \
  name=="Spring Boot Application" \
  description=="Demo project of a Spring Boot application with Vault protected secrets" \
  packageName==com.okta.developer.vault > vault-demo-app-auth0.zip
```

Modify the `Application` class the same way as described in the previous section. Also set `spring.cloud.config.enabled=false` in `application.properties`.

Sign up at [Auth0](https://auth0.com/signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then run:

```shell
auth0 login
```

The terminal will display a device confirmation code and open a browser session to activate the device.

**NOTE**: My browser was not displaying anything, so I had to manually activate the device by opening the URL https://auth0.auth0.com/activate?user_code={deviceCode}

On successful login, you will see the tenant, which you will use as issuer later:

```shell
✪ Welcome to the Auth0 CLI 🎊

If you don't have an account, please create one here: https://auth0.com/signup.

Your device confirmation code is: KGFL-LNVB

 ▸    Press Enter to open the browser to log in or ^C to quit...

Waiting for the login to complete in the browser... ⣻Opening in existing browser session.
Waiting for the login to complete in the browser... done

 ▸    Successfully logged in.
 ▸    Tenant: dev-avup2laz.us.auth0.com
```

The next step is to create a client app:

```shell
auth0 apps create
```

When prompted, choose the following options:

- Name: `vault-demo-app-auth0`
- Description: `<optional description>`
- Type: `Regular Web Application`
- Callback URLs: `http://localhost:8080/login/oauth2/code/auth0`
- Logout URLs: `http://localhost:8080`

Once the app is created, you will see the OIDC app's configuration:

```shell
Name: vault-demo-app-auth0
Description: Demo project of a Spring Boot application with Vault protected secrets
Type: Regular Web Application
Callback URLs: http://localhost:8080/login/oauth2/code/auth0
Allowed Logout URLs: http://localhost:8080

=== dev-avup2laz.us.auth0.com application created

 CLIENT ID            ****
 NAME                 vault-demo-app-auth0
 DESCRIPTION          Demo project of a Spring Boot application with Vault protected secrets
 TYPE                 Regular Web Application
 CALLBACKS            http://localhost:8080/login/oauth2/code/auth0
 ALLOWED LOGOUT URLS  http://localhost:8080
 ALLOWED ORIGINS
 ALLOWED WEB ORIGINS
 TOKEN ENDPOINT AUTH
 GRANTS               implicit, authorization_code, refresh_token, client_credentials

▸    Quickstarts: https://auth0.com/docs/quickstart/webapp
▸    Hint: Test this app's login box with 'auth0 test login ****'
▸    Hint: You might wanna try 'auth0 quickstarts download ****
```

**NOTE**: The client secret is [not displayed](https://github.com/auth0/auth0-cli/issues/488) in the CLI output for regular applications. You can run `auth0 apps open` to open a browser in the application configuration. Then copy the secret from the **Settings** tab. In the example above, the tenant is `dev-avup2laz.us.auth0.com`.

You can now run the demo app passing the oidc configuration through environment variables:

```shell
SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_AUTH0_ISSUER_URI=https://{auth0Tenant}/ \
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_ID={auth0clientId} \
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_CLIENT_SECRET={auth0clientSecret} \
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_AUTH0_SCOPE=openid,profile,email \
./mvnw spring-boot:run
```

**IMPORTANT NOTE**: You must leave the trailing slash `/` in the issuer URL.

Navigate to `http://localhost:8080`, and you should be redirected to Auth0 to log in:

{% img blog/spring-vault-update/auth0-login.png alt:"Auth0 login form" width:"450" %}{: .center-image }

If you choose **Continue with Google** you will see the consent screen:

{% img blog/spring-vault-update/auth0-consent.png alt:"Auth0 authorize form" width:"450" %}{: .center-image }


## Spring Cloud Config with Secrets Encryption

In microservice architectures, managing configuration with a centralized config server is essential. Secret encryption is desirable at rest and when in transit. Spring Cloud Config Server is a popular implementation. Let's configure the server to store encrypted secrets.

**NOTE:** To use encryption and decryption features in Java, you need the full-strength JCE installed in your JVM, which is included by default since JDK 9.

Using the Spring Initializr API, create a Vault + Config Server application:

```shell
https start.spring.io/starter.zip \
  bootVersion==2.7.4 \
  dependencies==cloud-config-server \
  groupId==com.okta.developer \
  artifactId==vault-config-server  \
  name=="Spring Boot Configuration Server" \
  description=="Demo project of a Spring Boot application with Vault protected secrets" \
  packageName==com.okta.developer.vault > vault-config-server.zip
```

Unzip the downloaded file. Rename `src/main/resource/application.properties` to `application.yml`, edit the file to specify the port, add a `native` profile, and specify config search locations:

```yaml
server:
  port: 8888

spring:
  profiles:
    active: native
```

Edit `src/main/java/.../SpringBootConfigurationServerApplication.java` and add a `@EnableConfigServer` annotation:

```java
package com.okta.developer.vault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@EnableConfigServer
@SpringBootApplication
public class SpringBootConfigurationServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringBootConfigurationServerApplication.class, args);
    }

}
```

Start the server, as you are going to encrypt your Okta secrets using the `/encrypt` endpoint. For this example, you are using a symmetric (shared) encryption key, passed through the environment variable ENCRYPT_KEY. Before running the command below, you should replace `{encryptKey}` with a random string of characters. You can use JShell to generate a UUID you can use for your encrypt key.

```shell
jshell

UUID.randomUUID()
```

```shell
ENCRYPT_KEY={encryptKey} ./mvnw spring-boot:run
```

Then, in another terminal, encrypt your client ID and secret.

```shell
http :8888/encrypt --raw {yourOktaClientId}
http :8888/encrypt --raw {yourOktaClientSecret}
```

In the `vault-config-server` project folder, create a `src/main/resources/config/vault-demo-app-dev.yml` file to store the secrets for the `dev` profile, with the following contents:

```yml
okta:
  oauth2:
    issuer: {yourIssuerURI}
    clientId: '{cipher}encryptedClientId'
    clientSecret: '{cipher}encryptedClientSecret'
```

The `client-id` and `client-secret` encrypted values must be prefixed with `{cipher}`. Restart the config server.

To consume the config server properties, the client application must set the server address in the application configuration. In the `vault-demo-app` project, rename `application.properties` to `application.yml` and replace its contents with the following configuration:

```yaml
spring:
  cloud:
    config:
      uri: http://localhost:8888
  config:
    import: "configserver:"
  application:
    name: vault-demo-app
  profiles:
    active: dev
```

Start `vault-demo-app` without passing the environment variables:

```shell
./mvnw clean spring-boot:run
```

When requesting `http://localhost:8080` it should again redirect to the Okta login.

In a real environment, the config server should be secured. Spring Cloud Config Server supports asymmetric key encryption as well, with the server encrypting with the public key, and the clients decrypting with the private key. However, the documentation warns about spreading the key management process around clients.

## Vault as a Configuration Backend with Spring Cloud Vault

{% img blog/spring-vault/vault-logo.png alt:"Vault logo" width:"300" %}{: .pull-right }

In the cloud, secrets management has become much more difficult. Vault is a secrets management and data protection tool from HashiCorp that provides secure storage, dynamic secret generation, data encryption, and secret revocation.

Vault encrypts the secrets prior to writing them to persistent storage. The encryption key is also stored in Vault, but encrypted with a _master key_ not stored anywhere. The master key is split into shards using [Shamir's Secret Sharing algorithm](https://www.vaultproject.io/docs/concepts/seal#shamir-seals), and distributed among a number of operators. The Vault unseal process allows you to reconstruct the master key by adding shards one at a time in any order until enough shards are present, then Vault becomes operative. Operations on secrets can be audited by enabling audit devices, which will send audit logs to a file, syslog or socket.

As Spring Cloud Config Server supports Vault as a configuration backend, the next step is to better protect the application secrets by storing them in Vault.

Pull the Vault Docker image and start a container using the command below. Make sure to replace `{hostPath}` with a local directory path, such as `/tmp/vault`.

```shell
docker pull vault
```

```shell
docker run --cap-add=IPC_LOCK \
-e 'VAULT_DEV_ROOT_TOKEN_ID=00000000-0000-0000-0000-000000000000' \
-p 8200:8200 \
-v {hostPath}:/vault/logs \
--name my-vault vault
```

**NOTE**:  The `docker run` command above will start a vault instance with the name `my-vault`. You can stop the container with `docker stop my-vault` and restart it with `docker start my-vault`. Note that all the secrets and data will be lost between restarts, as explained in the next paragraphs.

IPC_LOCK capability is required for Vault to be able to lock memory and not be swapped to disk, as this behavior is enabled by default. As the instance is run for development, the ID of the initially generated root token is set to the given value. We are mounting `/vault/logs`, as we are going to enable the `file` audit device to inspect the interactions.

Once it starts, you should notice the following logs:

```
WARNING! dev mode is enabled! In this mode, Vault runs entirely in-memory
and starts unsealed with a single unseal key. The root token is already
authenticated to the CLI, so you can immediately begin using Vault.

You may need to set the following environment variable:

    $ export VAULT_ADDR='http://0.0.0.0:8200'

The unseal key and root token are displayed below in case you want to
seal/unseal the Vault or re-authenticate.

Unseal Key: +xTAEzkjb3kurSBa7TxAQUjoyBpaprlXwn+ZnSpEkuw=
Root Token: 00000000-0000-0000-0000-000000000000

Development mode should NOT be used in production installations!
```

It is clear Vault is running in _dev mode_, meaning it short-circuits a lot of setup to insecure defaults, which helps for the experimentation. Data is stored encrypted in-memory and lost on every restart. Copy the _Unseal Key_, as we are going to use it to test Vault sealing.
Connect to the container and explore some `vault` commands:

```shell
docker exec -it my-vault /bin/sh
```

The command above will start a shell session with the container. After the prompt shows, run the following three commands:

```shell
export VAULT_TOKEN="00000000-0000-0000-0000-000000000000"
export VAULT_ADDR="http://127.0.0.1:8200"
vault status
```

The `status` command output shows if the vault instance is sealed:

```
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    1
Threshold       1
Version         1.11.3
Build Date      2022-08-26T10:27:10Z
Storage Type    inmem
Cluster Name    vault-cluster-389dcb61
Cluster ID      cc063fcf-e1f2-2e75-6059-cd9117559f0d
HA Enabled      false
```

As you can see, in development mode Vault starts unsealed, meaning stored data can be decrypted/accessed.

Enable a file audit device to watch the interactions with Vault:

```shell
vault audit enable file file_path=/vault/logs/vault_audit.log
```

You should see a success message. Now store the Okta secrets for the `vault-demo-app`:

```shell
vault kv put secret/vault-demo-app,dev \
okta.oauth2.clientId="{yourOktaClientId}" \
okta.oauth2.clientSecret="{yourOktaClientSecret}" \
okta.oauth2.issuer="{yourOktaIssuerURI}"
```
```shell
vault kv get secret/vault-demo-app,dev
```

As illustrated above, key-value pairs are stored with `kv put` command, and you can check the values with the `kv get` vault command.

Check `vault_audit.log` in your specified `{hostPath}` directory. Operations are logged in JSON format by default, with sensitive information hashed:

```json
{
   "time":"2022-09-09T22:09:14.886126069Z",
   "type":"request",
   "auth":{
      "client_token":"hmac-sha256:2d8d7aeded539495117218a14ef9ae9f0f525eb2f6078be25dfe8e329ceb3d3f",
      "accessor":"hmac-sha256:e4c3319a57b735e10df4677193bd7a969ee757a97ebf890bbaebb0694f6a6cd5",
      "display_name":"token",
      "policies":[
         "root"
      ],
      "token_policies":[
         "root"
      ],
      "policy_results":{
         "allowed":true,
         "granting_policies":[
            {
               "name":"root",
               "namespace_id":"root",
               "type":"acl"
            }
         ]
      },
      "token_type":"service",
      "token_issue_time":"2022-09-09T22:01:47Z"
   },
   "request":{
      "id":"50f70b23-3f2a-4857-5a8b-0c45982be491",
      "client_id":"0DHqvq2D77kL2/JTPSZkTMJbkFVmUu0TzMi0jiXcFy8=",
      "operation":"create",
      "mount_type":"kv",
      "mount_accessor":"kv_bf4b26f3",
      "client_token":"hmac-sha256:2d8d7aeded539495117218a14ef9ae9f0f525eb2f6078be25dfe8e329ceb3d3f",
      "client_token_accessor":"hmac-sha256:e4c3319a57b735e10df4677193bd7a969ee757a97ebf890bbaebb0694f6a6cd5",
      "namespace":{
         "id":"root"
      },
      "path":"secret/data/vault-demo-app,dev",
      "data":{
         "data":{
            "okta.oauth2.clientId":"hmac-sha256:6709ec7e5682f16893369660844392809842ee1d670697fb034c3db17cfdc3d4",
            "okta.oauth2.clientSecret":"hmac-sha256:c3db998af7b44aeaabf3da71c396e8bf86119fd6c36e66a41de67e91f71b116f",
            "okta.oauth2.issuer":"hmac-sha256:70502e5cd54d12004df6836d0ff8d045515e4207607d984da14c0aaca5400c0a"
         },
         "options":{

         }
      },
      "remote_address":"127.0.0.1",
      "remote_port":58914
   }
}
```

Let's assume you don't want to configure the root token in the `vault-demo-app`. You can instead create a policy granting read permissions on the path where the secrets were stored. Go to the Vault Web UI at `http://localhost:8200` and log in with the root token (`00000000-0000-0000-0000-000000000000`).

{% img blog/spring-vault-update/vault-web-ui.png alt:"Vault web UI" width:"650" %}{: .center-image }

Next, go to **Policies** and **Create ACL policy**. Create a `vault-demo-app-policy` with the following capabilities:

```json
path "secret/data/vault-demo-app" {
  capabilities = [ "read" ]
}

path "secret/data/vault-demo-app,dev" {
  capabilities = [ "read" ]
}

path "secret/data/application" {
  capabilities = [ "read" ]
}

path "secret/data/application,dev" {
  capabilities = [ "read" ]
}
```

All the paths above will be requested by the config server to provide configuration for the `vault-demo-app` when it starts with the `dev` profile active.

{% img blog/spring-vault-update/vault-policy.png alt:"Vault policy section" width:"800" %}{: .center-image }

Now, go back to the container command line, and create a token with the `vault-demo-app-policy`.

```shell
vault token create -policy=vault-demo-app-policy
```

```shell
WARNING! The following warnings were returned from Vault:

  * Endpoint ignored these unrecognized parameters: [display_name entity_alias
  explicit_max_ttl num_uses period policies renewable ttl type]

Key                  Value
---                  -----
token                hvs.CAESIKd9pYyc9xesiqmwvepdGiHlPEB53By...
token_accessor       2pzRXmGhxChobbMtqeM5zZzM
token_duration       768h
token_renewable      true
token_policies       ["default" "vault-demo-app-policy"]
identity_policies    []
policies             ["default" "vault-demo-app-policy"]
```

**NOTE**: I could not find documentation about the warning _Endpoint ignored these unrecognized parameters_. It seems `vault CLI` is sending default parameters not required by the target API in this case. The command equivalent API call can be displayed using the `-output-curl-string` flag after the subcommand, for example:

```shell
vault token create -output-curl-string -policy=vault-demo-app-policy
```
The output string will look like below:

```shell
curl -X POST -H "X-Vault-Token: $(vault print token)" -H "X-Vault-Request: true" -d '{"policies":["vault-demo-app-policy"],"ttl":"0s","explicit_max_ttl":"0s","period":"0s","display_name":"","num_uses":0,"renewable":true,"type":"service","entity_alias":""}' http://127.0.0.1:8200/v1/auth/token/create
```

You are now ready to update the config server. In the `vault-config-server` project, edit `src/main/resource/application.yml` to add Vault as the config backend:

```yml
server:
  port: 8888

spring:
  profiles:
    active: vault
  cloud:
    config:
      server:
        vault:
          host: 127.0.0.1
          port: 8200
          kvVersion: 2
logging:
  level:
    org.springframework.web.client: TRACE
```

Note that the logging level is set to TRACE for the web client, to see the interaction between the server and Vault. Restart the `vault-config-server`.

```shell
./mvnw spring-boot:run
```

You should see the logs below if the server was configured correctly:

```
2022-09-23 01:19:10.105  INFO 14072 --- [main] SpringBootConfigurationServerApplication:
 Started SpringBootConfigurationServerApplication in 4.525 seconds (JVM running for 4.859)
```

You will not see the config server trying to connect to Vault in the logs. That will happen when a config client requests the properties. Start the `vault-demo-app`, passing the token just created in the environment variable `SPRING_CLOUD_CONFIG_TOKEN`. For example:

```shell
SPRING_CLOUD_CONFIG_TOKEN=hvs.CAESIKd9pYyc9xesiqmwvep... \
./mvnw spring-boot:run
```

When the `vault-demo-app` starts, it will request the configuration to the config server, which in turn will make REST requests to Vault. In the config server logs, with enough logging level, you will be able to see those requests:

```shell
2022-09-28 17:21:25.096 DEBUG 6685 --- [nio-8888-exec-1] o.s.web.client.RestTemplate              : HTTP GET http://127.0.0.1:8200/v1/secret/data/vault-demo-app,dev
2022-09-28 17:21:25.142 DEBUG 6685 --- [nio-8888-exec-1] o.s.web.client.RestTemplate              : Accept=[application/json, application/*+json]
2022-09-28 17:21:25.183 DEBUG 6685 --- [nio-8888-exec-1] o.s.web.client.RestTemplate              : Response 200 OK
```

Go to `http://localhost:8080` and verify that authentication with Okta works.

Finally, let's seal Vault. Sealing allows you to lock Vault data to minimize damages when an intrusion is detected.  In the container command line, enter:

```shell
vault operator seal
```

Restart `vault-demo-app` and verify the configuration will not be retrieved as Vault is sealed. The `vault-config-server` logs should read:

```
503 Service Unavailable: "{"errors":["Vault is sealed"]}<EOL>"]
```

To unseal Vault, run:

```shell
vault operator unseal {unsealKey}
```

## Learn More About Encryption and Storing Secrets

Hopefully you see the benefits of using a secrets management tool like Vault as a configuration backend, as opposed to storing secrets in a file, on a file system, or in a code repository. To learn more about Vault and Spring Cloud, check out the following links:

* [How Bad Can It Git?](https://www.ndss-symposium.org/ndss-paper/how-bad-can-it-git-characterizing-secret-leakage-in-public-github-repositories/)
* [Spring Cloud Config - Vault Backend](https://cloud.spring.io/spring-cloud-config/reference/html/#vault-backend)
* [Container Secrets with Vault](https://www.hashicorp.com/resources/securing-container-secrets-vault)
* [Amazon Engineer Leaked Private Encryption Keys](https://gizmodo.com/amazon-engineer-leaked-private-encryption-keys-outside-1841160934)

We have several related posts about encryption and storing secrets on this blog.

* [Five Anti-Patterns with Secrets in Java](/blog/2021/12/14/antipatterns-secrets-java)
* [Security Patterns for Microservice Architectures](/blog/2020/03/23/microservice-security-patterns)
* [How to Secure Your Kubernetes Clusters With Best Practices](/blog/2021/12/02/k8s-security-best-practices)

You can find the code for this tutorial on GitHub in the [@oktadev/okta-spring-vault-example](https://github.com/oktadev/okta-spring-vault-example) repository.

For more tutorials like this one, follow [@oktadev](https://twitter.com/oktadev) on Twitter. We also have a [YouTube channel](https://youtube.com/c/oktadev) you might like. If you have any questions, please leave a comment below!
