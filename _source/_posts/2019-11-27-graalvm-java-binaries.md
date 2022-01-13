---
disqus_thread_id: 7735347182
discourse_topic_id: 17176
discourse_comment_url: https://devforum.okta.com/t/17176
layout: blog_post
title: "Watch GraalVM Turn Your Java Into Binaries"
author: brian-demers
by: advocate
communities: [java]
description: "Tutorial: Learn how to build native binaries from a Java application with GraalVM's native-image tool."
tags: [java, graalvm, cli, tutorial]
tweets:
- "Wish your Java application would run as a native binary? Learn how with @GraalVM‼️"
- "Build a native command-line application with @Java and @GraalVM 🔥"
- "☕ @Java + @GraalVM == native binaries ❤️"
image: blog/graalvm-java-binaries/native-image-header.png
type: awareness
---

There has been much buzz about GraalVM and what it means for the Java world. GraalVM is a Java distribution from Oracle that adds a bunch of features, most notably a new JIT compiler, polyglot capabilities, an LLVM runtime... and the ability to turn your Java application into a native binary.

This last one offers the potential to distribute Java applications as a single binary, and a few frameworks like Quarkus, Helidon, and Micronaut already take advantage of this feature. Native images also open up the possibility to distribute Java applications as CLI applications, which has recently been the near-exclusive domain of Go and Node. This tutorial will show you how!

{% img blog/graalvm-java-binaries/native-image-header.png alt:"GraalVM Native Images with dice" width:"600" %}{: .center-image }

## Turn Your Java Application Into a Binary

GraalVM's `native-image` tool converts a Java application into a native binary. It isn't just a repackaging of the application. The Java byte code compiles into native code ahead-of-time (AOT). This native code runs on a Substrate VM, a minimal virtual machine separate from the Java Virtual Machine. Without (just-in-time) JIT compilation, applications can start faster with less memory.  As a side effect this simplifies running Java applications, removing the need for long shell scripts that resolve `$JAVA_HOME` and setup the classpath.

In this post, I'll walk through building a simple CLI that parses simple [dice notation](https://wiki.roll20.net/Dice_Reference) (e.g., "2d20") and displays the result. I'll first build the example with just Java, and then again with JavaScript to show of the polyglot features of GraalVM, building a single binary each time.

## Install GraalVM

For this post, I'm going to use the Community Edition of GraalVM, as it is easy to install with [SDKMAN](https://sdkman.io/). If you have SDKMAN installed you can run the command:

```txt
sdk install java 19.3.0.r11-grl
```

Next, install the `native-image` tool using `gu` (GraalVM Updater):

```txt
gu install native-image
```

You also need [Apache Maven](https://maven.apache.org/download.cgi):

```txt
sdk install maven
```

## Build a Simple Java Application

The type of application we build isn't important as long as it can be [run with native-image](https://github.com/oracle/graal/blob/master/substratevm/LIMITATIONS.md). I chose a simple dice parser instead of writing another "Hello World" application. You can grab the source from [GitHub](https://github.com/oktadeveloper/okta-graalvm-example).

```txt
git clone https://github.com/oktadeveloper/okta-graalvm-example.git
cd okta-graalvm-example/jdk
```

This project contains a single Java class and is limited to parsing simple dice expressions like `2d20` (roll two different twenty-sided dice). Create a new java file `src/main/java/com/okta/examples/jdk/JdkDiceApplication.java`: 

```java
package com.okta.examples.jdk;

import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

public class JdkDiceApplication {

    public static void main(String[] args) {
        if (args == null || args.length != 1) {
            System.err.println("Usage: roll <dice_expression>");
            System.err.println("Example: roll 2d20");
            System.exit(1);
        }

        System.out.println(parseDiceNotation(args[0]));
    }

    private static int parseDiceNotation(String expression) {

        // regex and match
        String simpleDiceRegex = "(?<numberOfDice>\\d+)?[dD](?<numberOfFaces>\\d+)";
        Matcher matcher = Pattern.compile(simpleDiceRegex).matcher(expression);

        // fail if no match
        if (!matcher.matches()) {
            throw new IllegalStateException("Failed to parse dice expression: " + expression);
        }

        // default numberOfDice to 1
        String numberOfDiceString = matcher.group("numberOfDice");
        if (numberOfDiceString == null || numberOfDiceString.isEmpty()) {
            numberOfDiceString = "1";
        }
        int numberOfDice = Integer.parseInt(numberOfDiceString);
        int numberOfFaces = Integer.parseInt(matcher.group("numberOfFaces"));

        // roll!
        return IntStream.rangeClosed(1, numberOfDice)
                .map(index -> new Random().nextInt(numberOfFaces) + 1)
                .sum();
    }
}
```
 
Next, we need a Maven `pom.xml` file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.okta.examples</groupId>
    <artifactId>okta-graal-example-jdk</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.graalvm.nativeimage</groupId>
                <artifactId>native-image-maven-plugin</artifactId>
                <version>19.3.0</version>
                <configuration>
                    <mainClass>com.okta.examples.jdk.JdkDiceApplication</mainClass>
                    <imageName>roll</imageName>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>native-image</goal>
                        </goals>
                        <phase>package</phase>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

The `native-image-maven-plugin` handles the creation of the native binary and specifies the following:

  - `mainClass` - the application entry point
  - `imageName` - the name of the binary build in the `target/` directory) 

