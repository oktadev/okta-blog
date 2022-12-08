---
layout: blog_post
title: "What the Heck Is Project Loom for Java?"
author: deepu-sasidharan
by: advocate
communities: [java]
description: "What the heck is Java's Project Loom and what does it mean for regular Java developers?"
tags: [java, concurrency, project-loom]
tweets:
  - "What the heck is #Java Project Loom and what does it mean for regular Java developers?"
  - "What is the hottest new thing in #Java? Learn all about Virtual threads and Project Loom"
image: blog/state-of-project-loom/cover.jpg
type: awareness
---

Java has had good multi-threading and concurrency capabilities from early on in its evolution and can effectively utilize multi-threaded and multi-core CPUs. Java Development Kit (JDK) 1.1 had basic support for platform threads (or Operating System (OS) threads), and JDK 1.5 had more utilities and updates to improve concurrency and multi-threading. JDK 8 brought asynchronous programming support and more concurrency improvements. While things have continued to improve over multiple versions, there has been nothing groundbreaking in Java for the last three decades, apart from support for concurrency and multi-threading using OS threads.

Though the concurrency model in Java is powerful and flexible as a feature, it was not the easiest to use, and the developer experience hasn't been great. This is primarily due to the shared state concurrency model used by default. One has to resort to synchronizing threads to avoid issues like data races and thread blocking. I wrote more about Java concurrency in my [Concurrency in modern programming languages: Java](https://deepu.tech/concurrency-in-modern-languages-java/) post.

## What is Project Loom?

> Project Loom aims to drastically reduce the effort of writing, maintaining, and observing high-throughput concurrent applications that make the best use of available hardware.
>
> — Ron Pressler (Tech lead, Project Loom)

OS threads are at the core of Java's concurrency model and have a very mature ecosystem around them, but they also come with some drawbacks and are expensive computationally. Let's look at the two most common use cases for concurrency and the drawbacks of the current Java concurrency model in these cases.

