---
layout: blog_post
title: "How to build an API with Spring for GraphQL"
author: jimena-garbarino
by: contractor
communities: [security,java,javascript]
description: "A step by step guide for building a secured GraphQL API with Spring Boot and Auth0 authentication on React"
tags: [java, javascript]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

- introduction

Following this step by step guide you can build a GraphQL API for querying a sample dataset of related companies, persons and properties, seeded to a Neo4j database.

> **This tutorial was created with the following frameworks and tools**:
> - [Node.js v18.16.1](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
> - [npm 9.5.1](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
> - [Java OpenJDK 17](https://jdk.java.net/java-se-ri/17)
> - [Docker 24.0.2](https://docs.docker.com/desktop/)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.0.0](https://github.com/auth0/auth0-cli#installation)

{% include toc.md %}


## Build a GraphQL API with Spring for GraphQL

Create the application with Spring Initializr and HTTPie:

```shell
https start.spring.io/starter.zip \
  bootVersion==3.1.2 \
  language==java \
  packaging==jar \
  javaVersion==17 \
  type==gradle-project \
  dependencies==okta,data-neo4j,graphql,web \
  groupId==com.okta.developer \
  artifactId==spring-graphql  \
  name=="Spring Boot GraphQL API Application" \
  description=="Demo project of a Spring Boot GraphQL API" \
  packageName==com.okta.developer.demo > spring-graphql-api.zip
```

Unzip the file and start editing the project.

- create the grahpql api

Define the GraphQL api with a schema file, under `src/main/resources/graphql/schema.graphqls` with the following content:

```text
type Query {
    companyById(id: ID): Company
    companyList(page: Int): [Company!]!
    companyCount: Int
}


type Company {
    id: ID
    SIC: String
    category: String
    companyNumber: String
    countryOfOrigin: String
    incorporationDate: String
    mortgagesOutstanding: Int
    name: String
    status: String
    controlledBy: [Person!]!
    owns: [Property!]!
}

type Person {
    id: ID
    birthMonth: String
    birthYear: String
    nationality: String
    name: String
    countryOfResidence: String
}

type Property {
    id: ID
    address: String
    county: String
    district: String
    titleNumber: String
}
```

As you can see the schema is defining the object types `Company`, `Person` and `Property` and the query types `companyById`, `companyList` and `companyCount`.

Start adding classes for the domain. Create the package `com.okta.developer.demo.domain` under `src/main/java`. Add the classes `Person`, `Property` and `Company`.

```java
package com.okta.developer.demo.domain;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node
public class Person {

    @Id @GeneratedValue
    private Long id;

    private String birthMonth;
    private String birthYear;
    private String countryOfResidence;

    private String name;
    private String nationality;

    public Person(String birthMonth, String birthYear, String countryOfResidence, String name, String nationality) {
        this.id = null;
        this.birthMonth = birthMonth;
        this.birthYear = birthYear;
        this.countryOfResidence = countryOfResidence;
        this.name = name;
        this.nationality = nationality;
    }

    public Person withId(Long id) {
        if (this.id.equals(id)) {
            return this;
        } else {
            Person newObject = new Person(this.birthMonth, this.birthYear, this.countryOfResidence, this.name, this.nationality);
            newObject.id = id;
            return newObject;
        }
    }
    public String getBirthMonth() {
        return birthMonth;
    }

    public void setBirthMonth(String birthMonth) {
        this.birthMonth = birthMonth;
    }

    public String getBirthYear() {
        return birthYear;
    }

    public void setBirthYear(String birthYear) {
        this.birthYear = birthYear;
    }

    public String getCountryOfResidence() {
        return countryOfResidence;
    }

    public void setCountryOfResidence(String countryOfResidence) {
        this.countryOfResidence = countryOfResidence;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public Long getId() {
        return this.id;
    }
}
```

```java
package com.okta.developer.demo.domain;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node
public class Property {

    @Id
    @GeneratedValue  private Long id;
    private String address;
    private String county;
    private String district;
    private String titleNumber;

    public Property(String address, String county, String district, String titleNumber) {
        this.id = null;
        this.address = address;
        this.county = county;
        this.district = district;
        this.titleNumber = titleNumber;
    }

    public Property withId(Long id) {
        if (this.id.equals(id)) {
            return this;
        } else {
            Property newObject = new Property(this.address, this.county, this.district, this.titleNumber);
            newObject.id = id;
            return newObject;
        }
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCounty() {
        return county;
    }

    public void setCounty(String county) {
        this.county = county;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getTitleNumber() {
        return titleNumber;
    }

    public void setTitleNumber(String titleNumber) {
        this.titleNumber = titleNumber;
    }
}
```


```java
package com.okta.developer.demo.domain;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Node
public class Company {
    @Id
    @GeneratedValue
    private Long id;
    private String SIC;
    private String category;
    private String companyNumber;
    private String countryOfOrigin;
    private LocalDate incorporationDate;
    private Integer mortgagesOutstanding;
    private String name;
    private String status;

    // Mapped automatically
    private List<Property> owns = new ArrayList<>();

    @Relationship(type = "HAS_CONTROL", direction = Relationship.Direction.INCOMING)
    private List<Person> controlledBy = new ArrayList<>();


    public Company(String SIC, String category, String companyNumber, String countryOfOrigin, LocalDate incorporationDate, Integer mortgagesOutstanding, String name, String status) {
        this.id = null;
        this.SIC = SIC;
        this.category = category;
        this.companyNumber = companyNumber;
        this.countryOfOrigin = countryOfOrigin;
        this.incorporationDate = incorporationDate;
        this.mortgagesOutstanding = mortgagesOutstanding;
        this.name = name;
        this.status = status;
    }

    public Company withId(Long id) {
        if (this.id.equals(id)) {
            return this;
        } else {
            Company newObject = new Company(this.SIC, this.category, this.companyNumber, this.countryOfOrigin, this.incorporationDate, this.mortgagesOutstanding, this.name, this.status);
            newObject.id = id;
            return newObject;
        }
    }

    public String getSIC() {
        return SIC;
    }

    public void setSIC(String SIC) {
        this.SIC = SIC;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCompanyNumber() {
        return companyNumber;
    }

    public void setCompanyNumber(String companyNumber) {
        this.companyNumber = companyNumber;
    }

    public String getCountryOfOrigin() {
        return countryOfOrigin;
    }

    public void setCountryOfOrigin(String countryOfOrigin) {
        this.countryOfOrigin = countryOfOrigin;
    }

    public LocalDate getIncorporationDate() {
        return incorporationDate;
    }

    public void setIncorporationDate(LocalDate incorporationDate) {
        this.incorporationDate = incorporationDate;
    }

    public Integer getMortgagesOutstanding() {
        return mortgagesOutstanding;
    }

    public void setMortgagesOutstanding(Integer mortgagesOutstanding) {
        this.mortgagesOutstanding = mortgagesOutstanding;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

}

```
Create the package `com.okta.developer.demo.repository` and the class `CompanyRepository`:

```java
package com.okta.developer.demo.repository;


import com.okta.developer.demo.domain.Company;
import org.springframework.data.neo4j.repository.ReactiveNeo4jRepository;

public interface CompanyRepository extends ReactiveNeo4jRepository<Company, Long> {

}
```


Create the package `com.okta.developer.demo.controller` and the class `CompanyController` implementing the query endpoints matching the queries defined in the graphql schema:

```java
package com.okta.developer.demo.controller;

import com.okta.developer.demo.domain.Company;
import com.okta.developer.demo.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Controller
public class CompanyController {

    @Autowired
    private CompanyRepository companyRepository;

    @QueryMapping
    public Mono<Company> companyById(@Argument Long id) {
        return companyRepository.findById(id);
    }


    @QueryMapping
    public Flux<Company> companyList(@Argument Long page) {
        return companyRepository.findAll().skip((page - 1) * 10).take(10);
    }

    @QueryMapping
    public Mono<Long> companyCount() {
        return companyRepository.count();
    }

}
```

Create a the `CompanyControllerTests` class for the web layer in the folder `src/main/test/java` under the package `com.okta.developer.demo.controller`:

```java
package com.okta.developer.demo.controller;

import com.okta.developer.demo.domain.Company;
import com.okta.developer.demo.repository.CompanyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.GraphQlTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.graphql.test.tester.GraphQlTester;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

import static org.mockito.Mockito.when;

@GraphQlTest(CompanyController.class)
public class CompanyControllerTests {

    @Autowired
    private GraphQlTester graphQlTester;

    @MockBean
    private CompanyRepository companyRepository;

    @Test
    void shouldGetCompany() {


        when(this.companyRepository.findById(123L))
                .thenReturn(Mono.just(new Company(
                        "1234",
                        "private",
                        "12345678",
                        "UK",
                        LocalDate.of(2020, 1, 1),
                        0,
                        "Test Company",
                        "active")));

        this.graphQlTester
                .documentName("companyDetails")
                .variable("id", "123")
                .execute()
                .path("companyById")
                .matchesJson("""
                    {
                        "id": null,
                        "SIC": "1234",
                        "name": "Test Company",
                        "status": "active",
                        "category": "private",
                        "companyNumber": "12345678",
                        "countryOfOrigin": "UK",
                        "incorporationDate": "2020-01-01",
                        "mortgagesOutstanding": 0                       
                    }
                """);
    }
}
```

Create the document file `companyDetails.graphql` containing the query definition for the test, in the folder `src/main/test/resources/graphql-test`:

```text
query companyById($id: ID) {
    companyById(id: $id) {
        id
        SIC
        name
        status
        category
        companyNumber
        countryOfOrigin
        incorporationDate
        mortgagesOutstanding
    }
 }
```

Run the test with:

```shell
./gradlew test
```




- create the migration

Let's add Neo4j migrations dependency for the seed data insertion. Edit the file `build.gradle` and add:

```text
dependencies {
  ...
  implementation 'eu.michael-simons.neo4j:neo4j-migrations-spring-boot-starter:2.4.0'
}
```


Download the seed files from the following locations:
- [CompanyDataAmericans](https://guides.neo4j.com/ukcompanies/data/CompanyDataAmericans.csv)
- [LandOwnershipAmericans](https://guides.neo4j.com/ukcompanies/data/LandOwnershipAmericans.csv)
- [PSCAmericans.csv](https://guides.neo4j.com/ukcompanies/data/PSCAmericans.csv)


Add the folder `src/main/docker` and create a file `neo4j.yml` with the following content:

```yml
# This configuration is intended for development purpose, it's **your** responsibility to harden it for production
name: companies
services:
  neo4j:
    image: neo4j:5
    volumes:
      - <csv-folder>:/var/lib/neo4j/import
    environment:
      - NEO4J_AUTH=neo4j/verysecret
      - NEO4JLABS_PLUGINS=["apoc"]
    # If you want to expose these ports outside your dev PC,
    # remove the "127.0.0.1:" prefix
    ports:
      - '127.0.0.1:7474:7474'
      - '127.0.0.1:7687:7687'
    healthcheck:
      test: ['CMD', 'wget', 'http://localhost:7474/', '-O', '-']
      interval: 5s
      timeout: 5s
      retries: 10
```
As you can see the compose file will mount `<csv-folder>` to a `/var/lib/neo4j/import` volume, making the content accessible from the running ne44j container.
Replace `<csv-folder>` with the path to the downloaded CSVs.

- graphiql


### Add resource server security

## Build a React client


### Add Auth0 Login

## Learn More
