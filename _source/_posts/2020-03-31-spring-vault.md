---
layout: blog_post
title: "Secure Secrets With Spring Cloud Config and Vault"
author: jimena-garbarino
description: ""
tags: [sping vault, oidc, java, spring, spring boot, vault, hashicorp]
tweets:
- ""
- ""
- ""
image:
---

In 2013 Github released a search functionality, allowing to scan code in all public repositories, and a day after the release they had to partially shut it down. It was speculated that the shutdown was because the feature allowed any user to search for all kinds of secrets stored in Github repositories. Later, in 2014, data on 50,000 Uber drivers was stolen. It seems someone got access to the company's database using login credentials found in a Github public repository.

Seems long ago? Secrets leakage seems to remain pervasive and constant, and happens to all kinds of developers, as explained by the study of NC State University. And it can lead to cyber-attacks, data loss or corruption, sensitive data breaches and cryptojacking (cryptocurrency mining using victim's cloud computer power). This year, 2020, an Amazon engineer also leaked customer secrets through a public Github repository. Some of the uploaded documents contained access keys for cloud services. Although the data had been committed inadvertently, the leaked credentials were retrieved by a third party within the half-hour.

Nowadays it is widely recommended to never store secret values in code. Therefore, this tutorial will demonstrate the following alternatives:
- Using environment variables for Spring Boot secrets
- Secrets encryption and Cloud Config
- Secrets management and Vault
- Using Spring Cloud Config with Vault


## Using Environment Variables for Secrets

Spring Boot applications can bind properties from environment variables. Let's create a `vault-demo-app` with Okta OpenID Connect authentication, using the Spring Initializr. We are adding web, okta and cloud-config-client dependencies, some of which will be required later in the tutorial:

```shell
curl https://start.spring.io/starter.zip \
  -d dependencies=web,okta,cloud-config-client \
  -d groupId=com.okta.developer \
  -d artifactId=vault-demo-app  \
  -d name="Spring Boot Application" \
  -d description="Demo project of a Spring Boot application with Vault protected secrets" \
  -d packageName=com.okta.developer.vault \
  -o vault-demo-app.zip
```

Unzip the file and open the project. Modify the `Application` class to add the rest endpoint `/`:
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

For the Okta authentication set up, register for a [free developer account](https://developer.okta.com/signup/). After the login, go to the **Dashboard** section and copy your Org URL from the top right corner.
Then go to **Applications** and create a new **Web** application.
Set the following configuration:

- Name: vault-demo-app
- Base URIs: http://localhost:8080/
- Login redirect URIs: http://localhost:8080/login/oauth2/code/oidc
- Logout redirect URIs: http://localhost:8080
- Grant type allowed: Authorization Code, Refresh Token

Copy the **Client ID** and **Client secret**.
Instead of storing Okta credentials in `application.properties`, with Spring Boot you can bind properties from environment variables. For a dev test, start the application with the maven command below:

```shell
SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI={yourOrgUrl} \
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID={youtClientId} \
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET={yourClientSecret} \
./mvnw spring-boot:run
```


Go to http://localhost:8080, you should see th Okta login page:


{% img blog/spring-vault/okta-login.png alt:"Okta login form" width:"503" %}{: .center-image }


In the application logs, you should see the security filter chain should initialize an OAuth2 authentication stack:
```
2020-04-07 00:19:45.952  INFO 12058 --- [           main] o.s.s.web.DefaultSecurityFilterChain     : Creating filter chain: any request, [org.springframework.security.web.context.request.async.WebAsyncManagerIntegrationFilter@5c080ef3, org.springframework.security.web.context.SecurityContextPersistenceFilter@6ecdbab8, org.springframework.security.web.header.HeaderWriterFilter@5a2fa51f, org.springframework.security.web.csrf.CsrfFilter@2016f509, org.springframework.security.web.authentication.logout.LogoutFilter@23a5818e, org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter@14823f76, org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter@7b6e5c12, org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter@7979b8b7, org.springframework.security.web.authentication.ui.DefaultLoginPageGeneratingFilter@17d32e9b, org.springframework.security.web.authentication.ui.DefaultLogoutPageGeneratingFilter@188cbcde, org.springframework.security.web.savedrequest.RequestCacheAwareFilter@19f7222e, org.springframework.security.web.servletapi.SecurityContextHolderAwareRequestFilter@5ba26eb0, org.springframework.security.web.authentication.AnonymousAuthenticationFilter@4ee6291f, org.springframework.security.oauth2.client.web.OAuth2AuthorizationCodeGrantFilter@2def7a7a, org.springframework.security.web.session.SessionManagementFilter@22a0d4ea, org.springframework.security.web.access.ExceptionTranslationFilter@73d4066e, org.springframework.security.web.access.intercept.FilterSecurityInterceptor@7342e05d]

```

Using environment variables for passing secrets to containerized applications seems to be now considered a bad practice, because the environment can be inspected or logged in a number of cases. So let's move on to using Spring Cloud Config server for secrets storage.

## Spring Cloud Config with Secrets Encryption

In microservice architectures, managing configuration with a centralized config server is essential. Secret encryption is desirable at rest and when in transit. Spring Cloud Config Server is a popular implementation, let's configure the server to store encrypted secrets.

**IMPORTANT:** To use encryption and decryption features you must install the Java Cryptography Extension (JCE) in yout JVM, whis is not included by default.


Using Spring Initializr API, create the vault-config-server application:

```shell
curl https://start.spring.io/starter.zip \
  -d dependencies=cloud-config-server \
  -d groupId=com.okta.developer \
  -d artifactId=vault-config-server  \
  -d name="Spring Boot Configuration Server" \
  -d description="Demo project of a Spring Boot application with Vault protected secrets" \
  -d packageName=com.okta.developer.vault \
  -o vault-config-server.zip
```

Unzip the downloaded file. Rename `src/main/resource/application.properties` to `src/main/resource/application.yml`, end edit to add the native profile :

```yml
server:
  port: 8888

spring:
  profiles:
    active: native
  cloud:
    config:
      server:
        native:
          serachLocations: classpath://config
```

Edit `SpringBootConfigurationServerApplication` and add `@EnableConfigServer` annotation:

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


Start the server, as we are going to encrypt the Okta secrets using the `/encrypt` endpoint. For this example we are using a symmetric (shared) encryption key, passed through the environment variable ENCRYPT_KEY.

```shell
ENCRYPT_KEY={encryptKey} ./mvnw spring-boot:run
```
```shell
curl localhost:8888/encrypt -d {yourOktaClientId}
curl localhost:8888/encrypt -d {yourOktaClientSecret}
```

In the server project folder, create the file `src/main/resources/config/vault-demo-app-dev.yml` to store the secrets for `vault-demo-app`, for the profile `dev`, with the following contents:

```yml
spring:
  security:
    oauth2:
      client:
        provider:
          oidc:
            issuer-uri: {yourOrgUrl}
        registration:
          oidc:
            client-id: '{cipher}encryptedClientId'
            client-secret: '{cipher}ecryptedClientSecret'
```

The `client-id` and `client-secret` encrypted values must be prefixed with `{cipher}`. Restart the config server.

To consume the config server properties, the client application must set the server address in the bootstrap properties. In the `vault-demo-app` project folder, create the file `src/main/resources/bootstrap.yml` with the following content:

```yml
spring:
  application:
    name: vault-demo-app
  cloud:
    config:
      uri: http://localhost:8888
  profiles:
    active: dev
```

Start `vault-demo-app` without passing the environment variables:
```shell
./mvnw spring-boot:run
```
When requesting http://localhost:8080 it should again redirect to the Okta login.

In a real environment, the config server will be secured. Spring Cloud Config Server supports asymmetric key encryption as well, with the server encrypting with the public key, and the clients decrypting with the private key. However, the documentation warns about spreading the key management process around clients.

## Vault as a Cloud Configuration Backend

{% img blog/spring-vault/vault-logo.png alt:"Vault logo" width:"678" %}{: .center-image }


With the cloud, secrets management became much more difficult. Vault is a secrets management and data protection tool from Hashicorp, that provides secure storage, dynamic secret generation, data encryption and secret revocation. Vault encrypts the secrets prior to writing them to persistent storage. The encryption key is also stored in Vault, but encrypted with a _master key_ not stored anywhere. The master key is split into shards using _Shamir's Secret Sharing_ algorithm, and distributed among a number of operators. The Vault unseal process allows to reconstruct the master key by adding shards one at a time in any order until enough shards are present, then Vault becomes operative.
Operations on secrets can be audited by enabling audit devices, which will send audit logs to a file, syslog or socket.

As Spring Cloud Configuration Server supports Vault as a configuration backend, the next step is to better protect the application secrets by storing them in Vault.

Pull the Vault docker image and start a container:

```shell
docker pull vault
docker run --cap-add=IPC_LOCK \
-e 'VAULT_DEV_ROOT_TOKEN_ID=00000000-0000-0000-0000-000000000000' \
-p 8200:8200 \
-v {hostPath}:/vault/logs \
--name my-vault vault
```

IPC_LOCK capability is required for Vault to be able lock memory and not be swapped to disk, as this behavior is enabled by default. As the instance is run for development, the id of the initial generated root token is set to the given value. We are mounting `/vault/logs`, as we are going to enable the `file` audit device to inspect the interactions.

Once it starts, you should notice the following logs:
```
...

WARNING! dev mode is enabled! In this mode, Vault runs entirely in-memory
and starts unsealed with a single unseal key. The root token is already
authenticated to the CLI, so you can immediately begin using Vault.

...

The unseal key and root token are displayed below in case you want to
seal/unseal the Vault or re-authenticate.

Unseal Key: wD2mT9W56zGWrG9PYajIA47spzSLEkIMYQX7Ocio1VQ=
Root Token: 00000000-0000-0000-0000-000000000000

Development mode should NOT be used in production installations!

==> Vault server started! Log data will stream in below:
```
It is clear Vault is running in _dev mode_, meaning it short-circuits a lot of setup to insecure defaults, which helps for the experimentation. Data is stored encrypted in-memory and lost on every restart. Copy the _Unseal Key_ as we are going to use it to test Vault sealing.
Connect to the container and explore some vault commands:

```shell
docker exec -it my-vault /bin/sh
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
Version         1.3.3
Cluster Name    vault-cluster-a80e6cd6
Cluster ID      769bfd8c-7c9e-5ef2-a2bd-667ae19b4180
HA Enabled      false
```
As you can see, in development mode, Vault starts unsealed, meaning stored data can be decrypted/accessed.
Enable a file audit device to watch the interactions with Vault:

```shell
vault audit enable file file_path=/vault/logs/vault_audit.log
```
Now store the Okta secrets for the `vault-demo-app`:

```shell
vault kv put secret/vault-demo-app,dev \
spring.security.oauth2.client.registration.oidc.client-id="{yourClientID}" \
spring.security.oauth2.client.registration.oidc.client-secret="{yourClientSecret}" \
spring.security.oauth2.client.provider.oidc.issuer-uri="{yourOrgUrl}"
vault kv get secret/vault-demo-app,dev
```
As illustrated above, you store key-value pairs with **kv put** command, and you can check the values with the **kv get** vault command.
Check vault_audit.log, operations are logged in JSON format by default, with sensitive information hashed:
```json
{
   "time":"2020-04-09T23:08:49.528995105Z",
   "type":"response",
   "auth":{...},
   "request":{
      "id":"1cc73d31-d678-88d4-0b8e-f16b3d961791",
      "operation":"read",
      "client_token":"...",
      "client_token_accessor":"...",
      "namespace":{
         "id":"root"
      },
      "path":"secret/data/vault-demo-app,dev",
      "remote_address":"127.0.0.1"
   },
   "response":{
      "data":{
         "data":{
            "spring.security.oauth2.client.provider.oidc.issuer-uri":"hmac-sha256:d44ecf9418576aba39752cf34a253bdf960a5ac475bd5eece78a776555035e1a",
            "spring.security.oauth2.client.registration.oidc.client-id":"hmac-sha256:d35fa23d933b5402a8c665ce4d73643506c7d13743e922e397a3cf78acde6c88",
            "spring.security.oauth2.client.registration.oidc.client-secret":"hmac-sha256:d6c38a298b067ac8ce76c427bd060fdda8558a024ebb1a60beb9cde60d9e5db8"
         },
         "metadata":{
            "created_time":"hmac-sha256:b5283ce3fbb0bb7a74c91e2e565e08d44d378d2e37946b1fa871e0c23947a6c1",
            "deletion_time":"hmac-sha256:81566d1c06213e53b6f7cf141388772d1ab59efcc4cfa9373c32098d90bda09a",
            "destroyed":false,
            "version":1
         }
      }
   }
}
```

Let's assume we don't want to configure the root token in the `vault-demo-app`. Then, create a policy granting read permissions on the path where the secrets were stored. Meet the Vault Web UI at http://localhost:8200, login with the root token.

{% img blog/spring-vault/vault-web-ui.png alt:"Vault web UI" width:"1523" %}{: .center-image }


Then go to **Policies**, and **Create ACL policy** on the top right. Create the _vault-demo-app-policy_ with the following capabilities:

```
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
All the paths above will be requested by the config server to provide configuration for the `vault-demo-app`, when it starts with the dev profile active.


{% img blog/spring-vault/vault-policy.png alt:"Vault policy section" width:"1515" %}{: .center-image }

Now, go back to the container command line, and create a token with the vault-demo-app-policy.
```shell
vault token create -policy=vault-demo-app-policy
```
```
Key                  Value
---                  -----
token                s.4CO6wzq0M1WRUNsYviJB3wzz
token_accessor       2lYfyQJZtGPO4gyxsLmOnQyE
token_duration       768h
token_renewable      true
token_policies       ["default" "vault-demo-app-policy"]
identity_policies    []
policies             ["default" "vault-demo-app-policy"]
```

And we are ready to update the config server. In the `vault-config-server` project, edit `src/main/resource/application.yml` to add Vault as the config backend:

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
    root: TRACE          
```

We also set the logging level to TRACE, to see the interaction between the server and Vault. Restart the `vault-config-server`.

```shell
cd vault-config-server
./mvnw spring-boot:run
```
You should see the logs below if the server was configured correctly:
```
2020-04-07 01:19:10.105  INFO 14072 --- [           main] SpringBootConfigurationServerApplication : Started SpringBootConfigurationServerApplication in 4.525 seconds (JVM running for 4.859)
```


Start the `vault-demo-app` passing the token just created in the environment variable `SPRING_CLOUD_CONFIG_TOKEN`:

```shell
SPRING_CLOUD_CONFIG_TOKEN=s.4CO6wzq0M1WRUNsYviJB3wzz \
./mvnw spring-boot:run
```


When the `vault-demo-app` starts, it will request the configuration to the config server, which in turn will make a REST to Vault. In the config server logs, with enough logging level, you will be able to see:

```
2020-04-19 20:19:02.691 DEBUG 21168 --- [nio-8888-exec-1] o.s.web.client.RestTemplate              : HTTP GET http://127.0.0.1:8200/v1/secret/data/vault-demo-app,dev
```

Go to http://localhost:8080 and verify the Okta works.

Finally, let's seal Vault. In the container command line, do:

```shell
vault operator seal
```

Restart `vault-demo-app` and verify the configuration will not be retrieved as Vault is sealed. In the `vault-config-server` logs you should read:

```
 503 Service Unavailable: [{"errors":["error performing token check: Vault is sealed"]}
```
To unseal Vault, do:
```shell
vault operator unseal {unsealKey}
```

## Learn More

I hope you could see the benefits of using a secrets management tool like Vault as a configuration backend, as opposed to storing secrets in a file, in a file system or in a code repository. To learn more about Okta, Vault and Spring Cloud check out the following links:

* [How Bad Can It Git?](https://www.ndss-symposium.org/wp-content/uploads/2019/02/ndss2019_04B-3_Meli_paper.pdf)
* [Spring Cloud Config - Vault Backend](https://cloud.spring.io/spring-cloud-config/reference/html/#vault-backend)
* [Container Secrets with Vault](https://www.hashicorp.com/resources/securing-container-secrets-vault)
* [Amazon Engineer Leaked Private Encryption Keys](https://gizmodo.com/amazon-engineer-leaked-private-encryption-keys-outside-1841160934)

You can find the tutorial code at [Github](https://github.com/indiepopart/spring-vault)
