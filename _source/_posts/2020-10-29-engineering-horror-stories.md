---
disqus_thread_id: 8258394284
discourse_topic_id: 17312
discourse_comment_url: https://devforum.okta.com/t/17312
layout: blog_post
title: "Five Engineering Stories That Will Make Your Blood Curdle"
author: lee-brandt
by: contractor
communities: [devops]
description: "Five engineering stories from Okta Developer Advocates that will make you cringe in fear."
tags: [software]
tweets:
- "Bring out your engineering horror stories! Here's five that will make you cringe."
- "Five stories of engineering horror that will make your blood curdle."
- "Engineering horror stories that will make you scream!"
image: blog/engineering-horror-stories/EngineeringHorrorStoriesThumbnail.png
type: awareness
---

If you've been an engineer for any considerable time, you've probably made some mistakes that made you want to crawl under your desk and hide. You may have even considered packing up your desk!

In the spirit of the greatest holiday ever (Halloween), the Developer Advocacy group at Okta has shared some of their scariest engineering stories.

## Exploit Explorer

Back when I still ran my own physical servers, 10 or more years ago, the word was going around about a new Linux kernel exploit that could be used to let a local user gain root privileges by running a carefully crafted binary. It turns out it affected many kernel versions and there was a good chance that any machine online at the time was vulnerable. It required local access to the machine, it wasn't something that could be run remotely, but it was still a pretty big deal given how common it was for people to share access to physical servers.

