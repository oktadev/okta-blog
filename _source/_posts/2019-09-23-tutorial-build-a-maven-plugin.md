---
disqus_thread_id: 7645873028
discourse_topic_id: 17142
discourse_comment_url: https://devforum.okta.com/t/17142
layout: blog_post
title: How to Build a Maven Plugin
description: 'Tutorial: How to build a Maven plugin.'
tags: [tutorial, maven, java, builds]
author: brian-demers
by: advocate
communities: [java]
tweets:
- "Learn how to build an @ASFMavenProject plugin" 
- "Maven plugins are built with Maven plugins 🐢🐢🐢"
- "Build a simple @ASFMavenProject plugin that will run `git rev-parse`"
image: blog/tutorial-build-a-maven-plugin/console-usage-example.png
type: awareness
---

Apache Maven is still the most popular build tool in the Java space, thanks to the popularity of its ecosystem of plugins. It's easy to find an existing plugin to do almost anything your application needs, from ensuring your source files have license headers, to validating binary compatibility between versions. Occasionally though, you need to write a custom plugin to fulfill a requirement in your product.

In this tutorial, I'm going to show you how to build a simple Maven Plugin that resolves a project's current Git hash, i.e. `git rev-parse --short HEAD`.

Before you get started, make sure to install [Java 8](https://adoptopenjdk.net/) and [Apache Maven](https://maven.apache.org/).  I use [SDKMAN](https://sdkman.io/) to install them both.

If you'd rather watch a video, [I created a screencast of this blog post](https://youtu.be/wHX4j0z-sUU).

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/wHX4j0z-sUU" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Create a new Maven project

It shouldn't be a surprise that I'm going to use Maven to build a new Maven plugin.  You can use your favorite IDE to create a new project, but to keep things simple, I'm just going to create a new `pom.xml` file manually (in a new directory named `example-maven-plugin`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.okta.example</groupId>
    <artifactId>example-maven-plugin</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>maven-plugin</packaging>

    <name>Example Maven Plugin</name>
    <description>An Example Maven Plugin</description>

    <properties>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    </properties>
```

This is as simple as it gets, I've defined the Maven GAV (**G**roup ID, **A**rtifact ID, **V**ersion), a name, and most importantly I've set the `packaging` to `maven-plugin`.  While the group ID could be just about anything, is strongly recommended to be in reverse domain name notation, similar to [Java packages](https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html).

## Add Maven Dependencies

Next up I need to define a few dependencies on `maven-core`, `maven-plugin-api`, and `maven-plugin-annotations`.  These are all scoped as `provided` which means when the plugin runs, the actual version used will depend on the version of Apache Maven you have installed.

```xml
    <dependencies>
        <dependency>
            <!-- plugin interfaces and base classes -->
            <groupId>org.apache.maven</groupId>
            <artifactId>maven-plugin-api</artifactId>
            <version>3.6.0</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <!-- needed when injecting the Maven Project into a plugin  -->
            <groupId>org.apache.maven</groupId>
            <artifactId>maven-core</artifactId>
            <version>3.6.0</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <!-- annotations used to describe the plugin meta-data -->
            <groupId>org.apache.maven.plugin-tools</groupId>
            <artifactId>maven-plugin-annotations</artifactId>
            <version>3.5</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
```

## Plugins build Plugins

Plugins are what actually give Maven its power, at its core Maven is just a plugin framework, so naturally, I will use a Maven plugin to build a Maven plugin with the [Maven Plugin Plugin](https://maven.apache.org/plugin-tools/maven-plugin-plugin/). Turtles all the way down!

{% img blog/tutorial-build-a-maven-plugin/turtles.png alt:"Turtle on turtle on turtle" width:"600" %}{: .center-image }

The `maven-plugin-plugin` is actually defined automatically because I used the packaging type of `maven-plugin` above, to use a newer version I can update the plugin in the `pluginManagment` section:

```xml
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-plugin-plugin</artifactId>
                    <version>3.6.0</version>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-site-plugin</artifactId>
                    <version>3.8.2</version>
                </plugin>
            </plugins>
        </pluginManagement>
</project>
```

I've also included the Maven Site Plugin, this is optional, more on that later in the post.

That is it! If you want to copy and paste the whole file all at once, you can grab it from [GitHub](https://github.com/oktadeveloper/example-maven-plugin/blob/simple-plugin/pom.xml).

## Write the Maven Plugin Code

On to the fun part, writing the code!  A Maven plugin is actually a collection of one or more "goals".  Each goal is defined by a Java class referred to as a "Mojo" (**M**aven plain **O**ld **J**ava **O**bject).

Create a new class: `src/main/java/com/okta/example/maven/GitVersionMojo.java`

```java
package com.okta.example.maven;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.project.MavenProject;

/**
 * An example Maven Mojo that resolves the current project's git revision and adds 
 * that a new {@code exampleVersion} property to the current Maven project.
 */
@Mojo(name = "version", defaultPhase = LifecyclePhase.INITIALIZE)
public class GitVersionMojo extends AbstractMojo {

    public void execute() throws MojoExecutionException, MojoFailureException {
        // The logic of our plugin will go here
    }
}
```

There isn't much to it, now I have a new Maven Plugin, which has a single goal named `version`.  This goal will execute when the project is initialized. There are a few lifecycles to pick from, for this example, I'm using "initialize" because I want my plugin to run before other plugins.  If you were creating a plugin to create new files, you would likely want to use the "generate-resources" phase. Take a look at the [lifecycle reference documentation](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html#Lifecycle_Reference) for descriptions of other phases.

At this point, I could build the project with `mvn install` and then execute the plugin using:

```bash
# mvn ${groupId}:${artifactId}:${goal}
mvn com.okta.example:example-maven-plugin:version
```

However, since the `execute` method is empty, it won't actually do anything yet.

## Adding Maven Parameters

To make this plugin actually do something, I'm going to add a couple of parameters.  Maven parameters are defined as fields in the MOJO class:

```java
/**
 * The git command used to retrieve the current commit hash.
 */
@Parameter(property = "git.command", defaultValue = "git rev-parse --short HEAD")
private String command;

@Parameter(property = "project", readonly = true)
private MavenProject project;
```

It's worth noting the Javadoc is important for Maven Plugins, as it will be used when we generate the plugin-specific documentation. Since we are all great developers, we never forget to add the doc, right?

The `Parameter` annotation tells Maven to inject a value into the field.  This is similar to Spring's `Value` annotation. For the `command` field, I've set `property` value to be `git.command`. This allows the user to change the value on the command line with the standard `-D` notation:

```bash
mvn com.okta.example:example-maven-plugin:version \
    -Dgit.command="git rev-parse --short=4 HEAD"
```

It's also common to inject the `MavenProject` in order to read or modify something in the project directly. For example, the `MavenProject` gives you access to the dependencies and anything defined in a `pom.xml`. In my case, I'm going to add an additional property that can be used later in the build.

## Execute a Command in Java

Now we have the `command` parameter, we need to execute it!  Define a new `getVersion` method to handle this logic:

```java
public String getVersion(String command) throws MojoExecutionException {
    try {
        StringBuilder builder = new StringBuilder();

        Process process = Runtime.getRuntime().exec(command);
        Executors.newSingleThreadExecutor().submit(() ->
            new BufferedReader(new InputStreamReader(process.getInputStream()))
                .lines().forEach(builder::append)
        );
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new MojoExecutionException("Execution of command '" + command 
                + "' failed with exit code: " + exitCode);
        }

        // return the output
        return builder.toString();

    } catch (IOException | InterruptedException e) {
        throw new MojoExecutionException("Execution of command '" + command 
            + "' failed", e);
    }
}
``` 

This uses Java's built-in [`Runtime.exec()`](https://docs.oracle.com/javase/8/docs/api/java/lang/Runtime.html) and captures the output text.  Any exceptions are rethrown as a `MojoExecutionException` (which will cause a build failure.)

Next update the `execute()` method:

```java
public void execute() throws MojoExecutionException, MojoFailureException {

    // call the getVersion method
    String version = getVersion(command);

    // define a new property in the Maven Project
    project.getProperties().put("exampleVersion", version);

    // Maven Plugins have built in logging too
    getLog().info("Git hash: " + version);
}
```

That is it, now we just need to use the plugin!


## Usage of a Maven Plugin

Up until now, I've been executing the plugin directly using the command:
 
```bash
mvn com.okta.example:example-maven-plugin:version
```  

Usually, plugins are added to a `pom.xml` so they are run automatically as part of a build. To demonstrate this, I'll create a new Maven project with the following `pom.xml` (in a different directory):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.okta.example</groupId>
    <artifactId>example-usage</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <build>
        <plugins>
            <plugin>
                <groupId>com.okta.example</groupId>
                <artifactId>example-maven-plugin</artifactId>
                <version>1.0-SNAPSHOT</version>
                <configuration>
                    <!-- optional, the command parameter can be changed here too -->
                    <command>git rev-parse --short=4 HEAD</command>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>version</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <plugin>
                <groupId>com.github.ekryd.echo-maven-plugin</groupId>
                <artifactId>echo-maven-plugin</artifactId>
                <version>1.2.0</version>
                <inherited>false</inherited>
                <executions>
                    <execution>
                        <id>end</id>
                        <goals>
                            <goal>echo</goal>
                        </goals>
                        <phase>process-resources</phase>
                        <configuration>
                            <message>${line.separator}${line.separator}
                                The project version is ${project.version}-${exampleVersion}
                                ${line.separator}
                            </message>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

Running `mvn package` on this project result gives the output:

{% img blog/tutorial-build-a-maven-plugin/console-usage-example.png alt:"Console screenshot of plugin output" width:"800" %}{: .center-image }

The `[INFO] Git hash: 1ab3` line shows my plugin as it executes, and the new `exampleVersion` property defined by the plugin is used by the `echo-maven-plugin`

> **NOTE:** Once you have added a plugin to a `pom.xml` you can use the shorthand notation to execute the plugin: `mvn <prefix>:<goal>`, commonly the "prefix" is the [artifact ID minus the "-maven-plugin"](https://maven.apache.org/guides/introduction/introduction-to-plugin-prefix-mapping.html#Specifying_a_Plugin.27s_Prefix). For example `mvn example:version`.

##  Dependency Injection in Maven Plugins

Our plugin is great and all, but all of the code is crammed in one file.  I like to break up my code into easily testable chunks.  Enter [Sisu](https://www.eclipse.org/sisu/), the container Maven is built on. Sisu is an IoC container built on top of [Guice](https://github.com/google/guice), an alternative to Spring.  

What this all really means is that I can use the standard JSR-330 (`@Inject`) annotations to break up my code and not worry about the details of the IoC container!

Create a new interface in `src/main/java/com/okta/example/maven/VersionProvider.java`:

```java
package com.okta.example.maven;