One of the most common concurrency use cases is serving requests over the wire using a server. For this, the preferred approach is the thread-per-request model, where a separate thread handles each request. Throughput of such systems can be explained using [Little's law](https://en.wikipedia.org/wiki/Little%27s_law), which states that in a **stable system**, the average concurrency (number of requests concurrently processed by the server), **L**, is equal to the throughput (average rate of requests), **λ**, times the latency (average duration of processing each request), **W**. With this, you can derive that throughput equals average concurrency divided by latency (**λ = L/W**).

So in a thread-per-request model, the throughput will be limited by the number of OS threads available, which depends on the number of physical cores/threads available on the hardware. To work around this, you have to use shared thread pools or asynchronous concurrency, both of which have their drawbacks. Thread pools have many limitations, like thread leaking, deadlocks, resource thrashing, etc. Asynchronous concurrency means you must adapt to a more complex programming style and handle data races carefully. There are also chances for memory leaks, thread locking, etc.

Another common use case is parallel processing or multi-threading, where you might split a task into subtasks across multiple threads. Here you have to write solutions to avoid data corruption and data races. In some cases, you must also ensure thread synchronization when executing a parallel task distributed over multiple threads. The implementation becomes even more fragile and puts a lot more responsibility on the developer to ensure there are no issues like thread leaks and cancellation delays.

Project Loom aims to fix these issues in the current concurrency model by introducing two new features: _virtual threads_ and _structured concurrency_.

### Virtual threads

> Java 19 is scheduled to be released in September 2022, and Virtual threads will be a preview feature. Yayyy!

[Virtual threads](https://openjdk.org/jeps/425) are lightweight threads that are not tied to OS threads but are managed by the JVM. They are suitable for thread-per-request programming styles without having the limitations of OS threads. You can create millions of virtual threads without affecting throughput. This is quite similar to coroutines, like [goroutines](https://go.dev/tour/concurrency/1), made famous by the Go programming language (Golang).

The new virtual threads in Java 19 will be pretty easy to use. Compare the below with Golang's goroutines or Kotlin's coroutines.

**Virtual thread**

```java
Thread.startVirtualThread(() -> {
    System.out.println("Hello, Project Loom!");
});
```

**Goroutine**

```go
go func() {
    println("Hello, Goroutines!")
}()
```

**Kotlin coroutine**

```kotlin
runBlocking {
    launch {
        println("Hello, Kotlin coroutines!")
    }
}
```

Fun fact: before JDK 1.1, Java had support for green threads (aka virtual threads), but the feature was removed in JDK 1.1 as that implementation was not any better than platform threads. 

The new implementation of virtual threads is done in the JVM, where it maps multiple virtual threads to one or more OS threads, and the developer can use virtual threads or platform threads as per their needs. A few other important aspects of this implementation of virtual threads:

- It is a `Thread` in code, runtime, debugger, and profiler
- It's a Java entity and not a wrapper around a native thread
- Creating and blocking them are cheap operations
- They should not be pooled
- Virtual threads use a work-stealing `ForkJoinPool` scheduler
- Pluggable schedulers can be used for asynchronous programming
- A virtual thread will have its own stack memory
- The virtual threads API is very similar to platform threads and hence easier to adopt/migrate

Let's look at some examples that show the power of virtual threads.

#### Total number of threads

First, let's see how many platform threads vs. virtual threads we can create on a machine. My machine is Intel Core i9-11900H with 8 cores, 16 threads, and 64GB RAM running Fedora 36.

**Platform threads**

```java
var counter = new AtomicInteger();
while (true) {
    new Thread(() -> {
        int count = counter.incrementAndGet();
        System.out.println("Thread count = " + count);
        LockSupport.park();
    }).start();
}
```

On my machine, the code crashed after **32_539** platform threads.

**Virtual threads**

```java
var counter = new AtomicInteger();
while (true) {
    Thread.startVirtualThread(() -> {
        int count = counter.incrementAndGet();
        System.out.println("Thread count = " + count);
        LockSupport.park();
    });
}
```

On my machine, the process hung after **14_625_956** virtual threads but didn't crash, and as memory became available, it kept going slowly. You may be wondering why this behavior exists! It's due to the parked virtual threads being garbage collected, and the JVM is able to create more virtual threads and assign them to the underlying platform thread.

#### Task throughput

Let's try to run 100,000 tasks using platform threads.

```java
try (var executor = Executors.newThreadPerTaskExecutor(Executors.defaultThreadFactory())) {
    IntStream.range(0, 100_000).forEach(i -> executor.submit(() -> {
        Thread.sleep(Duration.ofSeconds(1));
        System.out.println(i);
        return i;
    }));
}
```

This uses the `newThreadPerTaskExecutor` with the default thread factory and thus uses a thread group. When I ran this code and timed it, I got the numbers shown here. I get better performance when I use a thread pool with `Executors.newCachedThreadPool()`.

```bash
# 'newThreadPerTaskExecutor' with 'defaultThreadFactory'
0:18.77 real,   18.15 s user,   7.19 s sys,     135% 3891pu,    0 amem,         743584 mmem
# 'newCachedThreadPool' with 'defaultThreadFactory'
0:11.52 real,   13.21 s user,   4.91 s sys,     157% 6019pu,    0 amem,         2215972 mmem
```

Not so bad. Now, let's do the same using virtual threads.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -> executor.submit(() -> {
        Thread.sleep(Duration.ofSeconds(1));
        System.out.println(i);
        return i;
    }));
}
```

If I run and time it, I get the following numbers.

```bash
0:02.62 real,   6.83 s user,    1.46 s sys,     316% 14840pu,   0 amem,         350268 mmem
```

This is far more performant than using platform threads with thread pools. Of course, these are simple use cases; both thread pools and virtual thread implementations can be further optimized for better performance, but that's not the point of this post.

Running Java Microbenchmark Harness (JMH) with the same code gives the following results, and you can see that virtual threads outperform platform threads by a huge margin.

```bash
# Throughput
Benchmark                             Mode  Cnt  Score   Error  Units
LoomBenchmark.platformThreadPerTask  thrpt    5  0.362 ± 0.079  ops/s
LoomBenchmark.platformThreadPool     thrpt    5  0.528 ± 0.067  ops/s
LoomBenchmark.virtualThreadPerTask   thrpt    5  1.843 ± 0.093  ops/s

