---
disqus_thread_id: 7976055359
discourse_topic_id: 17237
discourse_comment_url: https://devforum.okta.com/t/17237
layout: blog_post
title: "Grep for System Admins: Using Grep to Automate Daily Tasks"
author: vickie-li
by: contractor
communities: [devops]
description: "An introduction to the grep command, and how you can use (and abuse) it as a sysadmin to automate daily tasks."
tags: [grep, devops]
tweets:
- "Grep for System Admins, a new article by @vickieli7:"
- "Our friend @vickieli7 just wrote an awesome guide on using grep to automate daily tasks:"
- "grep is one of the most useful CLI tools for general hackery. Learn how to use it in our new guide:"
image: blog/grep-for-system-admins/person-staring-at-map.jpg
type: awareness
---

{% img blog/grep-for-system-admins/person-staring-at-map.jpg alt:"person staring at a map" width:"600" %}{: .center-image }

<p style="text-align:center">Photo by <a href="https://unsplash.com/@lucassankey">Lucas Sankey</a> on <a href="https://unsplash.com">Unsplash</a></p>

If you work with computers as a programmer or system administrator, you probably spend a lot of time staring into the command-line interface! And if you're used to the command line, you have probably come across the `grep` command. 

So what exactly is grep? And how do I use it, and use it better? In this post, we'll cover some of the most useful grep options and techniques to help you look for stuff more efficiently!


## Grep Basics

Grep stands for "Global Regular Expression Print", and is a command-line utility included by default in Unix-based operating systems. You can use it to perform searches in text, files, and command outputs. A simple grep command looks like this:

```bash
grep abc file.txt
```

This tells grep to search for the string "abc" in the file "file.txt", then print the matching lines in standard output.

You can also use grep to filter the output of other Unix utilities via command-line piping:

```bash
who | grep vickie
```

This will output all the lines of the output from the `who` command (which displays who is logged in on the machine) with the string "vickie" in it. 

```bash
curl www.google.com | grep "href="
```

And this will find all the links embedded in the Google homepage.


## Grepping For More

But grep is much more than a simple string searching tool! With its advanced options, grep is a powerful tool for automating and simplifying tasks. Here are a few of the most useful options that grep offers.


### Adding Context to Your Search

What if you want to see the context of each search, instead of just the matching line itself? Grep has a few surround search options for this purpose:

`-A2` Prints two lines of trailing context after each match.
`-B2` Prints two lines of leading context before each match.
`-C2` Prints two lines of leading and trailing context surrounding each match. This is equivalent to `-A2 -B2`.


### Searching From Multiple Inputs

What if you are not sure where the information is among a few files, or if you want to find all matches across several files? You can simply supply multiple input files to grep like so:

```bash
grep abc file1.txt file2.txt file3.txt
```

You can even specify filenames using the wildcard character. This searches in all `file[number].txt`.

```bash
grep abc file*.txt
```

Grep will show the matching lines in each file along with the filenames. If you want to just see the filenames that have matches, you can use the `— files-with-matches` flag. 

```bash
grep abc file*.txt --files-with-matches
```

You can also search entire directories at once using the `-r` (recursive) flag:

```bash
grep abc -r directory1
```


### Inverse Search

You can also utilize the inverse search functionality (using the `-v` flag), which will make grep print lines that don't match the provided string.

```bash
grep abc file1.txt -v
```

This can be useful when you want to rule out certain IP addresses and application names when doing log analysis, for example.


### Case-insensitive Search

An extremely useful option is the ability to make grep ignore letter cases with the flag `-i` (ignore). For example, the following command will match with both "abc" and "Abc".

```bash
grep abc file1.txt -i
```


### Count the Matches!

If you supply grep with the `-c` flag, it will only output the number of lines that matched, instead of the content of the lines.

```bash
grep abc file1.txt -c
```

### Grep with regex

Finally, you can make your search more flexible by using regular expressions in your search string. You can accomplish this by using the `-E` flag.

```bash
grep -E "^abc" file1.txt
```

For example, this command will only search for lines that start with the string "abc".


## Grep + Linux

But your grep journey does not have to end there! When combined with a few other Linux utilities, grep can become one of the most useful and flexible tools in your arsenal. 


### Lightweight Text Editing Using grep

If you use grep in conjunction with a few other command-line utilities, you can actually use it as a lightweight text processing tool!

For example, you can use grep to remove the empty lines of a file. This command will find all the non-empty lines in `logfile.txt` and rewrite all the non-empty lines back to `logfile.txt`:

```bash
grep -E "^$" -v logfile.txt > logfile.txt
```

You can also use grep to fill entirely new documents with data. For example, you can use this command to search for the subdomains of google.com embedded on Google's homepage, and paste all the URLs to `subdomains.txt`.

(The `-o` flag tells grep to print only the matching text, not the entire matching line.)

```bash
curl www.google.com | grep -Eo "http?.*google\.com" > subdomains.txt
```

You can even filter out certain subdomains by chaining grep:

```bash
curl www.google.com | grep -Eo "http?.*google\.com" | grep -Eov "http?.*www.\google\.com" > subdomains.txt
```


### Monitor the System With Grep

You can also use grep to process the output of system-monitoring utilities. For example, you can use grep to filter out the process statuses you want to examine:

```bash
ps aux | grep mysql
```

Similarly, you can use grep to quickly read specific pieces of information from the output of commands like `env`, `top`, `netstat`, and `lsof`, etc. 


### Make Your Life Easier With grep

There are many, many more ways grep can make your life easier. For example, when you are using `dig` or `nslookup`, you can quickly navigate to the lines you want using grep:

```bash
dig google.com | grep "\sA\s"
nslookup google.com | grep "Address"
```

Or, use grep to quickly find that tar command that you can't remember the flags for! 

```bash
history | grep tar
```

{% img blog/grep-for-system-admins/xkcd-tar.png alt:"XKCD comic" width:"600" %}{: .center-image }


### Recent and Relevant

You can also use grep in conjunction with other filtering utilities like `tail` to find information that is both recent and relevant.

For example, to find the most recent times `sudo` was run in a particular log file, you can run:

```bash
tail logfile.txt | grep sudo
```

If you enjoyed this article, please [tweet us](https://twitter.com/oktadev) and let us know what you think! Or, if you'd like to see some of our videos, you can subscribe to our [YouTube channel](https://www.youtube.com/oktadev).

Anddddd, be sure to check out some of our other great devops-esque posts!

- [A Developer's Guide to Docker](/blog/2017/05/10/developers-guide-to-docker-part-1)
- [Test Your GitHub Repos with Docker in 5 Minutes](/blog/2018/09/27/test-your-github-repositories-with-docker-in-five-minutes)
- [MySQL vs Postgres: Choose the Right Database for Your Project](/blog/2019/07/19/mysql-vs-postgres)