I never liked dealing with kernel upgrades on my servers since it was a pretty lengthy process that inevitably resulted in more downtime than I would like, so I decided to check if my machines were vulnerable to this and only upgrade them if they were. In order to test if they were vulnerable, I decided to actually run the exploit proof of concept code, since that seemed to be the fastest way to find out, and since these were machines I already had root access on it seemed like a perfectly reasonable way to test this out. A couple of my machines were not vulnerable, the exploit code just failed silently (probably because I was a few kernel versions out of date and the bug hadn't been introduced yet!), but on one of the machines I tried, it worked! My normal user account was suddenly logged in as root! Excited, I started writing up an explanation of what just happened, including all the commands and the console output as part of the process. I ran the exploit code again so I could get a clean screenshot, but this time instead of getting me root access, the entire machine crashed!

And that's how I brought down several dozen production websites at an organization too large for me to be willing to name in this blog post.

> **Aaron Parecki**, Security Architect Group Manager

## Apologies for "HaHa"ing Up Your Desktop

When I was attending university, I lived on campus in the dorms and became friends with the group of guys that lived next to me. All of us were computer science majors and had a shared interest in computers, video games, etc. They were great!

At the time, I was writing a lot of software in AutoIt, a scripting language that allows you to build native Windows applications. One day, while working on a project and searching for information on developer forums, I stumbled across some cool information: Windows XP allowed you to automatically run software on a USB thumb drive or a CD-ROM when it was inserted by simply specifying what the file is.

In the spirit of chaotic fun, I wrote a simple AutoIt program that ran in the background and created millions of folders on the desktop titled "ha1", "ha2", etc. I then packaged this program up to run automatically on a USB thumb drive and shared it around the dorms with my buddies as a joke. They'd insert the USB drive, not notice anything happening, only to later discover their desktop was cluttered with empty folders that served no purpose.

I thought it'd be funny.

Little did I know, by inserting the thumb drive into their computer, not only would the program run automatically, but it also wouldn't stop running unless the process was explicitly killed. Removing the thumb drive didn't stop the process from executing.

Because of this, several of my friends continued using their computers like normal until eventually, they got a BSOD because their disk was so fragmented with hundreds of millions of 0-byte folders that NTFS broke and they had to completely reformat their computers 🙁

What started off as a stupid, innocent joke ended up being an absolute nightmare. It's still something I regret to this day! I apologized right away, but still feel terrible that my stupid joke ended up costing my buddies so much time to recover from 🙁

> **Randall Degges**, Head of Developer Advocacy

## It All Depends on the `/usr`

In 1995, I helped launch the SciFi (now Syfy) channel's first website (earliest link from Internet Archive is [1997](https://web.archive.org/web/19970106060027/http://www.scifi.com/)). It was running on a Sun Sparcstation 20 knockoff, which sat on the edge of a desk connected to a 56k line.

It was very limited on space, so, in an effort to make more space available for content, I wanted to thin out the /usr folder, which had a lot of unnecessary, large files in it.

As the root user, I started with:

```
mkdir /usr.new
cd /usr.new
cp -p -r ../usr .
```

(which, temporarily doubled the space `/usr` was taking up)

I pruned out everything that was unnecessary from /usr.new. Here's what I wanted to do next:

```sh
mv /usr /usr.orig
mv /usr.new /usr
```

Maybe it would have worked if I had done it as one command? Maybe not. Solaris was finicky in those days.

As soon as I did: `mv /usr /usr.org`, all hell broke loose.

This is because all the important stuff that made Solaris work was dynamically linked to libraries buried in /usr.

So, the (new) website was non-responsive. Basic commands like `ls` were non-responsive.

I had to quickly boot the machine into maintenance mode off of a number of floppies and restore `/usr`. Thus, was my first lesson in website downtime and not mucking around in production.

> **Micah Silverman**, Senior Security H@x0r

## Somebody Get Me a Master Boot Record

In ancient times, people recognized that some parts of the world were best left alone. These places were described as "forbidden", "haunted", or "possessed" and rumored to be the domains of unseen spirits and mystical powers. Legends would tell of places where visitors would lose a sense of time, places that would slowly make people sick. I have spent a lot of time in some of those places. We know them today as "datacenters"

A data center is a building that is optimized for the comfort of computers and this makes for an environment that isn't ideal for humans. Data centers are large, cavernous rooms, filled with row after row after row of computers. In most data centers, the rows will alternate between "cold" and "hot". The computers face the cold rows and exhaust the air into the heated rows. It's easy to lose track of time when inside a data center because they are lit only by artificial light. Also, because the temperature difference between the cold and hot rows can be so extreme, you can start to feel unwell if you keep moving between 70ºF and 90ºF every few minutes.

My story begins after I had been inside one of these timeless, sickening places. I had been spending several hours performing maintenance on some critical servers. The work I was doing was the critical, yet dull and forgettable kind of system maintenance work that everyone must do from time to time. It was dull enough that I don't even remember precisely what I was doing. What I do remember is that at one point. I made a critical mistake. Instead of typing:

```shell
dd if=/dev/sda of=/dev/sdd
```
I had typed this instead:

```shell
dd if=/dev/sdd of=/dev/sda
```

Did the mistake pop right out at you? It didn't to me either. Not until a few seconds later when I was filled with a sharp sense of dread. Instead of making a backup of the boot drive (`/dev/sda`) to the backup drive (`/dev/sdd`) I had instead started copying the backup drive to the boot drive. I had canceled the operation fast enough that I knew that the data was still there. But the computer wouldn't boot because I had overwritten the boot sector. I tried rebooting the machine to check. It didn't boot. I started to panic. What was I going to do? Would I need to copy the entire hard drive somewhere else to recover the files? Where would I find a drive big enough to do that? How long would that take? I was already exhausted and unlikely to be able to spend several more hours working on the problem. Then it struck me: All of the servers started from the same image, so they all likely had the same boot sector.  All that I would have to do, in theory, would be to copy the boot sector from one machine to the one I had erased. After making some hasty calculations about how many bytes I'd need to copy, I once again used `dd` (very very carefully) to copy the boot sector of one computer to an external drive, then I used that external drive to copy the boot sector onto the computer that wouldn't boot. I tried it, rebooted the machine, and waited anxiously. The computer booted just fine. I was free to return to the land of the living this time around.

> **Joël Franusic**, Group Developer Advocate

## Subversion is Maven Me Crazy!

About 10 years ago, I was performing a release on the Apache Maven Indexer project and I deleted the project. There was an issue with the release, so I rolled it back, in doing so I deleted the remote SVN directories. Don't worry it's source control, I could revert the change and push it back up. The problem with this is it would take a long time to copy from my computer. Luckily someone shared some "SVN-fu" with me, and I was able to restore the code with a remote copy within a few seconds.  I felt like a fool, but I learned a ton about Subversion that day, so it was a fair trade.

> **Brian Demers**, Senior Developer Advocate

## Happy Halloween

Man *shivers*! Those stories make me queasy just thinking about them! 

Now it's _YOUR_ turn! Share your own engineering horror stories in the comments below. Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) for great tutorials and observations from the engineering field!

Have a happy and safe Halloween!