import org.apache.maven.plugin.MojoExecutionException;

public interface VersionProvider {
    String getVersion(String command) throws MojoExecutionException;
}
```

And move the `Runtime.exec` logic out of `GitVersionMojo` into a new class `src/main/java/com/okta/example/maven/RuntimeExecVersionProvider.java`:

```java
package com.okta.example.maven;

import org.apache.maven.plugin.MojoExecutionException;

import javax.inject.Named;
import javax.inject.Singleton;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.Executors;

@Named
@Singleton
public class RuntimeExecVersionProvider implements VersionProvider {
    @Override
    public String getVersion(String command) throws MojoExecutionException {
        try {
            StringBuilder builder = new StringBuilder();

            Process process = Runtime.getRuntime().exec(command);
            Executors.newSingleThreadExecutor().submit(() ->
                new BufferedReader(new InputStreamReader(process.getInputStream())).lines().forEach(builder::append)
            );
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new MojoExecutionException("Execution of command '" + command + "' failed with exit code: " + exitCode);
            }

            // return the output
            return builder.toString();

        } catch (IOException | InterruptedException e) {
            throw new MojoExecutionException("Execution of command '" + command + "' failed", e);
        }
    }
}
```

I've added the standard Java `@Named` and `@Singleton` annotations to mark the class as a singleton that is managed by the IoC container.  This is the equivalent of using Spring's `@Component`.

Now just update the `GitVersionMojo` to inject the `VersionProvider`:

```java
@Inject
private VersionProvider versionProvider;

