---
layout: blog_post
title: "Boost Your Productivity Using Okta CLI with Fig"
author: alisa-duncan
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Introducing Okta CLI autocompletion in Fig to power up your commandline"
tags: [security, oidc, cli]
tweets:
- "Looking to power up your command line? 💪  Use Okta CLI with @fig for ultimate productivity."
- "Too many terminal commands to remember? Get inline Okta CLI help with @fig! 🎉"
- ""
image: blog/okta-cli-completion/okta-cli-autocomplete-social.jpg
type: awareness
---

CLIs are great. I love the speed and productivity increases I get when using a CLI, but memorizing commands – especially when commands need arguments, options, flags, and so on – can be daunting. Luckily, there are tools available for CLI fans out there, and one tool I've been enjoying is [Fig](https://fig.io/).

## Fig powers up your CLI productivity

Fig adds autocompletion to supported terminals, which makes using CLIs so much easier. Using Git? You'll see a small window pop up with different commands and options. 

{% img blog/okta-cli-completion/git-commands.jpg alt:"Git command autocompletions in Fig" width:"800" %}{: .center-image }

It's a cool way to reinforce remembering Git command-line operations. But most of us use Git on a daily basis, so we probably have a good command... of our Git commands. 😳 Hilarious pun aside, the branch names in the context menu are pretty darn helpful.

## Boosting the power of Okta CLI

How about when it's a CLI that you might not use daily? This is where the autocompletion shines and really helps you power up!

We're pleased to announce that [Okta CLI](https://cli.okta.com/) autocompletion is available in Fig!  When you use a supported terminal, you'll see hints to help you navigate through the commands and flags, so managing your Okta applications has never been easier.

{% img blog/okta-cli-completion/all-commands.jpg alt:"All command options in Okta CLI" width:"800" %}{: .center-image }

The autocomplete context menu lists all the commands available and shows you which command requires an argument. The `okta start` command allows you to pass in a name, and you can see the optional argument at a glance.

### Managing Okta apps

You may need to create Okta apps and get app configurations. When you need to create an Okta app, the Okta CLI helps you step through the process. However, if you are an Okta power user, you may be fine creating the Okta app in one shot by passing in the app settings. In this case, the Okta CLI autocomplete is pretty handy as it shows you all the options you can pass in!

{% img blog/okta-cli-completion/create-apps.gif alt:"Animated image showing optional flags to pass in while creating an Okta app" width:"800" %}{: .center-image }

### Help is on the way!

Getting more detailed help information is easier too! The autocomplete context menu helps you navigate to the help output for a command. And yup, you can get help about the `help` command. Pretty meta, right?

{% img blog/okta-cli-completion/help-commands.jpg alt:"Okta CLI help context" width:"800" %}{: .center-image }

## Supported terminals for Okta CLI using Fig

Now that you're excited, here's the fine print. Fig currently only supports macOS. 😰  And only certain terminals and shells within macOS at that. Read [Fig's FAQ](https://fig.io/support/other/faq) for supported terminals and shells, as well as information for work support cross-platform and more terminal/shell integrations. Don't forget to get on the waiting list for your OS or shell, or submit an issue so Fig knows how to prioritize future work.

## Learn more

I hope this autocomplete feature helps you! I'd love to hear how you use Okta CLI and what tools you use to power up your terminal commands. We welcome issues and PRs in the [okta-cli GitHub repo](https://github.com/okta/okta-cli) too.

If you want to learn more about Okta, Okta CLI, security practices, and tooling, check out these posts:

* [Introducing Okta CLI](/blog/2020/12/10/introducing-okta-cli)
* [Developers Guide to GPG and YubiKey](/blog/2021/07/07/developers-guide-to-gpg)
* [Use Okta like a Rockstar](/blog/2021/02/08/use-okta-like-a-rockstar)
* [The Development Environment of the Future](/blog/2020/11/11/the-development-environment-of-the-future)

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) so you never miss any of our awesome content!
