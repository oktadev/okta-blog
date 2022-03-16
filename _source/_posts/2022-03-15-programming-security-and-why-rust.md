---
layout: blog_post
title: "Why Safe Programming Matters and Why a Language Like Rust Matters"
author: deepu-sasidharan
by: advocate
communities: [security, rust]
description: "Why safe programming matters and why I would choose Rust for that. We will also talk about Fast and safe programming with Rust."
tags: [security, rust]
tweets:
  - "Why does safe programming matter? Learn what safe programming is and why Rust is a great choice. #rustlang #rust #programming #security"
  - "Are you still writing C/C++ code? You will be amazed at the amount issues arising from unsafe code. #rustlang #rust #programming #security"
image: blog/programming-security-and-why-rust/cover.jpg
type: awareness
---

As programmers, how many of you have a good understanding of programming safety or secure programming? It's not the same application security or cyber security. I have to confess; I didn't know a lot about these in the early years of my career, especially since I didn't come from a computer science background. But looking back, I think programming security is something every programmer should be aware of and should be taught at a junior level.

What is safe programming, or to be more precise, what does being safe mean for a programming language? or rather what does unsafe mean? Let’s set the context first.

{% include toc.md %}

# Programming safety

> Programming Safety = Memory safety + Type safety + Thread safety

Safety can be categorized into three, memory safety, type safety, and thread safety (or four if you count null safety as a separate item)

## Memory safety

In a memory-safe language, when you access a variable or an item in an array, you can be sure that you are indeed accessing what you meant to or are allowed to access. In other words, you will not be reading or writing into the memory of another variable or pointer by mistake, regardless of what you do in your program.

So, why is this a big deal? Doesn’t all major programming languages ensure this?

Yes, to varying extents. But some languages are unsafe by default—for example, C and C++. In C or C++, you can access the memory of another variable by mistake, or you can free a pointer twice; that’s called double-free error. Sometimes a program continues to use a pointer after it has been freed, and that’s called free after use errors or a dangling pointer error. Such behavior is categorized as undefined behavior as they are unpredictable and causes security vulnerability rather than just crashing the program. In this scenario, a crashing program is a good thing as it won't cause a security vulnerability.

> I call it my billion-dollar mistake. It was the invention of the null reference in 1965
>
> - Tony Hoare

Then there is also null safety which is kind of related to memory safety. I come from a Java/JavaScript background, and we are so used to the concept of null. Infamous for being the worst invention in programming. Garbage collected languages need a concept of nothing so that a pointer can be freed when unused. But it also leads to issues and pain, like the null pointer exceptions. Technically this falls under memory safety, but most memory-safe languages still let you use null as a value leading to null pointer errors.

## Type safety

In a type-safe language, when you access a variable, you access it as the correct type of data it is stored as. This gives us the confidence to work on data without manually checking for the data type during runtime. Memory safety is required for a language to be type-safe.

## Thread safety

In a thread-safe language, you can access or modify the same memory from multiple threads simultaneously without worrying about data races. This is generally achieved using message passing techniques, mutual exclusion locks (Mutex), and thread synchronization. Thread safety is required for optimal memory and type safety, so generally, memory and type-safe languages tend to be thread-safe as well.

# Why does it matter?

Ok! Why does this matter, and why should we care about it? Let's take a look at some stats to get an idea first.

## Memory safety issues

Memory safety issues are the cause of most security CVEs we encounter. Undefined behavior can be abused by a hacker to take control of the program or to leak privileged information. If you try to access an array element out of its bound in memory-safe languages, you will just crash the program with panic or error, which is predictable behavior.

This is why memory-related bugs in C/C++ systems often result in CVEs and emergency patches. There are also other memory-unsafe behaviors in C/C++, like accessing pointers from stack frames that have been popped, a memory that has been de-allocated, iterator invalidation, and so on. Memory safe languages, even ones that are not the safest, still safeguard against such security issues.

If we take a stats, we can see that:

