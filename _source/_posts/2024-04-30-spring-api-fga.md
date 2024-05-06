---
layout: blog_post
title: "Adding Fine-Grained Authorization (FGA) to a Spring Boot API with OpenFGA"
author: jimena-garbarino
by: contractor
communities: [security,java]
description: "How to add Fine-Grained Authorization (FGA) to a Spring Boot API using the OpenFGA Spring Boot starter"
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---

- INTRO

This guide will teach you how to secure a Spring document API with Okta and integrate Fine-Grained Authorization (FGA) to the document operations.

> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 21](https://jdk.java.net/java-se-ri/21)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)
> - [Docker 24.0.7](https://docs.docker.com/desktop/)
> - [OpenFGA Server 1.5.1](https://hub.docker.com/r/openfga/openfga)
> - [FGA CLI v0.2.7](https://openfga.dev/docs/getting-started/cli)

{% include toc.md %}

## Add security with Auth0 and Okta Spring Boot starter

- ADD OKTA SPRING BOOT STARTER
- AUTH0 CONFIGURATION
- AUTH0 TEST TOKEN
- CURL TESTS

Start by doing a checkout of the document API repository, which already implements basic request handling:

```shell
git clone https://github.com/indiepopart/spring-api-fga.git
```

The repository contains two project folders, `start` and `final`. The bare bones document API is a Gradle project in the `start` folder, open it with your favorite IDE.

Sign up at [Auth0](https://auth0.com/signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then in the command line run:

```shell
auth0 login
```

The command output will display a device confirmation code and open a browser session to activate the device.

You don't need to create a client application at Auth0 for your API if not using opaque tokens. But you must register the API within your tenant, you can do it using Auth0 CLI:

```shell
auth0 apis create \
  --name "Document API" \
  --identifier https://document-api.okta.com \
  --offline-access=false
```

Leave scopes empty. Add the `okta-spring-boot-starter` dependency:

```groovy
// build.gradle
dependencies {
    ...
    implementation 'com.okta.spring:okta-spring-boot-starter:3.0.6'
    ...
}
```
As the `document-api` must be configured as an OAuth2 resource server, add the following properties:

```yml
# application.yml
okta:
  oauth2:
    issuer: https://<your-auth0-domain>/
    audience: https://document-api.okta.com
```

You can find your Auth0 domain with the following Auth0 CLI command:

```shell
auth0 tenants list
```

Run the API with:

```shell
./gradlew bootRun
```

Test the API authorization with curl:

```shell
curl -i localhost:8080/file
```
You will get HTTP response code `401` because the request requires bearer authentication. Using Auth0 CLI, get an access token:

```shell
auth0 test token -a https://document-api.okta.com -s openid
```
Select any available client when prompted. You also will be prompted to open a browser window and log in with a user credential. You can sign up as a new user using an email and password or using the Google social login.

With curl, send a request to the API server using a bearer access token:

```shell
ACCESS_TOKEN=<auth0-access-token>
```

```shell
curl -i --header "Authorization: Bearer $ACCESS_TOKEN" localhost:8080/file
```

You should get a JSON response listing the menu items:

```json
[
   {
      "id":1,
      "parentId":null,
      "ownerId":"test-user",
      "name":"planning-v0",
      "description":"Planning doc",
      "createdTime":"2024-05-03T11:48:35.617694826",
      "modifiedTime":"2024-05-03T11:48:35.617694826",
      "quotaBytesUsed":null,
      "version":null,
      "originalFilename":null,
      "fileExtension":".doc"
   },
   {
      "id":2,
      "parentId":null,
      "ownerId":"test-user",
      "name":"image-1",
      "description":"Some image",
      "createdTime":"2024-05-03T11:48:35.617694826",
      "modifiedTime":"2024-05-03T11:48:35.617694826",
      "quotaBytesUsed":null,
      "version":null,
      "originalFilename":null,
      "fileExtension":".jpg"
   },
   {
      "id":3,
      "parentId":null,
      "ownerId":"test-user",
      "name":"meeting-notes",
      "description":"Some text file",
      "createdTime":"2024-05-03T11:48:35.617694826",
      "modifiedTime":"2024-05-03T11:48:35.617694826",
      "quotaBytesUsed":null,
      "version":null,
      "originalFilename":null,
      "fileExtension":".txt"
   }
]
```

## Design an authorization model

- MODEL DESCRIPTION
- MODEL CONVERSION FROM DSL TO JSON

## Add fine-grained authorization (FGA) with OpenFGA

- ADD OPENFGA SPRING BOOT STARTER
- OPENFGA SERVER INITIALIZER
- SERVICE LAYER
- INTEGRATION TESTING WITH TESTCONTAINERS

Now let's integrate fine-grained authorization into the application. OpenFGA team has just released the OpenFGA Spring Boot Starter 0.0.1, and you can add it to your project with the following dependency:

```groovy
implementation 'dev.openfga:openfga-spring-boot-starter:0.0.1'
```

The OpenFGA Spring Boot Starter dependency provides the auto-configuration of an FGA client and FGA bean that exposes a check method for authorizing operations. Before adding method security, let's add the changes required for creating the owner tuple when the document is created. Create an `AuthorizationService` in the package `com.example.demo.service`:

```java
package com.example.demo.service;

import com.example.demo.model.Document;
import dev.openfga.sdk.api.client.OpenFgaClient;
import dev.openfga.sdk.api.client.model.ClientTupleKey;
import dev.openfga.sdk.api.client.model.ClientWriteResponse;
import dev.openfga.sdk.errors.FgaInvalidParameterException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class AuthorizationService {

    private OpenFgaClient fgaClient;

    public AuthorizationService(OpenFgaClient fgaClient) {
        this.fgaClient = fgaClient;
    }

    public void create(Document file){
        try {
          ClientTupleKey tuple = new ClientTupleKey()
                  .user("user:" + file.getOwnerId())
                  .relation("owner")
                  ._object("document:" + file.getId());
          ClientWriteResponse response = fgaClient.writeTuples(List.of(tuple)).get();

        } catch (FgaInvalidParameterException | InterruptedException | ExecutionException e) {
            throw new AuthorizationServiceException(e);
        }

    }
}
```

```java
package com.example.demo.service;

public class AuthorizationServiceException extends RuntimeException {
    public AuthorizationServiceException(Exception e) {
        super(e);
    }
}
```

Then update the `DocumentService` for the required [dual write](https://developers.redhat.com/articles/2023/01/11/fine-grained-authorization-quarkus-microservices#challenges_of_implementing_a_zanzibar_fine_grained_permission_model) (database and OpenFGA server) when creating a `Document`:

```java
package com.example.demo.service;

import com.example.demo.model.Document;
import com.example.demo.model.DocumentRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DocumentService {

    private DocumentRepository documentRepository;

    private AuthorizationService authorizationService;

    public DocumentService(DocumentRepository documentRepository, AuthorizationService authorizationService) {
        this.documentRepository = documentRepository;
        this.authorizationService = authorizationService;
    }

    @Transactional
    public Document save(Document file) {
        try {
            Document result = documentRepository.save(file);
            authorizationService.create(result);
            return result;
        } catch(Exception e){
            throw new DocumentServiceException("Unexpected error", e);
        }
    }
}
```

With the approach above, the `Document` will not be saved if the permission tuple cannot be created, and this prevents having an entity without permission.

Next, you need to add method security enforcing the permissions policy. With `@PreAuthorize` and `@fga.check` you can express the permissions required for each operation. For example, the `save` operation can be guarded as follows:

```java
@PreAuthorize("#document.parentId == null or @fga.check('document', #document.parentId, 'writer', 'user')")
public Document save(@P("document") Document file)
```

The expression will produce a call to OpenFGA that will check if the authenticated user is a writer of the parent document, if the parent is defined. Assuming the parent is a folder, the document can be created in the folder if the user is a writer (has write permission) in that folder. The complete method security can be expressed as follows:

```java
package com.example.demo.service;

import com.example.demo.model.Document;
import com.example.demo.model.DocumentRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DocumentService {

    private DocumentRepository documentRepository;

    private AuthorizationService authorizationService;

    public DocumentService(DocumentRepository documentRepository, AuthorizationService authorizationService) {
        this.documentRepository = documentRepository;
        this.authorizationService = authorizationService;
    }
    @Transactional
    @PreAuthorize("#document.parentId == null or @fga.check('document', #document.parentId, 'writer', 'user')")
    public Document save(@P("document") Document file) {
        try {
            Document result = documentRepository.save(file);
            authorizationService.create(result);
            return result;
        } catch(Exception e){
            throw new DocumentServiceException("Unexpected error", e);
        }
    }

    @PreAuthorize("@fga.check('document', #id, 'viewer', 'user')")
    public Optional<Document> findById(@P("id") Long id) {
        return documentRepository.findById(id);
    }

    @PreAuthorize("@fga.check('document', #id, 'owner', 'user')")
    public void deleteById(@P("id") Long id) {
        documentRepository.deleteById(id);
    }

    @PreAuthorize("@fga.check('document', #document.id, 'writer', 'user')")
    public Document update(@P("document") Document document){
        return documentRepository.save(document);
    }

    public List<Document> findAll() {
        return documentRepository.findAll();
    }
}
```

> **NOTE**: In this guide, OpenFGA tuples are not deleted when the document is deleted

In the previous section you created an authorization model and converted it to JSON format. This will allow to initialize the OpenFGA server in development with that model. Add the utility component `OpenFGAUtil` in the `com.example.demo.initializer` package:

```java
package com.example.demo.initializer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.openfga.sdk.api.model.AuthorizationModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.Charset;

@Component
public class OpenFGAUtil {

    private static Logger logger = LoggerFactory.getLogger(OpenFGAUtil.class);

    private ResourceLoader resourceLoader;

    private ObjectMapper objectMapper;

    public OpenFGAUtil(ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
    }

    public AuthorizationModel convertJsonToAuthorizationModel(String path){
        try {
            Resource resource = resourceLoader.getResource(path);
            String json = StreamUtils.copyToString(resource.getInputStream(), Charset.defaultCharset());
            logger.debug(json);
            AuthorizationModel authorizationModel = objectMapper.readValue(json, AuthorizationModel.class);
            logger.debug(authorizationModel.toString());
            return authorizationModel;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
```

The class `OpenFGAUtil` encapsulates the task of loading the JSON model into a domain `AuthorizationModel` object for building the authorization model request.


```java
package com.example.demo.initializer;

import dev.openfga.sdk.api.client.OpenFgaClient;
import dev.openfga.sdk.api.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutionException;

@Component
@ConditionalOnProperty(prefix = "openfga", name = "initialize", havingValue = "true")
public class OpenFGAInitializer implements CommandLineRunner {

    private Logger logger = LoggerFactory.getLogger(OpenFGAInitializer.class);

    private OpenFgaClient fgaClient;

    private OpenFGAUtil openFgaUtil;


    public OpenFGAInitializer(OpenFgaClient fgaClient, OpenFGAUtil openFgaUtil) {
        this.fgaClient = fgaClient;
        this.openFgaUtil = openFgaUtil;
    }

    @Override
    public void run(String... args) throws Exception {
        CreateStoreRequest storeRequest = new CreateStoreRequest().name("test");
        try {
            CreateStoreResponse storeResponse = fgaClient.createStore(storeRequest).get();
            logger.info("Created store: {}", storeResponse);
            fgaClient.setStoreId(storeResponse.getId());

            WriteAuthorizationModelRequest modelRequest = new WriteAuthorizationModelRequest();
            AuthorizationModel model = openFgaUtil.convertJsonToAuthorizationModel("classpath:fga/auth-model.json");
            modelRequest.setTypeDefinitions(model.getTypeDefinitions());
            modelRequest.setConditions(model.getConditions());
            modelRequest.setSchemaVersion(model.getSchemaVersion());
            WriteAuthorizationModelResponse modelResponse = fgaClient.writeAuthorizationModel(modelRequest).get();
            logger.info("Created model: {}", modelResponse);
            fgaClient.setAuthorizationModelId(modelResponse.getAuthorizationModelId());

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error writing to FGA", e);
        }
    }
}
```

Before running the API, add some integration tests for verifying the method security. Add the following `Testcontainers` dependencies:

```groovy
testImplementation "org.testcontainers:testcontainers:1.19.7"
testImplementation "org.testcontainers:openfga:1.19.7"
testImplementation "org.testcontainers:junit-jupiter:1.19.7"
```

Then create the `DocumentIntegrationTest` class with the following code:

```java
package com.example.demo;

import com.example.demo.model.Document;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.openfga.OpenFGAContainer;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Testcontainers
public class DocumentIntegrationTest {

    @Container
    static OpenFGAContainer openfga = new OpenFGAContainer("openfga/openfga:v1.4.3");
    @Autowired
    private WebApplicationContext applicationContext;
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void registerOpenFGAProperties(DynamicPropertyRegistry registry) {
        registry.add("openfga.api-url", () -> "http://localhost:" + openfga.getMappedPort(8080));
    }

    @BeforeEach
    public void init() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .apply(springSecurity()).build();
    }

    @Test
    @WithMockUser(username = "test-user")
    public void testCreateFileIsFobidden() throws Exception {

        Document document = new Document();
        document.setParentId(1L);
        document.setName("test-file");
        document.setDescription("test-description");

        mockMvc.perform(post("/file").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(document)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test-user")
    public void testCreateFile() throws Exception {

        Document document = new Document();
        document.setName("test-file");
        document.setDescription("test-description");

        MvcResult mvcResult = mockMvc.perform(post("/file")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(document)))
                .andExpect(status().isOk()).andExpect(jsonPath("$").exists())
                .andExpect(jsonPath("$.name").value("test-file"))
                .andExpect(jsonPath("$.description").value("test-description"))
                .andReturn();

        Document result = objectMapper.readValue(mvcResult.getResponse().getContentAsString(), Document.class);

        mockMvc.perform(get("/file/{id}", result.getId())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").exists())
                .andExpect(jsonPath("$.name").value("test-file"))
                .andExpect(jsonPath("$.description").value("test-description"));
    }

    @Test
    @WithMockUser(username = "test-user")
    public void testDeleteFile_NotOwned_AccessDenied() throws Exception {
        Document document = new Document();
        document.setName("test-file");
        document.setDescription("test-description");

        MvcResult mvcResult = mockMvc.perform(post("/file")
                        .with(csrf())
                        .with(user("owner-user"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(document)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").exists())
                .andExpect(jsonPath("$.name").value("test-file"))
                .andExpect(jsonPath("$.description").value("test-description"))
                .andReturn();

        Document result = objectMapper.readValue(mvcResult.getResponse().getContentAsString(), Document.class);

        mockMvc.perform(delete("/file/{id}", result.getId()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

    }
}
```

Update `application.yml` and add the following properties:

```yaml
openfga:
  api-url: http://localhost:8090
  store-id: 01AAAAAAAAAAAAAAAAAAAAAAAA
  authorization-model-id: 01AAAAAAAAAAAAAAAAAAAAAAAA
  initialize: true
```

Don't worry about the dummy `store-id` and `authorization-model-id`, in development the initializer will create the store and authorization model and set them as default for the FGA operations.

Run the test with:

```shell
./gradlew test --tests com.example.demo.DocumentIntegrationTest
```

## Running the Spring Boot API

- DOCKER COMPOSE FOR OPENFGA
- AUTH0 TEST TOKEN
- CURL TESTS
- SHARE DOCUMENT

Taking advantage of Spring Boot Docker, create a `compose.yml` file at the root of the project, to start an OpenFGA server when the application runs:

```yaml
services:
  openfga:
    image: openfga/openfga:latest
    container_name: openfga
    command: run
    environment:
      - OPENFGA_DATASTORE_ENGINE=memory
      - OPENFGA_PLAYGROUND_ENABLED=true
    networks:
      - default
    ports:
      - "8090:8080" #http
      - "3000:3000" #playground
    healthcheck:
      test: ["CMD", "/usr/local/bin/grpc_health_probe", "-addr=openfga:8081"]
      interval: 5s
      timeout: 30s
      retries: 3
```

Notice the HTTP API port is mapped to host port `8090`. Run the application with:

```shell
./gradlew bootRun
```

You should see in the application logs messages when the OpenFGA container is starting:
```
[Document API] [           main] .s.b.d.c.l.DockerComposeLifecycleManager : Using Docker Compose file '.../compose.yml'
[Document API] [utReader-stderr] o.s.boot.docker.compose.core.DockerCli   :  Container openfga  Recreate
[Document API] [utReader-stderr] o.s.boot.docker.compose.core.DockerCli   :  Container openfga  Recreated
[Document API] [utReader-stderr] o.s.boot.docker.compose.core.DockerCli   :  Container openfga  Starting
[Document API] [utReader-stderr] o.s.boot.docker.compose.core.DockerCli   :  Container openfga  Started
[Document API] [utReader-stderr] o.s.boot.docker.compose.core.DockerCli   :  Container openfga  Waiting
[Document API] [utReader-stderr] o.s.boot.docker.compose.core.DockerCli   :  Container openfga  Healthy
```

Create a new test token with Auth0 CLI:

```shell
auth0 test token -a https://document-api.okta.com -s openid
```

With curl, send a request to the API server using a bearer access token:

```shell
TOM_ACCESS_TOKEN=<auth0-access-token>
```

```shell
curl -i -X POST \
  -H "Authorization:Bearer $TOM_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "planning.doc"}' \
  http://localhost:8080/file
```

Verify the API does not authorize creating a document with a parent not owned:

```shell
curl -i -X POST \
  -H "Authorization:Bearer $TOM_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "planning.doc", "parentId": 6}' \
  http://localhost:8080/file
```

The API will reject with HTTP 403:

```
HTTP/1.1 403
...
Access is denied%                      
```

Also, you can remove auth0.com cookie, and create an access token for a different user, an attempt to get a document not owned with:

```shell
curl -i -H "Authorization:Bearer $ANA_ACCESS_TOKEN" http://localhost:8080/file/4
```

Let's make Tom share the document with Ana, with edit permission:



## Learn more about fine-grained authorization with OpenFGA and Spring Boot

- RECAP CLOSING

In this post you learned about OpenFGA integration to a Spring Boot API using the OpenFGA Spring Boot Starter 0.0.1, just released. I hope you find this introduction useful, and could grasp the basics of fine-grained authorization through OpenFGA system, and the benefits of moving authorization logic outside application code. You can find the code shown in this tutorial on [GitHub](https://github.com/oktadev/spring-api-fga). If you'd rather skip the step-by-step and prefer running a sample application, follow the [README](https://github.com/oktadev/spring-api-fga) instructions in the same repository.

If you liked this post, you might enjoy these related posts:

- [Deploy Secure Spring Boot Microservices on Amazon EKS Using Terraform and Kubernetes](https://auth0.com/blog/terraform-eks-java-microservices/)
- [Get started with Spring Boot and Auth0](https://auth0.com/blog/get-started-with-okta-spring-boot-starter/)
- [Build a Beautiful CRUD App with Spring Boot and Angular](https://auth0.com/blog/spring-boot-angular-crud/)
- [Get Started with Jetty, Java, and OAuth](https://auth0.com/blog/java-jetty-oauth/)

Check out the Spring Boot resources in our Developer Center:

- [Authorization in Spring Boot](https://developer.auth0.com/resources/labs/authorization/spring-resource-server)
- [Authentication in Spring Boot](https://developer.auth0.com/resources/labs/authentication/spring)
- [Role Based Access Control in Spring Boot](https://developer.auth0.com/resources/labs/authorization/rbac-in-spring-boot)
- [Build and Secure Spring Boot Microservices](https://developer.auth0.com/resources/labs/authorization/securing-spring-boot-microservices)
- [Spring MVC Code Sample: Basic Authentication](https://developer.auth0.com/resources/code-samples/web-app/spring/basic-authentication)

Please follow us on Twitter [@oktadev](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more Spring Boot and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
