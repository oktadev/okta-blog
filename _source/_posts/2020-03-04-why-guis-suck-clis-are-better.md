---
disqus_thread_id: 7899876471
discourse_topic_id: 17220
discourse_comment_url: https://devforum.okta.com/t/17220
layout: blog_post
title: "Why GUIs Suck (and CLIs are Better)"
author: lee-brandt
by: advocate
description: "I think command line interfaces are way easier to use that graphical user interfaces."
tags: [cli, gui]
tweets:
- "Think GUIs are better than CLIs? Think again!"
- "A quick run-down of whay CLIs are better than GUIs."
- "My top reasons why CLIs will always be better than GUIs."
image: blog/why-guis-suck/docker-run-help.png
type: awareness
---

I've always tended to lean toward Command-Line Interfaces (CLIs) over Graphical User Interfaces (GUIs). Maybe it's because I cut my teeth in computing in the Windows 3.1 days. I split my time between the "new" Windows 95 and Linux (usually RedHat 5 or Debian 2). When things weren't going well in a GUI (which was a LOT of the time), you just dropped to a terminal, typed in a command, and BAM! you were in business. Sometimes on Linux, you HAD to spend some time in the command line to install and configure the video drivers before you could even think about using a GUI.

{% img blog/why-guis-suck/sorry-dave.jpg alt:"Sorry Dave" width:"450" %}{: .center-image }

Don't get me wrong—I LOVE my window managers like Gnome and BlackBox, but the terminal always does exactly what you ask of it, and GUIs sometimes have poorly laid out menu systems that can make a simple task more complicated than it needs to be.

CLIs also have some benefits that make them clearly superior to GUIs, in my opinion.

## CLIs are Lightweight and Centrally Located

No pretty colors or buttons to render to the screen—just open the terminal and your CLI is there. All of your CLIs. Whether you're using the AWS CLI, or Git, or Heroku's CLI tool. They are all there in one terminal. No need to open other graphical application windows.

You can also customize your shell for your tastes to make it easier to use. I tend toward [Oh My ZSH!](https://ohmyz.sh/), which is a tool that uses the ZShell and adds lots of great features and customization. Most terminals also have great autocompletion, so if you can't remember _exactly_ what the command is, part of the command will give you a selection of possibilities.

{% img blog/why-guis-suck/help-button.png alt:"Help Button" width:"350" %}{: .center-image }

## Help is Only a Few Keystrokes Away

GUIs require you to go to a help menu. Depending on the operating system and the developer of the graphical interface, the help menu may be under the "About" menu item or under "File -> Preferences". It may also be a link to online documentation where you then have to search for the thing you want to do.

In contrast, CLIs allow you to just type the CLI command and `--help` to get a list of all the commands with a short description of what the command switch does. Voila!

{% img blog/why-guis-suck/drawing.png alt:"Girl Drawing" width:"450" %}{: .center-image }

## CLIs are Scriptable

Ever wanted to do a couple of commands in a row? What about doing that command combination more than once? Script it!

For instance, if you know you always want to create a new Git repo by creating a directory, changing into that directory, initializing a Git repo in that folder, and adding a `README.md` file and a `.gitignore` file, script a bunch of shell commands together. You can give the command a name like, `newgitproj MyProject` and have it do all that stuff for you.

This scriptability means that the CLI not only helps you be more productive but keeps you from making the dumb mistakes when creating a project, like adding the `.gitignore` to the wrong folder, etc.

{% img blog/why-guis-suck/alias.jpg alt:"Alias" width:"450" %}{: .center-image }

## Use Your Alias

With most shells, you can create aliases for commonly used (or poorly named) commands to make them easier to type or remember. I have aliases for most of my commonly used Git commands, like `gco` for `git checkout`. This makes it easier for me to remember the commands and saves me time typing. It also puts me, and not the person who wrote the graphical interface, in control of what the commands are. I like that, too.

{% img blog/why-guis-suck/gavel.jpg alt:"Gavel" width:"450" %}{: .center-image }

## What's the Verdict?

I prefer CLIs, but that doesn't mean that GUIs don't have their place. I still tend to edit documents in graphical document editor programs (although I do use VIM for minor edits to code and for config files). I also see the appeal of GUIs for things like Git. Being able to graphically see what you're going to do to a code's history is pretty beneficial. But I've still got `git log` and I have an alias `glog` that gives me a pretty, colored layout of what the history looks like, and that's good enough for me.

I also understand the hesitance of people who grew up in the industry with mostly graphical interfaces, and I know how easy it can be to get started with a GUI for a particular product—especially when it's an unfamiliar product. But I still think `my-cli --help` is a pretty easy way to get started.

## Learn More About Okta and Software Development

Want to see more killer content like this? Check out some other posts from the Okta Developer team:

* [Why CLIs Suck (and GUIs are Better)](/blog/2020/02/19/why-clis-suck-guis-are-better)
* [What is Angular Ivy and Why Is It Awesome?](/blog/2020/02/12/angular-ivy)
* [The Best Testing Tools for Node.js](/blog/2020/01/27/best-nodejs-testing-tools)

Also, for all the developer goodness, don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev).