- About 70% of all [CVEs at Microsoft](https://msrc-blog.microsoft.com/2019/07/18/we-need-a-safer-systems-programming-language/) are memory safety issues
- Two-thirds of [Linux kernel vulnerabilities](https://static.sched.com/hosted_files/lssna19/d6/kernel-modules-in-rust-lssna2019.pdf) come from memory safety issues
- An [Apple study](https://langui.sh/2019/07/23/apple-memory-safety/) found that 60-70% of vulnerabilities in iOS and macOS are memory safety vulnerabilities
- [Google estimated](https://security.googleblog.com/2019/05/queue-hardening-enhancements.html) that 90% of Android vulnerabilities are memory safety issues
- [70% of all Chrome](https://www.zdnet.com/article/chrome-70-of-all-security-bugs-are-memory-safety-issues/) security bugs are memory safety issues
- An [analysis of 0-days](https://twitter.com/LazyFishBarrel/status/1129000965741404160) that were discovered being exploited in the wild found that more than 80% of the exploited - vulnerabilities were memory safety issues
- Some of the most popular security issues of all time are memory safety issues
  - [Slammer worm](https://en.wikipedia.org/wiki/SQL_Slammer), [WannaCry](https://www.abetterinternet.org/docs/memory-safety/out-of-bounds%20write), [Trident exploit](https://blog.lookout.com/trident-pegasus-technical-details), [HeartBleed](https://tonyarcieri.com/would-rust-have-prevented-heartbleed-another-look), [Stagefright](https://googleprojectzero.blogspot.com/2015/09/stagefrightened.html), [Ghost](https://blog.qualys.com/laws-of-vulnerabilities/2015/01/27/the-ghost-vulnerability)

That's a huge chunk of CVEs, and of course, there is no suspense that most of it is from C/C++ systems 🤷

{% twitter 1501086412296228866 %}

Imagine a world without memory safety issues. Imagine the amount of developer time saved, amount of money saved, amount of resources saved. Sometimes I wonder why do we still use C/C++. Right! Or more like, Why do we trust Humans, against all available evidence, to handle memory manually. And this is all without taking other non-CVE memory issues like memory leaks, memory efficiency, and so on.

## Thread safety issues

Though not as notorious as memory safety, thread safety is also a cause of major headaches for developers and can result in security issues.

Thread safety issues can cause two types of vulnerabilities:

- Information loss caused by a thread overwriting information from another
  - Pointer corruption that allows privilege escalation or remote execution
- Integrity loss due to information from multiple threads being interlaced
  - The best-known attack of this type is called a [TOCTOU](https://en.wikipedia.org/wiki/Time_of_check_to_time_of_use) (time of check to time of use) attack, which is a race condition between checking a condition (like a security credential) and using the results.

Both information loss and integrity loss can be exploited and lead to security issues. While thread safety-related exploits are harder and less common than memory safety ones, they are still possible.

## Type safety issues

While not as critical as memory and thread safety, lack of type safety can also lead to security issues, and type safety is important for ensuring memory safety.

Low-level exploits are possible in languages that are not type-safe as an attacker can manipulate the data structure and change the data type to gain access to privileged information; though it's pretty rare, it's not unheard of

# Why Rust?

Now that we understand how important programming safety is let's see why Rust is one of the safest languages and how it can avoid most of the security issues we normally encounter with languages like C/C++.

For those not familiar, Rust is a high-level multi-paradigm language. It's ideal for functional and imperative programming. It has a very modern and, in my opinion, the best tooling for a programming language. Though it was intended as a systems programming language, its advantages and flexibility have made it suitable for all sorts of use cases as a general-purpose language.

> “Rust throws around some buzz words in its docs, but they are not just marketing buzz; they actually mean it with full sincerity, and they matter a lot.”

## Safety guarantee

{% img blog/programming-security-and-why-rust/safety-meme.jpg alt:"memory safety meme" width:"600" %}{: .center-image }

The safety guarantee is one of the most important aspects of Rust; Rust is memory-safe, null-safe, type-safe, and thread-safe by design. You would have to go out of your way to break those guarantees using the `unsafe` keyword. So even in cases where you would have to write unsafe code, you are making it explicit so that issues can easily be traced down to specific code blocks.

### Memory safety

Rust ensures memory safety at compile time using its innovative ownership mechanism and the borrow checker built into the compiler. The compiler just does not allow memory unsafe code unless it’s explicitly marked as unsafe in an unsafe block or function. This static compile-time analysis eliminates many types of memory bugs, and with some more runtime checks, Rust guarantees memory safety.
There is no concept of null at the language level. Instead, Rust provides the Option enum, which can be used to mark the presence or absence of a value, making the resulting code null safe and much easier to deal with, and you will never encounter null pointer exceptions in Rust.

The ownership and borrowing mechanism makes it one of the most memory-efficient languages while avoiding pitfalls with manual memory management and garbage collection. It has memory efficiency and speeds comparable to C/C++ and memory safety better than garbage collected languages like Java and Go.

I wrote detailed articles about [memory management in different languages](https://deepu.tech/memory-management-in-programming/) in my personal blog, so check it out if you are interested in learning more about memory management in Java, Rust, JavaScript, and Go.

### Type safety

Rust is statically typed, and it guarantees type safety by strict compile-time type checks and by guaranteeing memory safety. This is not special as most modern languages are statically typed. Rust also allows some level of dynamic typing with the `dyn` keyword and Any type when required. But the powerful type inference and the compiler ensure type safety even in those cases.

### Thread safety

Rust guarantees thread safety using similar concepts for memory safety and provides standard library features like channels, Mutex, and ARC. The ownership mechanism makes it impossible to cause accidental data race from a shared state. This makes us confident to focus on code and let the compiler worry about shared data between threads.

## What else?

I wrote about [my impressions of Rust](https://deepu.tech/my-second-impression-of-rust/) in a detailed post on my blog where I explain Rust's excellent features that make it unique. Here is a short summary of the same

- **Zero cost abstractions**: Rust offers true zero-cost abstractions, which means that you can write code in any style with any number of abstractions without paying any performance penalty. Very few languages offer this, which is why Rust is so fast. Rust compiler will always generate the best byte code regardless of the style of code you write. This means you can write functional-style code and get the same performance as its imperative counterpart.
- **Immutable default**: Rust is immutable by default. Mutations have to be declared explicitly. This, along with the ability to pass by value or reference, makes it super easy to write functional code without side effects.
- **Pattern matching**: Rust has excellent support for advanced pattern matching. Pattern matching is used extensively for error handling and control flows in Rust.
- **Advanced generics, traits, and types**: Rust has advanced generics and traits with type aliasing and type inference support. Though generics could easily become complex when combined with lifetimes, it's one of the most powerful features of Rust.
- **Macros**: There is also support for metaprogramming using macros. Rust supports both declarative macros and procedural macros. Macros can be used like annotations, attributes, and functions.
- **Great tooling and one of the best compiler**: Rust has one of the best compilers and the best tooling I have seen and experienced (compared to JS world, JVM languages, Go, Python, Ruby, CSharp, PHP, C/C++). It also has excellent documentation, which is shipped with the tooling for offline use. How awesome is that!
- **Excellent community and ecosystem**: Rust has one of the most vibrant and friendly communities. The ecosystem is quite young but is one of the fastest-growing.

Usually, a programming language would offer a choice between safety, speed, and high-level abstractions. At the very best, you can pick two of those. For example, with Java/C#/Go, you get safety and high-level abstractions at the cost of runtime overhead, whereas C++ gives you speed and abstractions at the cost of safety. But Rust offers all three and a good developer experience as a bonus. I don’t think many other mainstream languages can claim that.

> “Rust, not Firefox, is Mozilla’s greatest industry contribution.”
>
> – TechRepublic

This doesn't mean there are no downsides, and Rust is definitely not a silver bullet. There are issues like the steep learning curve and complexity of the language. But it’s the closest thing to a silver bullet, in my opinion. That doesn’t mean you should just start using Rust for everything. If a use case requires speed and or concurrency or building system tools or CLIs, then Rust is an ideal choice, and personally, I would recommend Rust over C/C++ for any use case unless you are building a tool for a legacy platform that Rust does not support.

# Learn more about Rust and Security

If you want to learn more about Rust and security in general, check out these additional resources.

- [Containerless! How to Run WebAssembly Workloads on Kubernetes with Rust](/blog/2022/01/28/webassembly-on-kubernetes-with-rust)
- [Visualizing memory management in Rust](https://deepu.tech/memory-management-in-rust/)
- [What is memory safety and why does it matter?](https://www.abetterinternet.org/docs/memory-safety/)
- [A Comparison of Cookies and Tokens for Secure Authentication](/blog/2022/02/08/cookies-vs-tokens)
- [The Things to Keep in Mind about Auth](/blog/2021/10/29/things-to-keep-in-mind-about-auth)

If you liked this tutorial, chances are you'll enjoy the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
