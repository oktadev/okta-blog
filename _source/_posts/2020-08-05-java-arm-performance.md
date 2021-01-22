---
layout: blog_post
title: "Arm Up Your Java: Performance Benchmarks"
author: brian-demers
by: advocate
communities: [devops, java]
description: "We ran Java performance tests on Arm and Intel, the results may surprise you!"
tags: [java, performance, arm, intel, benchmarks ]
tweets:
- "Arm wrestling #Java: Arm vs x86_64 performance 💪"
- "#Java performance benchmarks for #Arm ⏩"
- "You might be able to save money running your #Java app on #Arm💰"
image: blog/java-arm-performance/java-performance-social.png
type: awareness
---

Arm processors have been in the news lately, and it's causing confusion and worries about processor performance for some folks. After Apple announced its plan to switch to Arm-based processors, I heard people (incorrectly!) speculating the performance would be similar to a Raspberry Pi. Java on Arm is nothing new, but we are seeing increased Arm investment from cloud vendors. Amazon recently updated its Arm offerings, and Microsoft is working on porting the JVM to Arm64 for Windows (no doubt for future Azure support).

In this post, I'll share the Java benchmarks I took on various AWS EC2 instances, and, just for fun, on my laptop. 
* Amazon a1.large (ARMv8 Cortex-A72, 2 Cores, 4GB RAM)
* Amazon m6g.medium (ARMv8 Neoverse-N1, 1 Core, 4GB RAM)
* Amazon t3.medium (Intel Xeon Platinum 8259CL, 1 Core / 2 Threads, 4GB RAM)
* Apple MacBook Pro (Intel i9 2.4GHz, 8 Core / 16 Threads, 64GB RAM)

**NOTE:** The Arm trademark was previously written in all caps, "ARM", but is now referred to as "Arm".

## A Note About Benchmarks

Benchmarks are just numbers. They serve as a starting point when you are figuring out the compute power you need for your own application. All applications are different, your workload will likely have different characteristics than these benchmarks. The only way to figure out how your application will perform on a different system is to try to test it out!

For these tests, I tried to compare three different AWS offerings that are similar and have comparable on-demand pricing. There are some differences though. The a1.large instance is from Amazon's first-generation ARM processors, whereas the m6g.medium is the current Arm series, and the t3.medium is an Intel x86_64 processor.

To keep things consistent, all of these benchmarks used Amazon Corretto 11.0.7.10.1 JVM, with the default GC configuration, and with the tests run through [Phoronix Test Suite](https://www.phoronix-test-suite.com/).

## The Benchmarks!

In almost all cases the a1.large instance performed the worst, and my MacBook the best. This isn't particularly interesting, so I'm going to focus my analysis on the differences between the t3.medium and the m6g.medium instances.

## Machine Learning

First up, we have a test based on Apache Spark's MLlib which uses a random forest algorithm.

{% img blog/java-arm-performance/apache-spark-random-forest.png alt:"Graph showing the t3 is faster" width:"800" %}

In this test, the t3.medium is 15% faster than the m6g.medium.

{% img blog/java-arm-performance/apache-spark-als.png alt:"Graph showing the Arm server performed better" width:"800" %}

The Spark alternating least squares (ALS) benchmark is one of the few tests where both the Arm servers outpaced the t3.medium.

{% img blog/java-arm-performance/apache-spark-bayes.png alt:"Graph showing the m6g was faster" width:"800" %}

In the Spark Naive Bayes algorithm test, the m6g.medium was 8% faster than the t3.

**Winner:** m6g.medium. This was almost too close to call, but in the words of Meat Loaf, "Two Out of Three Ain't Bad."

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/k5hWWe-ts2s" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Processing Power

This batch of benchmarks focus on compute-heavy operations. The first two use functional "actors" programing from the [Savina Actors Benchmark Suite](https://shamsimam.github.io/papers/2014-agere-savina.pdf), and the rest focus on math-based operations.

{% img blog/java-arm-performance/savina-reactors.png alt:"Graph showing the t3 performed better than the m6g" width:"800" %}

This first test shows the t3.medium has a 20% lead over the m6g.medium.

{% img blog/java-arm-performance/akka-unbalanced-cobwebbed-tree.png alt:"Graph showing the t3 and m6g performed the same" width:"800" %}

Interestingly, in this test, both the m6g and the t3 perform about the same.

{% img blog/java-arm-performance/apache-spark-page-rank.png alt:"Graph showing the m6g is the clear winner" width:"800" %}

The Spark PageRank test shows the m6g performs 65% faster than the t3.

{% img blog/java-arm-performance/fast-fourier-transform.png alt:"Graph showing the m6g outperformed the t3" width:"800" %}

The m6g also outperformed the t3 by 22% when calculating Fourier transforms.

{% img blog/java-arm-performance/sparse-matrix-multiply.png alt:"Graph showing the t3 performed marginally better" width:"800" %}

The t3.medium narrowly wins the sparse matrix multiplication tests by 3%.

**Winner:** m6g.medium

## Threads and Concurrency
For many of us building web applications, concurrency is critical as your web server handles many different requests at once. This set of tests highlights the differences between the number of vCPUs in each system—the m6g.medium only has one, the a1.large and the t3.medium both have two, and the MacBook Pro has 16.

{% img blog/java-arm-performance/genetic-algorithm.png alt:"Graph showing the t3 was faster" width:"800" %}

This first test uses two threads, so naturally, the t3 is about 34% faster than the m6g.

{% img blog/java-arm-performance/twitter-http-requests.png alt:"Graph showing the single core m6g was faster" width:"800" %}

The Twitter HTTP Finagle test starts a small HTTP server and creates a number of clients equal to the number of vCPU cores plus one. The HTTP server has the number of CPUs*2.  This is going to create a bit of thread contention, which likely explains these results.

**Winner:** m6g.medium (This one was not a fair fight.)

## Pricing

At the end of the day, which system you pick may come down to a balance of price and performance. The on-demand pricing for an m6g instance (medium, large, xlarge, 2xlarge) was about 8.5% cheaper than the corresponding t3 instance.

**Winner:** m6g.medium

## Conclusion

The overall winner of these benchmarks is my MacBook Pro! Joking aside, the difference between Amazon's second-generation Arm processors and the _equivalent_ Intel processor wasn't what I expected when I started writing this post. If I had to pick between t3.medium and the m6g.medium, I'd say the overall winner of this showdown is the Arm m6g.medium.

As I mentioned at the start of this post, all of this info needs to be taken with a grain of salt.  Your Java applications will perform differently than these benchmarks, you will need to make your own conclusion to figure out if switching to Arm is right for you. The biggest challenge in switching from x86_64 to Arm64 is making sure your native dependencies are available—but this is much less of an issue nowadays as both Java and Linux distros have been supporting Arm for years.

Want more Java focused content? Check out out these posts:

* [Which Java SDK Should You Use?](/blog/2019/01/16/which-java-sdk)
* [Debugging JVM Performance Issues at Okta](/blog/2019/05/28/debugging-jvm-performance-problems-java)
* [Java REST API Showdown: Which is the Best Framework on the Market?](/blog/2020/01/09/java-rest-api-showdown)

If you enjoyed this blog post and want to see more like it, follow [@oktadev](https://twitter.com/oktadev) on Twitter, subscribe to [our YouTube channel](https://youtube.com/c/oktadev), or follow us on [LinkedIn](https://www.linkedin.com/company/oktadev/). As always, please leave your questions and comments below—we love to hear from you!
