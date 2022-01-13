---
disqus_thread_id: 7878954803
discourse_topic_id: 17217
discourse_comment_url: https://devforum.okta.com/t/17217
layout: blog_post
title: "Why CLIs Suck (and GUIs are Better)"
author: heather-downing
by: advocate
description: "Programming has come a long way over the years with how we interface with our code. Why do developers keep using command line scripts for daily tasks?"
tags: [scripts, developer, programming, career, cli, commandline, gui]
tweets:
- "GUIs are better than CLIs. We can prove it."
- "Do you use the command line as a developer every day? Here are a few reasons it isn't optimal for the human brain."
image: blog/why-clis-suck/cli-laptop-social.jpg
type: awareness
---
{% img blog/why-clis-suck/cli-laptop-social.jpg alt:"Command line laptop" width:"900" %}{: .center-image }

Posing this question on Twitter, I was amazed at the amount of responses it got:

{% img blog/why-clis-suck/quorralyne-twitter.png alt:"Twitter post by Quorralyne" width:"500" %}{: .center-image }

Check the thread out [here](https://twitter.com/quorralyne/status/1225414312950403072).

There were definitely some great points from both sides, but I wanted to explore my take on the choice in more depth. For clarity, GUIs are Graphic User Interfaces, and CLIs are Command Line Interfaces. Let's start with:

## WHY COMMAND LINE INTERFACES SUCK

(Don't worry, it's not that dramatic - just using a catchy title! Well, mostly.)

### Commands require commitment to memory

{% img blog/why-clis-suck/code-comment-memory.jpg alt:"Code comments memory" width:"800" %}{: .center-image }

It sounds like something out of The Matrix. A hacker typing away furiously on their keyboard.

In the beginning, many people considered it part of the job to have tons of commands memorized so they could use them with fluidity. I suppose you could have a browser tab open with what you need to type, but all that proves is that the commands are not intuitive to follow. Developers have enough to process with the software they are building—thousands of keyboard commands shouldn't be taking up valuable memory space in their brains.

This is also part of why I am a huge proponent of commenting code (more about that in [this blog post](/blog/2019/12/11/simple-but-poweful-habits-for-effective-developers#3-comment-code-for-your-future-self)).

### Code results are not always visible

{% img blog/why-clis-suck/git-xkcd.png alt:"xkcd GIT comic" width:"400" %}{: .center-image }

*Comic by [xkcd](https://xkcd.com/1597/)*{: .center-image }

It may be ok for some, but I greatly dislike trying to work on the DIFF between code check ins just using the GIT CLI. There are lots of great GUI tools out there that make this process relatively painless, and discerning the DIFF is one where CLIs fall right on their face. Got a merge conflict? I'm certain most developers would use a visual tool for that—even if it means opening it up in Notepad (which, of course, is a GUI).

### CLIs can get in the way instead of guiding you

{% img blog/why-clis-suck/xkcd-command-line-fu.png alt:"xkcd command line comic" width:"900" %}{: .center-image }

*Comic by [xkcd](https://xkcd.com/196/)*{: .center-image }

There are plenty of things to worry about in development. Wondering if the bash script you wrote just erased everything you did shouldn't be one of them. There aren't clear sub menu steps most of the time, and CLIs often aren't documented well, so typing HELP doesn't actually help when you need it most. You end up going down a Google rabbit hole searching for how to do something that you could have found by clicking on a menu in a GUI and visually exploring it.

### The terminal is not geared for human logic or conversation

From randomly assigned shortcuts to the phrasing of what you type to get anything done, the language of scripts are not designed to be easily understood by humans. For some, it is a badge of honor to work with something as difficult as the CLI. For others, it can be difficult to understand what the shorthand commands are doing. It requires complex domain knowledge and takes additional mental cycles to process.

Since I would rather focus on the business logic I create (and not the exact way I need to interact with GIT commands), I prefer a graphical user interface for mundane tasks. There is an entire website dedicated to the 'why' of good user experience design in software you can check out [here](https://www.usability.gov/what-and-why/user-experience.html).

## WHY GRAPHIC USER INTERFACES ARE BETTER

(Alternative title: Why you should at least give them a try.)

### Visual interfaces lower the barrier to entry

{% img blog/why-clis-suck/file-new.jpg alt:"Sublime Text File New" width:"800" %}{: .center-image }

Since we weren't born naturally coding, programming is something we need to learn. The tools we use to create software should make that process easier. Some of the best tooling with visual layouts that I've used are [GitHub Desktop](https://desktop.github.com/), [Visual Studio](https://visualstudio.microsoft.com/downloads/) and [IntelliJ IDEA](https://www.jetbrains.com/idea/). Streamlining my development workflow with good, naturally assistive tools helped me tremendously. These tools helped me explore their  available functions by simply clicking on a dropdown and examining the sub-categories below.

### Remote access is easier to use with a GUI

Sure, you can write a script out to get into another computer, but a visual interface often has the ability to remember the last box you remoted into and has drop-down options and a button you can push. It's pretty satisfying to do, if you ask me. Remotely accessing another computer or server is possible in a GUI and easy to navigate with little experience. IT professionals often use a GUI for remote access, including the management of servers and user computers.

### Graphic User Interfaces often keep accessibility in mind

From color and text choices to instructive labels and intuitive navigation, a GUI often works better for developers that need help interfacing in different ways. There are often options for changing colors and creating custom layouts with navigation that work in a more accessible manner.

There are tons of sites dedicated to this topic, but my go to is [W3.org's Accessibility Principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/) and [Useabillty.gov's Accessibility Basics](https://www.usability.gov/what-and-why/accessibility.html) for guidance. Command line interfaces make navigation anything but intuitive for the user. By contrast, Visual Studio Code has documentation around making this IDE customizable for anyone who needs it in their [accessibility section](https://code.visualstudio.com/docs/editor/accessibility). Tabbed navigation, high color contrast, and screen readers are all helpful for various disabilities.

### GUIs offer better multitasking and control

{% img blog/why-clis-suck/windows-explorer.png alt:"Windows Explorer example" width:"900" %}{: .center-image }

A GUI offers a lot of access to files, software features, and the operating system as a whole. Being more user-friendly than a command line (especially for new or novice users), a visual file system is utilized by more people. GUI users have windows that enable a user to view, control, manipulate, and toggle through multiple programs and folders at same time. Think about how useful it is to view multiple columns of metadata for files all at once, by using [Finder (Mac)](https://support.apple.com/guide/mac-help/finder-mchlp2605/mac), [File Explorer (Windows)](https://support.microsoft.com/en-us/help/17217/windows-10-whats-changed-in-file-explorer) or the various visual file managers available for [Linux](https://www.reddit.com/r/linux/comments/76lq91/whats_your_favorite_file_explorer/). It can also be pretty handy to secondary click (or control click) on a file icon in a visual manager and see the options available to use with that file.

{% img blog/why-clis-suck/windows-right-click.png alt:"Windows right-click" width:"500" %}{: .center-image }

## In Conclusion

Now that I've gone over why I think GUIs are superior and why I use them, I have to admit that I also still use a CLI for automation or for when a GUI is not available for something I am working with. The answer to the question I originally posed on Twitter truly is: **why not both?**

{% img blog/why-clis-suck/both.gif alt:"El Dorado both gif" width:"600" %}{: .center-image }

Use whatever works best for you based on the task at hand. However, GUIs have a lot to offer, and you should use them because they were designed to make things easier (if you are a human, that is). Let us know your thoughts on GUI vs. CLI in the comments below! What do you prefer?

## Learn More Development Tips from Okta

If you'd like to discover more tips, we've published a number of posts that might interest you:

* [6 Simple but Powerful Habits for Effective Developers](/blog/2019/12/11/simple-but-poweful-habits-for-effective-developers)
* [Pro Tips for Developer Relations](/blog/2019/01/28/developer-relations-pro-tips)
* [Pro Tips for Developer Relations, Part 2](/blog/2019/04/30/developer-relations-pro-tips-2)
* [5 Essential Tips for Building Developer Libraries](/blog/2019/06/10/five-essential-tips-for-building-developer-libraries)
* [7 Ways an OAuth Token is like a Hotel Key Card](/blog/2019/06/05/seven-ways-an-oauth-access-token-is-like-a-hotel-key-card)

For other great content from the Okta Dev Team, follow us on [Twitter](https://twitter.com/oktadev) and [Facebook](https://www.facebook.com/oktadevelopers)!