Once you build the project with `mvn package`, the resulting 6.6M binary can be found in the target directory `target/roll`.

Roll some dice by running: 

```txt
./target/roll 5d6
```

Exceptions are treated the same way as Java. We can force an exception by trying to parse an ill-formatted string:

```txt
./target/roll foobar

Exception in thread "main" java.lang.IllegalStateException: Failed to parse dice expression: foobar
        at com.okta.examples.jdk.JdkDiceApplication.parseDiceNotation(JdkDiceApplication.java:28)
        at com.okta.examples.jdk.JdkDiceApplication.main(JdkDiceApplication.java:17)
```
As expected the application exits with a status code of 1.

## GraalVM's Polyglot Support

One of the popular features of GraalVM is the ability to run other languages alongside your Java code. For example, you could use GraalVM to execute some JavaScript, R, or Python from your Java code. This is beneficial if you need  to share code between different programming languages, or if you wanted to take advantage of running Node with a large heap and Java's garbage collector.

I've put another example together in the `javascript` directory of the example project.

GraalVM comes with a compatible version of Node.js that is [optimized to run on the JVM](https://www.graalvm.org/docs/why-graal/#for-nodejs-programs). Confirm you are using the version of `node` from the GraalVM distribution:

```txt
$JAVA_HOME/bin/node -e "console.log(process.version)" --show-version:graalvm

GraalVM Polyglot Engine Version 19.3.0
GraalVM Home /Users/bdemers/.sdkman/candidates/java/19.3.0.r11-grl
...
v12.10.0
```

> NOTE: In my case, simply running `node` uses the version of Node.js managed by `nvm`, you can confirm this by running `which node`. I'll use `$JAVA_HOME/bin/node` going forward.

## Create a JavaScript Application

There are a few limitations on how you can execute JavaScript with GraalVM. If you run `node` form the command line, most libraries _should_  just work, and GraalVM tests over 100,000 packages from npmjs.org regularly. However, when you use the `native-image` tool, things change. Notably, you cannot use module exports or use `process` to get at the current environment.

To port the previous Java example to JavaScript, I've split the code up into two separate files to avoid the limitations mentioned above. Both files are located in `src/main/resources/` so they can later be included in the native image, but more on that later.

First, create a `dice-roller.js` with the string parsing logic:

```javascript
function parseDiceNotation(expression) {
  const simpleDiceRegex = /(?<numberOfDice>\d+)?[dD](?<numberOfFaces>\d+)/;
  const matchObj = simpleDiceRegex.exec(expression);

  if (!matchObj) {
    throw "Failed to parse dice expression: "+ expression;
  }

  const numberOfDice = parseInt(matchObj.groups.numberOfDice) || 1;
  const numberOfFaces = parseInt(matchObj.groups.numberOfFaces);

  return Array.from({ length: numberOfDice },
                  (x, i) => { return Math.floor(Math.random() * numberOfFaces) + 1;})
              .reduce((total, i) => { return total + i }, 0);
}

// module exports are not supported, use global scope
roll = parseDiceNotation;
```

Next create `roll.js`, which runs the global `roll` function when using the `node` command:

```javascript
'use strict';

require('./dice-roller.js');

const args = process.argv.slice(2);

if (!args || args.length !== 1) {
  console.error("Usage: roll <dice_expression>");
  console.error("Example: roll 2d20");
  process.exit(1);
}

const expression = args[0];
console.log(roll(expression));
```

Execute `roll.js` with GraalVM and flip a coin by running: 

```txt
$JAVA_HOME/bin/node src/main/resources/roll.js 1d2
```

So far, this doesn't look any different than using stock Node.js, but wait!

## Mix JavaScript and Java

It's been possible to execute JavaScript in a JVM forever, first with Rhino in Java 1.6 and then Nashorn in 1.8. However, these engines [have been deprecated](https://openjdk.java.net/jeps/335) and GraalVM will likely replace them in the future.

When calling JavaScript from Java code, you can use the [`ScriptEngine` API from JSR 223](https://docs.oracle.com/javase/8/docs/api/javax/script/ScriptEngine.html), or classes from the `org.graalvm.polyglot` package.

> NOTE: GraalVM automatically provides the classes in `org.graalvm.polyglot`, so you do NOT need to add them as a dependency. However, I was unable to make IntelliJ's code completion/compilation work with GraalVM 19.3.0 and had to revert to using the command line.

Create a class in `src/main/java/com/okta/examples/javascript/JsDiceApplication.java` with a `main` method that calls the JavaScript code in `dice-roller.js`:

```java
package com.okta.examples.javascript;

import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.Value;

public class JsDiceApplication {

    public static void main(String[] args) throws Exception {
        if (args == null || args.length != 1) {
            System.err.println("Usage: roll <dice_expression>");
            System.err.println("Example: roll 2d20");
            System.exit(1);
        }

        System.out.println(parseDiceNotation(args[0]));
    }

    private static int parseDiceNotation(String expression) throws Exception {
        // load the javascript file from the classpath
        String diceRollerJs;
        try (Scanner scanner = new Scanner(
                JsDiceApplication.class.getResourceAsStream("/dice-roller.js"), StandardCharsets.UTF_8)) {
            diceRollerJs = scanner.useDelimiter("\\A").next();
        }
        
        // parse the javascript file with a new context
        Context context = Context.create("js");
        context.eval("js", diceRollerJs);

        // get a reference to the "roll" function
        Value rollFunction = context.getBindings("js").getMember("roll");
        // execute the function
        return rollFunction.execute(expression).asInt();
    }
}
```

We also need a Maven `pom.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.okta.examples</groupId>
    <artifactId>okta-graal-example-javascript</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>1.6.0</version>
                <configuration>
                    <mainClass>com.okta.examples.javascript.JsDiceApplication</mainClass>
                    <arguments>2d20</arguments>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

Run the example with the Exec Maven Plugin: `mvn compile exec:java`: 

```txt
...
[INFO] --- exec-maven-plugin:1.6.0:java (default-cli) @ okta-graal-example-javascript ---
30
...
```

Great! Now let's build a native-image with this example.

## Build a GraalVM Native Image with JavaScript Support

As with the first example, we can use the `native-image-maven-plugin` to build the native image, add the following plugin block to your `javascript/pom.xml`:

```xml
<plugin>
    <groupId>org.graalvm.nativeimage</groupId>
    <artifactId>native-image-maven-plugin</artifactId>
    <version>19.3.0</version>
    <configuration>
        <mainClass>com.okta.examples.javascript.JsDiceApplication</mainClass>
        <imageName>roll</imageName>
        <buildArgs>--language:js</buildArgs>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>native-image</goal>
            </goals>
            <phase>package</phase>
        </execution>
    </executions>
</plugin>
```

Take note of the `buildArgs` parameter of `--language:js`.  Without this argument, JavaScript support is NOT included in the image. Including support for other languages also causes the build time to be significantly longer. ☕

Build the project with `mvn package` and then run the new executable `./target/roll 10d10`.This results in the following error:

```txt
Exception in thread "main" java.lang.NullPointerException: source
        at java.util.Objects.requireNonNull(Objects.java:246)
        at java.util.Scanner.<init>(Scanner.java:595)
        at com.okta.examples.javascript.JsDiceApplication.parseDiceNotation(JsDiceApplication.java:23)
        at com.okta.examples.javascript.JsDiceApplication.main(JsDiceApplication.java:17)
```

This error has nothing to do with the inclusion of JavaScript. It is caused by the use of `Class.getResourceAsStream` (the same is true for `Class.getResource`). By default, resources are NOT included in the native image.

A Java Agent can help discover the needed resources for the image. The agent can be enabled with `-agentlib:native-image-agent=config-merge-dir=<output-directory>`.

To include the agent, run:

```txt
java \
    -agentlib:native-image-agent=config-merge-dir=./target/config-dir \
    -cp target/okta-graal-example-javascript-1.0-SNAPSHOT.jar \
    com.okta.examples.javascript.JsDiceApplication 10d10
```

This command is a bit long, but it is handy when troubleshooting larger applications. Take a look at resulting output in `target/config-dir/resource-config.json`:

```json
{
  "resources":[
    {"pattern":"META-INF/services/com.oracle.truffle.api.TruffleLanguage$Provider"}, 
    {"pattern":"META-INF/services/com.oracle.truffle.api.instrumentation.TruffleInstrument$Provider"}, 
    {"pattern":"META-INF/services/com.oracle.truffle.js.runtime.Evaluator"}, 
    {"pattern":"META-INF/services/com.oracle.truffle.js.runtime.builtins.JSFunctionLookup"}, 
    {"pattern":"META-INF/services/java.nio.file.spi.FileSystemProvider"}, 
    {"pattern":"com/oracle/truffle/nfi/impl/NFILanguageImpl.class"}, 
    {"pattern":"dice-roller.js"}
  ]
}
```

You can ignore all of the "truffle" resources; these are part of GraalVM (and explaining [Truffle](https://www.graalvm.org/docs/graalvm-as-a-platform/implement-language/) is outside the scope of this post.)

This example was a bit contrived, as it is obvious `dice-roller.js` was the resource we needed to add.

Back in our `pom.xml` update the `buildArgs` line:

```xml
<buildArgs>--language:js -H:IncludeResources=dice-roller.js</buildArgs>
```

Rebuild the project with `mvn package`, and run `./target/roll 10d10` to test the binary. 

Success!

## Are GraalVM Native Images Ready for Primetime?

GraalVM's native image feature has me excited. Historically, distributing Java command-line tools has been a pain, we often resort to shipping zip files and shell scripts as a workaround. While GraalVM's `native-image` solves much of this pain, the project isn't quite ready for everyone just yet. Substrate VM's list of [current limitations](https://github.com/oracle/graal/blob/master/substratevm/LIMITATIONS.md) and the lack of [Spring support](https://github.com/spring-projects/spring-framework/wiki/GraalVM-native-image-support) might be the biggest drawbacks. GraalVM also lacks support for [cross-compiling](https://github.com/oracle/graal/issues/407), which may add complexity to your CI pipeline to workaround. Binary size may also be an issue; the second example that embeds JavaScript caused the image size to ballon from 6.6M in the pure Java example to 92M. 

Even with these limitations, GraalVM's native-image can be used today for a wide variety of applications.

## Learn more about GraalVM and Java Security

The source for this tutorial can be found on [GitHub](https://github.com/oktadeveloper/okta-graalvm-example). If you are interested in learning more about using GraalVM and Java Security checkout the following links:

- [How to Develop a Quarkus App with Java and OIDC Authentication](/blog/2019/09/30/java-quarkus-oidc)
- [10 Excellent Ways to Secure Your Spring Boot Application](/blog/2018/07/30/10-ways-to-secure-spring-boot)
- [GraalVM Documentation](https://www.graalvm.org/)

If you have any questions about this post, please add a comment below. For more awesome content, follow [@oktadev on Twitter](https://twitter.com/oktadev), or subscribe to [our YouTube](https://youtube.com/c/oktadev) channel!
