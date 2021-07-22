---
layout: blog_post
title: "Discovering macOS Settings with PlistWatch"
author: phill-edwards
by: contractor
communities: [devops,go]
description: "Developers on macOS find themselves tweaking settings using the 'defaults' command. Learn how to find those settings using PlistWatch!"
tags: [go, macos, apple]
tweets:
- "Learn how to manage your macOS settings with PlistWatch ⚙️"
- "Tweaking macOS Settings updates properties, find those properties with PlistWatch 🕵️"
- "Do you use the macOS 'defaults' command? Want an easy way to find properties?  Use PlistWatch 🔍"
image: blog/featured/okta-ios-skew.jpg
type: awareness
---

In the Apple operating systems macOS and iOS, software applications store essential configuration data in an information property list (plist) files. The plist files are managed by the operating system. Although macOS does have utilities for reading and writing plist files, they are low level. It's a manual and time-consuming process working with plist files.

There is, however, a little known tool called PlistWatch that enables changes to plist files to be monitored in real time. The tool is written in Go, which requires Go specific knowledge to run it.

Today, we are going to set up and use PlistWatch. We will also discover how it works. Let's get started!

## Prerequisites to Building and Installing a Go Application

First things first, you can only follow this article on a Mac computer, as plist is Mac-specific.

If you don't already have Go installed on your computer, you will need to [download and install Go.](https://golang.org/doc/install).

## What Is a Property List File?

Applications running on macOS and iOS devices have one or more plist files. They take the form of a dictionary of key-value pairs stored as an XML document. The files are usually created in the Xcode IDE as part of application development. Some properties are required by the operating system. Xcode automatically sets important properties. Applications that need to access system resources, such as location services, will need to define a property that requests the required level of access. System tools can change property values to change the behavior of applications. For more information see ["About Information Property List Files."](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/AboutInformationPropertyListFiles.html)

Property list files can be found in the directories `/Library/Preferences` and `~/Library/Preferences`. The file names take the form of a reversed domain name, an application name, and a `.plist` file extension. Examples are: `com.apple.dock.plist` and `com.google.Chrome.plist`.

A typical macOS system has several hundred plist files each containing many key-value pairs. Finding a particular property for a particular application can be time consuming.

## Using macOS Commands to Manage Property List Files

The main command line tool for managing plist entries is `defaults`. Try it now:

```bash
defaults read
```

You will see a large amount of output. This is the combined content of all of the plist files for all installed applications.

If you know what you are looking for you can specify a domain and optionally a key within the domain. For example, to find the orientation of the Dock, type:

```bash
defaults read com.apple.dock orientation
```

There is also the command line tool `/usr/libexec/PlistBuddy`. This allows the management of individual plist files. The user interface is not at all intuitive.

The Xcode IDE has a plist editor. Open the plist file `/Library/Preferences/com.apple.dock.plist` in Xcode and use the editor to view and change values.

{% img blog/discover-macos-settings-with-plistwatch/plist-buddy.png alt:"Screenshot of PlistBuddy" width:"800" %}{: .center-image }

## How to Install and Run PlistWatch

PlistWatch is a tool, written in Go, that makes it much easier to manage plist files. While running, it monitors the plist files for changes. Whenever an entry changes, the command that caused the change is displayed. PlistWatch available as source code in GitHub.

First of all, clone the GitHub repository:

```bash
git clone https://github.com/catilac/plistwatch.git
cd plistwatch
```

Go is a compiled language. The next step is to build an executable binary called `plistwatch` from the source code:

```bash
go build
``` 

Next, move the binary to a directory on the PATH:

```bash
mv plistwatch /usr/local/bin
```

Now, run the tool. You will see no output until a plist entry gets changed.

```bash
plistwatch
```

Let's change the position of the Dock to see some output. Select *Apple* > *System Preferences* > *Dock & Menu Bar*.

{% img blog/discover-macos-settings-with-plistwatch/mac-dock-settings.png alt:"Screenshot of macOS Dock settings panel" width:"800" %}{: .center-image }

Now make some changes, such as moving the Dock and moving it back by clicking the `Position on screen` options. You should see the changes being reported by `plistwatch`. You may also see other events being reported.

The output is a sequence of `defaults` commands that were executed by the UI.

```bash
defaults write "com.apple.dock" "orientation" 'left'
defaults write "com.apple.dock" "orientation" 'bottom'
```

The system preferences actually used the `defaults` command to change the `orientation` property in `com.apple.dock.plist`. Many changes to properties do not take effect until the application is restarted. The system preferences UI actually restarted the Dock when its orientation was changed.

**NOTE**: The single and double quotes in the output are not actually required and they can be ignored.

You can end the `plistwatch` program by typing `control+C`.

## How Does PlistWatch Work?

The `main.go` code is quite simple. Every second it executes the command `defaults read` and captures the output. It then decodes the output into a map structure. It then compares the last map structures with the current map structure and outputs any differences. Let's drill down into the decoding and map comparison operations.

The output from the `defaults read` command is not in any standard format, such as JSON or XML. It is a nested set of `key = value` pairs enclosed in `{}`. There is a lot of code in the PlistWatch project to handle the decoding and encoding of the output. It basically turns the output into a map, keyed by the domain, which is the plist file name without the `.plist` extension. The values are key-value pairs, lists and maps.

The comparison is performed in a `Diff()` function in `diff.go`.  It takes two parameters, the current plist map, and the previous plist map.

It first iterates over the keys of the current map, which are the domain names.

Then, it checks if the domain is a key in the previous map. If that key isn't present, it means that the plist has been updaed and it prints out a `defaults write` for the domain.

Then, it extracts the values for the domain from the current and previous maps. The values are themselves maps of key-value pairs.

Then, it iterates over the keys of the previous value map. If it isn't present it means that the key has been deleted and it prints out a `defaults delete` for the domain.

Then, it iterates over the keys and values of the current value map. The value can be a string, an integer, a list, or a map. It determines the value type by reflection and does a type-specific comparison of the value. If the values differ, it prints out a `defaults write` for the key and changed value.

Finally, it iterates over the keys of the previous map, which are the domain names. If the key isn't in the current map then it means that the plist has been deleted and it outputs a `defaults delete` for the domain.

## Conclusion

MacOS applications use plist files for configuration and other properties such as strings to be displayed in user interfaces. Plist files store information in a dictionary structure. The keys are strings and the values can be strings, integers, lists, and dictionaries. There are command line tools for managing plist files, but they are low level and not easy to use.

PlistWatch is an application that looks for changes in all of the plist files every second. When a change is detected it prints out the `defaults` command that would reproduce the change. Note that plist files can be changed by various applications, so the displayed `defaults` command may not have been used to make the change. PlistWatch provides a user-friendly means of monitoring changes in plist files. It also makes it easy to determine which properties are changed by operations.

One use case for using PlistWatch would be to capture the property changes required to customize the screen layout. The output can be used to create a script that applies the changes to another computer.

If you liked this post, you might enjoy these others on Apple:
[Build an iOS App with Secure Authentication in 20 Minutes](/blog/2017/11/20/build-an-iOS-app-with-secure-authentication-in-20-minutes)
[Ionic + Sign in with Apple and Google](/blog/2020/09/21/ionic-apple-google-signin)
[What Apple's App Tracking Changes Mean for Developers](/blog/2021/07/06/apple-app-tracking-changes)

As always, if you have any questions please comment below. Never miss out on any of our awesome content by following us on [Twitter](https://twitter.com/oktadev) and subscribing to our channel on [YouTube](https://www.youtube.com/c/oktadev)!
