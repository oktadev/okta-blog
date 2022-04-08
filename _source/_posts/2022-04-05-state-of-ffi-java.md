---
layout: blog_post
title: "Does Java finally have a secure alternative to JNI?"
author: deepu-sasidharan
by: advocate
communities: [java]
description: "Let's look at the state of Foreign Function Interface (FFI) in Java."
tags: [java, security]
tweets:
  - "Does #Java finally have a secure alternative to JNI? Let's find out and take a deep look into FFI in Java."
  - "What is the secure alternative to JNI in Java 18? Let's find out #java #security"
image: blog/state-of-ffi-java/cover.png
type: awareness
---

Java 18 was released last month (March 2022), and with it comes the second incubator of the Foreign Function & Memory API, so let us look at the state of Foreign Function Interface (FFI) in Java.

{% include toc.md %}

If you would prefer to follow along by watching a video, here's the recording of my FOSDEM'22 talk on this topic, from the [the OktaDev YouTube channel](https://youtu.be/lW69_AtAXzE).

{% youtube lW69_AtAXzE %}

## What is a Foreign Function Interface?

A foreign function interface is the ability to call functions or routines written in one programming language from another programming language. This is generally used to access native functions or programs on the host OS written in low-level languages like C. Most languages provide some form of this feature out of the box. The term originated from common LISP, but it's known by different names in different languages. Most languages use the C/C++ calling conventions for FFI and natively support calling C/C++ functions.

## Why is Foreign Function Interface needed?

Most of the use cases for FFI are around interacting with legacy apps and accessing host OS features or native libraries. But the recent surge in machine learning and advanced arithmetics make FFI even more necessary. These days we use foreign functions for an array of use cases, some of which are:

- Interacting with legacy apps
- Accessing features not available in the language
- Using native libraries
- Accessing functions or programs on the host OS
- Multi-precision arithmetic, Matrix multiplications
- GPU and CPU offloading (Cuda, OpenCL, OpenGL, Vulcan, DirectX, and so on)
- Deep learning (Tensorflow, cuDNN, Blas, and so on)
- OpenSSL, V8, and many more

## A brief history of FFI in Java

Before we dwell on the current state of FFI in Java, let's look at a brief history of FFI in Java.

### Java Native Interface (JNI)

For a long time, the standard for FFI in Java has been Java Native Interface (JNI), and it is notorious for being slow and insecure. If you are used to other languages like Rust, Go, or Python, you probably know how easy and intuitive it is to use FFI in them and that leaves something to be desired in Java. Even to do a small native call using JNI, you have to do a considerable amount of work, and it could still go wrong and end up being a security issue for the app.

The main issues with JNI are its complexity to use and the need to write C bridge code manually. These issues can lead to unsafe code and security risks. This can also cause performance overhead in some situations.
The performance and memory safety of the JNI code depends on the developer, and hence reliability will vary.

**Pros**

- Native interface access for C/C++/Assembly
- Fastest solution in Java

**Cons**

- Complicated to use and brittle
- Not very secure and could cause memory safety issues
- Overhead and performance loss is possible
- Difficult to debug
- Depends on Java developers to write safe C binding code manually

### Java Native Access (JNA)

The complexity of JNI has given rise to some community-driven libraries that make it simpler to do FFI in Java. [Java Native Access (JNA)](https://github.com/java-native-access/jna) is one of them. It's built on top of JNI and at least makes FFI easier to use, especially as it removes the need to write any C binding code manually and reduces the chances of memory safety issues. Still, it has some of the disadvantages of being JNI-based and is slightly slower than JNI in many cases. However, JNA is widely used and battle-tested, so definitely a better option than using JNI directly.

**Pros**

- Native interface access for C/C++/Assembly
- Simpler to use compared to JNI
- Dynamic binding, no need to write any C binding code manually
- Widely used and mature library

**Cons**

- Uses reflection
- Built on top of JNI
- Has performance overhead and can be slower than JNI
- Difficult to debug

### Java Native Runtime (JNR)

Another popular option is [Java Native Runtime (JNR)](https://github.com/jnr/jnr-ffi). Though not as widely used or mature as JNA, it's much more modern and has better performance than JNA for most use cases. However, there are some cases where JNA might perform better.

**Pros**

- Native interface access for C/C++/Assembly
- Easy to use
- Dynamic binding, no need to write any C binding code manually
- Modern API
- Comparable performance to JNI

**Cons**

- Built on top of JNI
- Difficult to debug

## Enter Project Panama

Project Panama is the latest Java project aiming to simplify and improve FFI in Java, and as part of this, many proposals are currently being incubated. Let's take a look at some of the active proposals and how they will work, and let's see if we finally get proper native FFI in Java.

### Foreign-Memory Access API

The first piece of the puzzle is the foreign-memory access API. It was first incubated in JDK 14, and after three incubations, a new JEP combined it into the Foreign Function & Memory API.

- API to safely and efficiently access foreign memory outside of the Java heap
  - Consistent API for different types of memory
  - Does not compromise JVM memory safety
  - Explicit memory deallocation
  - Interacts with different memory resources, including off-heap or native memory
- JEP-370 - First incubator in JDK 14
- JEP-383 - Second incubator in JDK 15
- JEP-393 - Third incubator in JDK 16

### Foreign Linker API

Another essential part that makes FFI possible is Foreign Linker API. This was first incubated in JDK 16 and was combined into Foreign Function & Memory API in the next revision.

- API for statically-typed, pure-Java access to native code
  - Focuses on ease of use, flexibility, and performance
  - Initial support for C interop
  - Calls native code in a `.dll`, `.so`, or `.dylib`
  - Creates a native function pointer to a Java method that can be passed to code in a native library
- JEP-389 - First incubator in JDK 16

### Vector API

Next is the vector API, which is crucial for FFI, especially in machine learning and advanced computations.

- API for reliable and performant vector computations
  - Platform agnostic
  - Clear and concise API
  - Reliable runtime compilation and performance
  - Graceful degradations
- JEP-338 - First incubator in JDK 16
- JEP-414 - Second incubator in JDK 17
- JEP-417 - Third incubator in JDK 18

### Foreign Function & Memory API

Finally, the Foreign Linker API & Foreign-Memory Access API has evolved together to become the Foreign Function & Memory API. It was first incubated in JDK 17.

- Evolution of the Foreign-Memory Access API and the Foreign Linker API
  - Same goals and features as the original two (ease of use, safety, performance, generality)
- JEP-412 - First incubator in JDK 17
- JEP-419 - Second incubator in JDK 18

### Jextract

And finally, there is the fantastic jextract tool. While it's not an API or part of the JDK itself, it is an essential tool for Project Panama.

- A simple command-line tool
- Generates a Java API from one or more native C headers
- Ships with OpenJDK Panama builds at the moment and will be part of the JDK in the future
- Makes working with large C headers a cakewalk

For example, to generate a Java API for OpenGL with jextract, you could simply run the following on a Unix like OS:

```bash
jextract --source -t org.opengl -I /usr/include /usr/include/GL/glut.h
```

## JNI vs. Panama

Since JNI is the current standard and Panama aims to replace that, it makes sense to compare the two. Let's take a simple example of calling the `getpid` function from the standard C `unistd` header.

### JNI

{% img blog/state-of-ffi-java/JNI-getpid.png alt:"getpid with JNI" width:"800" %}{: .center-image }

As you can see here, there are precisely six steps to make this simple native call using JNI. You start by writing a Java class that declares the native method. Then you use `javac` to generate a header file and a C class for this. These are the native bindings. Next, you will implement the C class. Remember, these are Java developers writing C code. This means you must write memory-safe C code, which has access to the entire JVM via the `JNIEnv` variable passed to the C class.  In many scenarios, the developer may not have much experience in C. So that will be fun... or more like a security nightmare. Next, you will compile the C code into a platform-specific dynamic library and determine where to place that binary. Pray that all this works without exposing the app to a security vulnerability. Then, you will load this into the Java class and compile and run the class, and hopefully, it works.

Ooof! This was just a simple `getpid` call; imagine writing something like an OpenGL interface or GPU offloading program using JNI.

### Panama

{% img blog/state-of-ffi-java/panama-getpid.png alt:"getpid with panama" width:"800" %}{: .center-image }

Using the new Panama APIs, you can do the same thing in two different ways, either by manually looking up and loading the native function or using the jextract tool.

In the first case, you just write some Java code using CLinker API. You look up the native method and invoke it; it's as simple as that. You can also do more complex stuff like working with native memory, etc. With this approach, you are using the Foreign Linker API and Foreign Memory API directly to do native calls and manage native memory. This is not the most efficient way, as this requires you to write a lot of boilerplate code and is not very scalable when working with large C headers.

The second option is to use jextract. With jextract, the entire process above can be turned into one line of code. With jextract you get a pure Java API for the native program, and you won't have to write any native code or touch any header files. jextract generates everything using the Foreign Linker and Foreign Memory API. Isn't that awesome! This is the kind of FFI experience you get in languages like Go and Rust.

For simple native calls, you can use the first approach, but for complex ones, the second approach is much better and scalable.

### Benchmark

Let's run some [Java Microbenchmark Harness (JMH)](https://github.com/openjdk/jmh) benchmarks to compare the performance of JNI and Panama API. We will use the `getpid` function from the standard C `unistd` header for the comparison. We will call the API using JNI and Panama APIs and compare the performance. I'm running the benchmark on Linux with OpenJDK 19 early access build for Panama (`openjdk 19-panama 2022-09-20`).

Here is the code for JNI, which uses the prebuilt [JavaCPP](https://github.com/bytedeco/javacpp) library to call the `getpid` function. We don't have to write all the manual C binding code and rituals as the JavaCPP library already does it.

```java
@Benchmark
public int JNILinux() {
    return org.bytedeco.javacpp.linux.getpid();
}


@Benchmark
public int JNIMac() {
    return org.bytedeco.javacpp.macosx.getpid();
}
```

Here is the code for Panama, which uses the Foreign Linker API to call the `getpid` function manually.

```java
// get System linker
private static final CLinker linker = CLinker.systemCLinker();
// predefine symbols and method handle info
private static final NativeSymbol nativeSymbol = linker.lookup("getpid").get();
private static final MethodHandle getPidMH = linker.downcallHandle(
        nativeSymbol,
        FunctionDescriptor.of(ValueLayout.OfInt.JAVA_INT));

@Benchmark
public int panamaDowncall() throws Throwable {
    return (int) getPidMH.invokeExact();
}
```

With jextract, you can further simplify it by generating a Java API for the header file with the below command:

```bash
# Linux
export C_INCLUDE=/usr/include
# macOS
export C_INCLUDE=/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include

jextract --source -d generated/src/main/java -t org.unix -I $C_INCLUDE $C_INCLUDE/unistd.h
```

And here is the code for calling the API generated by jextract:

```java
@Benchmark
public int panamaJExtract() {
    return org.unix.unistd_h.getpid();
}
```

This is a sample result.

```text
Benchmark                    Mode  Cnt   Score   Error  Units
FFIBenchmark.JNI             avgt   40  50.221 ± 0.512  ns/op
FFIBenchmark.panamaDowncall  avgt   40  49.382 ± 0.701  ns/op
FFIBenchmark.panamaJExtract  avgt   40  49.946 ± 0.721  ns/op
```

It seems like using Panama API is slightly faster than JNI, which is at the incubator stage, so I'm expecting this to become better when stable.

If you would like to run the benchmarks yourself, follow the instructions in the readme file on [the source repository](https://github.com/deepu105/Java-FFI-benchmarks)

## So, are we there yet?

The current state of Project Panama, as of JDK 18, is as follows.

- Still incubating
- Can already work with languages that have C interop like C/C++, Fortran, Rust, etc.
- Performance on par or better than JNI. Hopefully, this will be improved further.
- Jextract makes it really easy to use native libs.
- Memory safe and less brittle than JNI
- Native/off-heap memory access
- Documentation needs huge improvement. It's an incubator feature, so expect this to improve.

## Learn more about Java and FFI

If you want to learn more about Java and FFI in general, check out these additional resources.

- [Three Ways to Run Your Java Locally with HTTPS](/blog/2022/01/31/local-https-java/)
- [Five Anti-Patterns with Secrets in Java](/blog/2021/12/14/antipatterns-secrets-java/)
- [Introducing Spring Native for JHipster: Serverless Full-Stack Made Easy](/blog/2022/03/03/spring-native-jhipster/)
- [Java Records: A WebFlux and Spring Data Example](/blog/2021/11/05/java-records/)
- [Project Panama for Newbies](https://foojay.io/today/project-panama-for-newbies-part-1/)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
