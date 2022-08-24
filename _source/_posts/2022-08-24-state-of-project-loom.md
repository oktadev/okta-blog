---
layout: blog_post
title: "What the Heck Is Java Project Loom?"
author: deepu-sasidharan
by: advocate
communities: [java]
description: "What the heck is Java Project Loom and what does it mean for average Java developers?"
tags: [java, concurrency, project-loom]
tweets:
  - "What the heck is #Java Project Loom and what does it mean for average Java developers?"
  - "What is the hottest new thing in #Java? Learn all about Virtual threads and Project Loom"
image:
type: awareness
---

Java has pretty good multi-threading and concurrency capabilities from early on in its evolution and could utilize multi-threaded and multi-core CPUs effectively. JDK 1.1 had basic support for platform threads (or, Operating System (OS) threads) and runnables and JDK 1.5 had more utilities and updates to improve concurrency and multi-threading. JDK 8 brought asynchronous programming support and more concurrency improvements. While things improved over multiple versions, there was nothing ground breaking apart from support for concurrency and multi-threading using OS threads for the last three decades.

Though the concurrency model in Java was powerful and flexible as a feature, it was not the easiest to use and the developer experience was not that great. This was mostly due to the shared state concurrency model used by default.One has to resort to synchronizing threads to avoid issues like data races and thread blocking. I wrote more about Java concurrency in my [Concurrency in modern programming languages: Java](https://deepu.tech/concurrency-in-modern-languages-java/) blog post.

## What is Project Loom

> Project Loom aims to drastically reduce the effort of writing, maintaining, and observing high-throughput concurrent applications that make the best use of available hardware.
>
> — Ron Pressler (Tech lead, Project Loom)

OS threads are at the core of Java's concurrency model and has a very mature ecosystem around it but it also comes with some drawbacks and are expensive computationally. Let's look at two most common use cases for concurrency and the drawbacks of the current Java concurrency model in these cases.

One of the most common concurrency use case is serving requests over the wire using a server. For this the most preferred approach is the thread-per-request model where each request is handled by a separate thread. Throughput of such systems can be explained using [Little's law](https://en.wikipedia.org/wiki/Little%27s_law), which states that in a **stable system** the average concurrency (number of requests concurrently processed by the server), **L** is equal to the throughput (average rate of requests), **λ**, times the latency (average duration of processing each request), **W**. With this you can derive that throughput is equal to average concurrency divided by latency (**λ = L/W**).

So in a thread-per-request model the throughput will be limited by the number of OS threads available, which depends on the number of physical cores/threads available on the hardware. To workaround this you have to either use shared thread pools or asynchronous concurrency and both have their own drawbacks. Thread pools have many limitations, like thread leaking, deadlocks, resource thrashing and so on and asynchronous concurrency means you would have to adopt to a more complex programming style, handle data races carefully and there are chances of memory leaks, thread locking and so on.

Another common use case is parallel processing or multi-threading. When you are executing a parallel task distributed over multiple threads you have to ensure thread synchronization to avoid data races and the implementation becomes even more fragile and puts a lot more responsibility on the developer to make sure there are no issues like thread leaks and cancellation delays and so on.

Project Loom aims to fix these kind of issues in the current concurrency model by introducing two new features, virtual threads and structured concurrency.

### Virtual Threads

> Java 19 is scheduled to be released in September 2022 and Virtual threads will be a preview feature in it. Yayyy!

[Virtual threads](https://openjdk.org/jeps/425) are lightweight threads that are not tied to OS threads and instead are managed by the JVM. They are suitable for thread-per-request programming style without having the limitations of OS threads. You can create millions of virtual threads without affecting throughput. This is quite similar to coroutines, like [Goroutines](https://go.dev/tour/concurrency/1) made famous by the Go programming language.

The new virtual threads in java 19 will be quite easy to use. Compare the below with Golang's Goroutines or Kotlin's coroutines.

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

A fun fact is that prior to Java 1.1, Java had support for green threads (a.k.a virtual threads). The new implementation of virtual threads are done in the JVM where it maps multiple virtual threads to one or more OS thread and the developer can use virtual threads or platform threads as per their needs. Few other important aspects of virtual threads are:

- They are a `Thread` in code, runtime, debugger and profiler
- Its a Java entity and not a wrapper around a native thread
- Creating and blocking them are cheap operations
- They should not be pooled
- It uses a work stealing `ForkJoinPool` scheduler
- Pluggable schedulers can be used for asynchronous programming
- Virtual thread will have its own stack memory
- API is very similar to OS threads and hence easier to adopt/migrate

Let's look at some examples to show how powerful virtual threads are.

#### Total number of threads

First let's see how many platform threads vs virtual threads we can create on a machine (My machine is Intel Core i9-11900H, 8 cores, 16 threads and 64GB RAM).

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

On my machine the code crashed after **32_539** platform threads.

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

On my machine the process hanged after **14_625_956** virtual threads but didn't crash and as memory become available it kept going but slowly.

#### Task throughput

Let's try to run 100,000 tasks using platform threads

```java
try (var executor = Executors.newThreadPerTaskExecutor(Executors.defaultThreadFactory())) {
    IntStream.range(0, 100_000).forEach(i -> executor.submit(() -> {
        Thread.sleep(Duration.ofSeconds(1));
        System.out.println(i);
        return i;
    }));
}
```

This is using the `newThreadPerTaskExecutor` with default thread factory and thus uses a thread group. If we run this code and time it, we get the below numbers. If we use a thread pool with `Executors.newCachedThreadPool()` we get better performance.

```bash
# 'newThreadPerTaskExecutor' with 'defaultThreadFactory'
0:18.77 real,   18.15 s user,   7.19 s sys,     135% 3891pu,    0 amem,         743584 mmem
# 'newCachedThreadPool' with 'defaultThreadFactory'
0:11.52 real,   13.21 s user,   4.91 s sys,     157% 6019pu,    0 amem,         2215972 mmem
```

Not so bad. Now, lets do the same using virtual threads.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -> executor.submit(() -> {
        Thread.sleep(Duration.ofSeconds(1));
        System.out.println(i);
        return i;
    }));
}
```

If we run and time it, we get the below numbers.

```bash
0:02.62 real,   6.83 s user,    1.46 s sys,     316% 14840pu,   0 amem,         350268 mmem
```

This is far more performant than using platform threads with thread pools. Of course, these are simple use cases, both thread pools and virtual thread implementations can be further optimized for better performance but thats not the point of this post.

Running JMH benchmarks with the same code gives the below results and you can see that virtual threads outperform platform threads by huge margin.

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

- An interesting benchmark using ApacheBench [on GitHub](https://github.com/ebarlas/project-loom-comparison)
- A benchmark using Akka actors [on Medium](https://medium.com/@zakgof/a-simple-benchmark-for-jdk-project-looms-virtual-threads-4f43ef8aeb1)
- JMH benchmarks for I/O and non I/O tasks [on GitHub](https://github.com/colincachia/loom-benchmark)

### Structured Concurrency

> Structured concurrency will be an incubator feature in Java 19.

[Structured Concurrency](https://openjdk.org/jeps/428) is aimed at simplifying multi-threaded programming and parallel programming. It treats multiple tasks running in different threads as a single unit of work and hence streamlines error handling and cancellation while improving reliability and observability. This helps to avoid issues like thread leaking and cancellation delays. Being an incubator feature, this might go through further changes during stabilization.

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

We want `updateInventory()` and `updateOrder()` subtasks to be executed concurrently. Each of those can succeed or fail independently. Ideally the `handleOrder()` method should fail if any of the subtask fails. However, if failure occurs in one of the subtask things get messy.

- Imagine that `updateInventory()` failed and throws an exception. Then, the `handleOrder()` method will throw an exception when calling `inventory.get()`. So far is fine, but what about `updateOrder()`? Since it runs on its own thread, it can complete successfully. But now we have an issue as we have mismatch in inventory and order. If the `updateOrder()` is an expensive operation, then we are just wasting the resources for nothing and we would have to write some sort of guard logic to revert the updates done to order as our overall operation failed.
- Imagine that `updateInventory()` is an expensive long running operation and `updateOrder()` threw an error. The `handleOrder()` task will be blocked on `inventory.get()` even though `updateOrder()` threw an error. Ideally we would like the `handleOrder()` task to cancel `updateInventory()` when a failure occurs in `updateOrder()` so that we are not wasting time.
- If the thread executing `handleOrder()` is interrupted, the interruption is not propagated to the subtasks. In this case `updateInventory()` and `updateOrder()` will leak and continue to run in the background.

For these situations we would have to carefully write workarounds and failsafe, hence putting all the burden on the developer.

With structured concurrency, we can achieve the same functionality with below code.

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

Unlike the previous sample using `ExecutorService`, we can now use `StructuredTaskScope` to achieve the same result while confining the lifetimes of the subtasks to the lexical scope, in this case the body of the `try-with-resources` statement. The code is much more readable and intent is clear as well. `StructuredTaskScope` also ensures the below behavior automatically

- **Error handling with short-circuiting** — If either the `updateInventory()` or `updateOrder()` fails, the other is cancelled unless its already completed. This is managed by the cancellation policy implemented by `ShutdownOnFailure()`; other policies are possible.

- **Cancellation propagation** — If the thread running `handleOrder()` is interrupted before or during the call to `join()`, both forks are cancelled automatically when the thread exits the scope.

- **Observability** — A thread dump would clearly display the task hierarchy, with the threads running `updateInventory()` and `updateOrder()` shown as children of the scope.

## State of Project Loom

The project started in 2017 and has went through a lot of changes and proposals. Virtual threads were initially called fibers but later on it was renamed to avoid confusions. Today with Java 19 getting closer to release, the project has delivered two features discussed above. One as a preview and another as an incubator. Hence the path to stabilization of the features should be clearer.

## What does this mean to average Java developers?

When these features are production ready, it should not affect average Java developers much, as most java developers might be using libraries for most of the concurrency use cases. But in those rare scenarios where you are doing a lot multi-threading or parallel programming without using libraries, it can be a big deal as virtual threads will increase performance and scalability in most cases and structured concurrency can help simplify the codebase and make it less fragile and maintainable.

## What does this mean to Java library developers?

When these features are production ready, it will be a big deal for libraries and frameworks that are using threads or parallelism. Library authors will see huge improvements in performance and scalability while also simplifying the codebase and making it maintainable. Web frameworks like Spring and Micronaut can switch to using virtual threads to improve throughput further. I would expect most web frameworks and libraries to migrate to virtual threads from thread pools and the trendy reactive programming libraries like RxJava and Akka might be making use of structured concurrency better.

## Learn more about Java, multi-threading and Project Loom

If you want to learn more about Java, multi-threading and Project Loom, check out these additional resources.

- [On the Performance of User-Mode Threads and Coroutines](https://inside.java/2020/08/07/loom-performance/)
- [State of Loom](http://cr.openjdk.java.net/~rpressler/loom/loom/sol1_part1.html)
- [Project Loom: Modern Scalable Concurrency for the Java Platform](https://www.youtube.com/watch?v=EO9oMiL1fFo)
- [Thinking About Massive Throughput? Meet Virtual Threads!](https://foojay.io/today/thinking-about-massive-throughput-meet-virtual-threads/)
- [Does Java 18 finally have a better alternative to JNI?](https://developer.okta.com/blog/2022/04/08/state-of-ffi-java)
- [OAuth for Java Developers](/blog/2022/06/16/oauth-java)
- [Cloud Native Java Microservices with JHipster and Istio](/blog/2022/06/09/cloud-native-java-microservices-with-istio)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