# Average time
Benchmark                             Mode  Cnt  Score   Error  Units
LoomBenchmark.platformThreadPerTask   avgt    5  5.600 ± 0.768   s/op
LoomBenchmark.platformThreadPool      avgt    5  3.887 ± 0.717   s/op
LoomBenchmark.virtualThreadPerTask    avgt    5  1.098 ± 0.020   s/op
```

You can find the benchmark [source code on GitHub](https://github.com/deepu105/java-loom-benchmarks). Here are some other meaningful benchmarks for virtual threads:

- An interesting benchmark using ApacheBench [on GitHub](https://github.com/ebarlas/project-loom-comparison) by [Elliot Barlas](https://twitter.com/ElliotBarlas)
- A benchmark using Akka actors [on Medium](https://medium.com/@zakgof/a-simple-benchmark-for-jdk-project-looms-virtual-threads-4f43ef8aeb1) by [Alexander Zakusylo](https://medium.com/@zakgof)
- JMH benchmarks for I/O and non-I/O tasks [on GitHub](https://github.com/colincachia/loom-benchmark) by [Colin Cachia](https://twitter.com/colincachia)

### Structured concurrency

> Structured concurrency will be an incubator feature in Java 19.

[Structured concurrency](https://openjdk.org/jeps/428) aims to simplify multi-threaded and parallel programming. It treats multiple tasks running in different threads as a single unit of work, streamlining error handling and cancellation while improving reliability and observability. This helps to avoid issues like thread leaking and cancellation delays. Being an incubator feature, this might go through further changes during stabilization.

Consider the following example using `java.util.concurrent.ExecutorService`.

```java
void handleOrder() throws ExecutionException, InterruptedException {
    try (var esvc = new ScheduledThreadPoolExecutor(8)) {
        Future<Integer> inventory = esvc.submit(() -> updateInventory());
        Future<Integer> order = esvc.submit(() -> updateOrder());

        int theInventory = inventory.get();   // Join updateInventory
        int theOrder = order.get();           // Join updateOrder

        System.out.println("Inventory " + theInventory + " updated for order " + theOrder);
    }
}
```

We want `updateInventory()` and `updateOrder()` subtasks to be executed concurrently. Each of those can succeed or fail independently. Ideally, the `handleOrder()` method should fail if any subtask fails. However, if a failure occurs in one subtask, things get messy.

- Imagine that `updateInventory()` fails and throws an exception. Then, the `handleOrder()` method throws an exception when calling `inventory.get()`. So far this is fine, but what about `updateOrder()`? Since it runs on its own thread, it can complete successfully. But now we have an issue with a mismatch in inventory and order. Suppose the `updateOrder()` is an expensive operation. In that case, we are just wasting the resources for nothing, and we will have to write some sort of guard logic to revert the updates done to order as our overall operation has failed.
- Imagine that `updateInventory()` is an expensive long-running operation and `updateOrder()` throws an error. The `handleOrder()` task will be blocked on `inventory.get()` even though `updateOrder()` threw an error. Ideally, we would like the `handleOrder()` task to cancel `updateInventory()` when a failure occurs in `updateOrder()` so that we are not wasting time.
- If the thread executing `handleOrder()` is interrupted, the interruption is not propagated to the subtasks. In this case `updateInventory()` and `updateOrder()` will leak and continue to run in the background.

For these situations, we would have to carefully write workarounds and failsafe, putting all the burden on the developer.

We can achieve the same functionality with structured concurrency using the code below.

```java
void handleOrder() throws ExecutionException, InterruptedException {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        Future<Integer> inventory = scope.fork(() -> updateInventory());
        Future<Integer> order = scope.fork(() -> updateOrder());

        scope.join();           // Join both forks
        scope.throwIfFailed();  // ... and propagate errors

        // Here, both forks have succeeded, so compose their results
        System.out.println("Inventory " + inventory.resultNow() + " updated for order " + order.resultNow());
    }
}
```

Unlike the previous sample using `ExecutorService`, we can now use `StructuredTaskScope` to achieve the same result while confining the lifetimes of the subtasks to the lexical scope, in this case, the body of the _try-with-resources_ statement. The code is much more readable, and the intent is also clear. `StructuredTaskScope` also ensures the following behavior automatically.

- **Error handling with short-circuiting** — If either the `updateInventory()` or `updateOrder()` fails, the other is canceled unless its already completed. This is managed by the cancellation policy implemented by `ShutdownOnFailure()`; other policies are possible.

- **Cancellation propagation** — If the thread running `handleOrder()` is interrupted before or during the call to `join()`, both forks are canceled automatically when the thread exits the scope.

- **Observability** — A thread dump would clearly display the task hierarchy, with the threads running `updateInventory()` and `updateOrder()` shown as children of the scope.

## State of Project Loom

The Loom project started in 2017 and has undergone many changes and proposals. Virtual threads were initially called fibers, but later on they were renamed to avoid confusion. Today with Java 19 getting closer to release, the project has delivered the two features discussed above. One as a preview and another as an incubator. Hence the path to stabilization of the features should be more precise.

## What does this mean to regular Java developers?

When these features are production ready, it should not affect regular Java developers much, as these developers may be using libraries for concurrency use cases. But it can be a big deal in those rare scenarios where you are doing a lot of multi-threading without using libraries. Virtual threads could be a no-brainer replacement for all use cases where you use thread pools today. This will increase performance and scalability in most cases based on the benchmarks out there. Structured concurrency can help simplify the multi-threading or parallel processing use cases and make them less fragile and more maintainable.

## What does this mean to Java library developers?

When these features are production ready, it will be a big deal for libraries and frameworks that use threads or parallelism. Library authors will see huge performance and scalability improvements while simplifying the codebase and making it more maintainable. Most Java projects using thread pools and platform threads will benefit from switching to virtual threads. Candidates include Java server software like Tomcat, Undertow, and Netty; and web frameworks like Spring and Micronaut. I expect most Java web technologies to migrate to virtual threads from thread pools. Java web technologies and trendy reactive programming libraries like RxJava and Akka could also use structured concurrency effectively. This doesn't mean that virtual threads will be the one solution for all; there will still be use cases and benefits for asynchronous and reactive programming.

## Learn more about Java, multi-threading, and Project Loom

Check out these additional resources to learn more about Java, multi-threading, and Project Loom.

- [On the Performance of User-Mode Threads and Coroutines](https://inside.java/2020/08/07/loom-performance/)
- [State of Loom](http://cr.openjdk.java.net/~rpressler/loom/loom/sol1_part1.html)
- [Project Loom: Modern Scalable Concurrency for the Java Platform](https://www.youtube.com/watch?v=EO9oMiL1fFo)
- [Thinking About Massive Throughput? Meet Virtual Threads!](https://foojay.io/today/thinking-about-massive-throughput-meet-virtual-threads/)
- [Does Java 18 finally have a better alternative to JNI?](/blog/2022/04/08/state-of-ffi-java)
- [OAuth for Java Developers](/blog/2022/06/16/oauth-java)
- [Cloud Native Java Microservices with JHipster and Istio](/blog/2022/06/09/cloud-native-java-microservices-with-istio)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.

The cover image was created using a photo by [Peter Herrmann](https://unsplash.com/@tama66) on [Unsplash](https://unsplash.com)