public void execute() throws MojoExecutionException, MojoFailureException {
    String version = versionProvider.getVersion(command);
    project.getProperties().put("exampleVersion", version);
    getLog().info("Git hash: " + version);
}
```

That is it! You could build and run the plugin as before, and get the same results.

## One More Thing, Documentation!

One of my favorite things about Maven is that plugins have consistent documentation structures.  To generate the documentation, add a new `reporting` section to the `pom.xml`:

```xml
<reporting>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-plugin-plugin</artifactId>
            <reportSets>
                <reportSet>
                    <reports>
                        <report>report</report>
                    </reports>
                </reportSet>
            </reportSets>
        </plugin>
    </plugins>
</reporting>
```

You should also add more metadata to your project, but this is optional. For example, I'll add the organization and prerequisites, as these are included in the generated site:

```xml
<organization>
    <name>Example, Inc</name>
    <url>https://google.com/search?q=example.com</url>
</organization>
<prerequisites>
    <maven>3.5.0</maven>
</prerequisites>
```

Now just run `mvn site` to generate the documentation! Open the `target/site/plugin-info.html` in your browser.  See why all of that Javadoc was so important?

{% img blog/tutorial-build-a-maven-plugin/plugin-doc-site.png alt:"Generated plugin documentation" width:"800" %}{: .center-image }

## Find out more

As always, you can find the full source code for this tutorial on [GitHub](https://github.com/oktadeveloper/example-maven-plugin). To learn more about building plugins, the [Apache Maven](https://maven.apache.org/) project has great documentation. Check out these other tutorials as well:

- [Get started with Okta in seconds with the Okta Maven plugin](https://github.com/oktadeveloper/okta-maven-plugin)
- [A Quick Guide to Spring Boot Login Options](/blog/2019/05/15/spring-boot-login-options)
- [Make Java Tests Groovy With Hamcrest](/blog/2019/08/21/make-java-tests-groovy)
- [License Maven Plugin](http://mycila.mathieu.photography/license-maven-plugin/)
- [japicmp - a Maven plugin for binary, source, and semver validation](https://github.com/siom79/japicmp)

If you liked this tutorial, follow us on Twitter [@oktadev](https://twitter.com/oktadev). We also publish weekly video tutorials to our [YouTube channel](https://youtube.com/c/oktadev).

