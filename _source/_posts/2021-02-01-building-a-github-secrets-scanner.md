---
disqus_thread_id: 8380180145
discourse_topic_id: 17351
discourse_comment_url: https://devforum.okta.com/t/17351
layout: blog_post
title: Building a GitHub Secrets Scanner
author: vickie-li
by: contractor
communities: [python]
description: "Use Python to build a basic GitHub secrets scanner."
tags: [python]
tweets:
- "Learn the basics of how to scan GitHub for sensitive information."
- "Would you know if someone checked secrets into GitHub? Learn how to build a tool to check."
- "Have you ever scanned your GitHub repos for accidentally committed secrets? Learn how with this post!"
image: blog/building-a-github-secrets-scanner/card.png
type: awareness
---

GitHub reconnaissance is a tactic that attackers use to gather information about their targets. Attackers analyze organizations' GitHub repositories and check for sensitive data that has been accidentally committed or information that could lead to the discovery of a vulnerability.
For this tutorial, let's build a scanner that automates the GitHub recon process! We will be scanning your GitHub repositories using the method mentioned in the "Tightening Up Your GitHub Security" post.

You will be working with Python, the GitHub REST API, and the GitPython Library. You will need to obtain a [GitHub personal access token](https://github.com/settings/tokens) and [install GitPython](https://gitpython.readthedocs.io/en/stable/intro.html#installing-gitpython). 
Make sure that your GitHub personal access token has these permissions: `public_repo`, `read:org`, `read:packages`, `read:user`, `repo:status`
Before you dive into the code, here are the imports you need:

```python
import requests, tempfile, shutil, re

from git import Repo
from git import NULL_TREE
```

## Finding Repositories
First, you will crawl through your organization's account to find repositories to analyze. You need the GitHub API for this. The GitHub API endpoint is located at `https://api.github.com`.

You can set the "Accept" header to "application/vnd.github.v3+json" to specify that you are using the REST API v3. And you can provide the access token through an "Authorization" header.

```python
GITHUB_ACCESS_TOKEN = "{Insert your token here!}"

headers = {
    "Authorization": "token {}".format(GITHUB_ACCESS_TOKEN),
    "Accept": "application/vnd.github.v3+json",
}
api_host = "https://api.github.com"

orgs = ["okta"]  # list organizations to analyze
users = ["vickie"]  # list users to analyze
```

List the organization and individual usernames that you want to analyze. Include the usernames of your organization as well as the usernames of your organization's employees. Then, you'll start by looking for additional usernames associated with your organization by querying the GitHub API for organization members.

```python
def requests_page(path):
    resp = requests.Response()
    try:
        resp = requests.get(url=path, headers=headers, timeout=15)
    except:
        pass
    return resp.json()


def find_members():
    """Find usernames associated with the organizations."""
    resp = []
    for org in orgs:
        path = "{}/orgs/{}/members".format(api_host, org)
        resp = requests_page(path)
    for user in resp:
        users.append(user["login"])
```

Optionally, you can look for contributors to your organization's projects. You can also update your `users` and `orgs` list manually as you go.

```python
def find_contributors(org, repo):
    """Find the contributors of found repos and add to users list."""
    path = "{}/repos/{}/{}/collaborators".format(api_host, org, repo)
    resp = requests_page(path)
    for user in resp:
        users.append(user["login"])
```

Next, you scan the usernames for repositories and clone the repo into a temporary directory for analysis. You might have to figure out some permission issues with the GitHub API during this step. Make sure that your access tokens have the proper permissions!

```python
def find_repos():
    """Find repositories owned by the organization and users."""
    usernames = orgs + users
    usernames = set(usernames)  # dedupe the usernames
    for username in usernames:
        path = "{}/users/{}/repos".format(api_host, username)
        resp = requests_page(path)
    for repo in resp:
        if repo["fork"] == False:
            scan_repo(repo["git_url"])


def clone_repo(repo_url):
    """Create a temporary directory to hold the repo that we are analyzing."""
    temp_dir = tempfile.mkdtemp()
    Repo.clone_from(repo_url, temp_dir)
    return temp_dir
```

## Building a Wordlist

You can also build a list of keywords that might indicate vulnerabilities or an information leak. Add search terms based on your needs. You can incorporate regex patterns as well to scan for access tokens or keys with a known format.

```python
search_terms = {
    "hardcoded secrets": [
        "key",
        "secret",
        "password",
        "encrypt",
        "API",
        "CSRF",
        "random",
        "hash",
        "MD5",
        "SHA-1",
        "SHA-2",
        "HMAC",
        "api_key",
        "secret_key",
        "was_key",
        "FTP",
        "login",
        "GitHub_token",
        "-----BEGIN PGP PRIVATE KEY BLOCK-----",
    ],
    "sensitive functionalities": [
        "auth",
        "authentication",
        "password",
        "pass",
        "login",
        "input",
        "file_input",
        "get",
        "user_input",
        "URL",
        "parameter",
        "read",
    ],
    "dangerous functionalities": [
        "import",
        "resources",
        "dependencies",
        "input()",
        "eval()",
    ],
    "development side effects": [
        "todo",
        "deprecated",
        "vulnerable",
        "vulnerability",
        "fix",
        "completed",
        "config",
        "setup",
        "dev",
        "removed",
        "HTTP",
        "HTTPS",
        "FTP",
    ],
    "weak crypto": ["ECB", "MD4", "MD5"],
}
```

## Scanning Repositories

Now, let's start scanning your repositories for keywords! You can use the GitPython library to iterate through the commits of each repository and scan for the strings in your dictionary. Finally, it displays the filenames and commit numbers that might be leaking information.

```python
class colors:
    FILENAME = "\033[1m"
    NORMAL = "\033[0m"
    WARNING = "\033[93m"


def find_strings(diff):
    print("{}{}{}".format(colors.FILENAME, diff.b_path, colors.NORMAL))
    blob_text = diff.diff.decode("utf-8", errors="replace")
    for category in search_terms:
        for term in search_terms[category]:
            if re.search(term, blob_text, re.IGNORECASE):
                print(
                    "Found term {}{}{} in this file. You should check if there are {}{}{} exposed.".format(
                        colors.WARNING,
                        term,
                        colors.NORMAL,
                        colors.WARNING,
                        category,
                        colors.NORMAL,
                    )
                )


def scan_repo(repo_url):
    temp_dir = clone_repo(repo_url)
    repo = Repo(temp_dir)
    branches = repo.remotes.origin.fetch()
    prev_commit = NULL_TREE
    # Searching commits for keywords
    for branch in branches:
        branch_name = branch.name
        for commit in repo.iter_commits(branch_name, max_count=100):
            print("=" * 25)
            print(
                "{}Searching commit {}.{}".format(
                    colors.FILENAME, commit.hexsha, colors.NORMAL
                )
            )
    diffs = commit.diff(prev_commit, create_patch=True)
    for diff in diffs:
        find_strings(diff)
        prev_commit = commit
    # remember to remove the tempfile
    shutil.rmtree(temp_dir)


if __name__ == "__main__":
    find_members()
    find_repos()
```

## Eliminating GitHub Security Holes

In this post, you built a simple GitHub scanner that finds secrets accidentally committed to your organization's repositories. If this is something that interests you, here are some related project ideas.
You can build a more powerful scanner! For example, you can build a tool that scans for the "Issues" section of GitHub to find vulnerabilities faster, or to find vulnerabilities that are not indicated by keywords. You can also build a larger and more diverse wordlist with regex patterns— what regex pattern would indicate credentials in a URL? Additionally, you can improve on the reporting of the current tool: give yourself the ability to filter by vulnerability type, or highlight the tokens and token types found in the commits.

After you've identified your GitHub weaknesses, here are a few steps that you can take to tighten up your GitHub security. First, every piece of sensitive data exposed through a public GitHub repository should be considered leaked. Therefore, you should rotate every credential found in your repositories. Next, fix or patch vulnerabilities that you have found via code analysis of these files. Again, these weaknesses should be considered public information and you should remediate them ASAP. Finally, [remove any additional sensitive information](https://help.github.com/en/github/authenticating-to-github/removing-sensitive-data-from-a-repository) from the repositories and commit histories!

If you liked this post, you might like some of our other posts:

* [Migrate From Travis CI to GitHub Actions](/blog/2020/05/18/travis-ci-to-github-actions)
* [Grep for System Admins: Using Grep to Automate Daily Tasks](/blog/2020/05/06/grep-for-system-admins)
* [Test Your GitHub Repositories with Docker in 5 Minutes](/blog/2018/09/27/test-your-github-repositories-with-docker-in-five-minutes)

Keep in touch! If you have questions about this post, please ask them in the comments below. Follow [@oktadev on Twitter](https://twitter.com/oktadev), subscribe to [our YouTube channel](https://www.youtube.com/c/oktadev), and follow us [on LinkedIn](https://www.linkedin.com/company/oktadev/).
