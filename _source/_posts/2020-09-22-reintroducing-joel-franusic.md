---
layout: blog_post
title: "Reintroducing Joël Franusic"
author: joel-franusic
by: advocate
communities: [python]
description: "Joël Franusic shares his personal mission statement, with a live example."
tags: [python, brython]
tweets:
- "Reintroducing @jf! Learn more about his personal mission statement and try your hand at a simple Python game he wrote."
- "What does a development tool with instant feedback look like? @jf explains in this blog post."
image: blog/reintroducing-joel-franusic/sequence-game.png
type: awareness
---

<script src="https://cdn.jsdelivr.net/npm/brython@3.8.10/brython.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/brython@3.8.10/brython_stdlib.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/codemirror.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/mode/python/python.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/addon/edit/matchbrackets.js"></script>
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/codemirror.css">
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/codemirror/5.37.0/theme/neat.css" integrity="sha256-WMLC5bxpwvLiouYZo3maC9cKh1TBNxBNqrSjnlP0JQM=" crossorigin="anonymous" />
<style type="text/css">
  .jf-game > ul {
    list-style: none;
  }

  .jf-game > li:before {
    margin: 0 0.25em;
  }

  li.pass:before {
    content: "\2611"
  }

  li.fail:before {
    content: "\2610"
  }
  
  .jf-game > .alert {
    border-radius: 4px;
    padding: 12px 20px 12px 20px;
    display: none;
  }
  
  .jf-game > .alert > code {
    font-size: 16px;
  }
  
  .jf-game > .error {
    background-color: rgb(255, 243, 205);
    color: rgb(113, 100, 4);
  }
  
  .jf-game > .success {
    background-color: rgb(212, 237, 218);
    color: rgb(21, 87, 36);
  }
  
  .CodeMirror {
    height: auto !important;
  }
</style>

    
<script type="text/python3">

from browser import document, html, window, timer

def a000004():
    while True:
        yield(0)

def a000045():
    ring = [3, 5]
    while True:
        x = ring[0] + ring[1]
        yield(x)
        ring.append(x)
        ring.pop(0)

def a001477():
    x = 1
    while True:
        yield(x)
        x = x + 1

def a016777():
    x = 1
    while True:
        yield(x)
        x = x + 3

def a000079():
    x = 1
    while True:
        yield(2 ** x)
        x = x + 1

def play(func):
    document["messages"].clear()
    document["error"].clear()
    document["error"].style.display = "none"
    for incrementor in [a000004, a001477, a016777, a000079, a000045]:
        counter = incrementor()
        ring = [counter.__next__(), counter.__next__(), counter.__next__()]
        tests = 0
        name = incrementor.__name__
        checklist_message = f"""Sequence <a href="https://oeis.org/{name}" target="_blank">{name}</a>."""
        for want in counter:
            got = func(ring[0],ring[1],ring[2])
            if want != got:
                msg =  f"""Error with sequence {name}:
                          Expected <code>answer({ring[0]}, {ring[1]}, {ring[2]})</code> to return <code>{want}</code> 
                          but got <code>{got}</code> instead."""
                checklist_message = f"""Sequence <a href="https://oeis.org/{name}" target="_blank">{name}</a>."""
                document["messages"] <= html.LI(checklist_message, Class="fail")
                document["error"] <= html.DIV(msg, Class="error")
                document["error"].style.display = "block"
                return False
            ring.append(want)
            ring.pop(0)
            tests = tests + 1
            if tests > 50:
                break
        document["messages"] <= html.LI(checklist_message, Class="pass")
    document["success"].style.display = "block"
    return True

def runPy():
    print("runPy called")
    code = pyEditor.getValue()
    exec(code)

refresh_from_editor_delay_ms = 400

def edit_hook(cm, *arg):
    if cm.typing_delay_timer:
        timer.clear_timeout(cm.typing_delay_timer)
    cm.typing_delay_timer = timer.set_timeout(runPy, refresh_from_editor_delay_ms)

def init_hook(cm):
    cm.typing_delay_timer = None
    cm.on("changes", edit_hook)
    cm.on("update", edit_hook)

window.CodeMirror.defineInitHook(init_hook)

pyEditor = window.CodeMirror.fromTextArea(document["editor"], {
    "lineNumbers": True,
    "mode": "python",
    "matchBrackets": True,
    "indentUnit": 4,
    "theme": "neat"
})

</script>

{% img blog/reintroducing-joel-franusic/joel-franusic-ibm-729.jpg alt:"Joël Franusic standing in front of two IBM 729 reel-to-reel tape machines for the IBM 1401" width:"800" %}{: .center-image }

Hi, my name is Joël Franusic and I'm happy to announce that I am,
once again, a developer advocate at Okta, focusing on the Python and Go communities.

(Why do I say "once again"? Because six years ago, I started my Okta career as a
developer advocate but over the course of time I worked in a series
of other roles including: "Software Engineer", "Technical Marketing
Manager", and "Product Marketing Manager")

This blog post has two parts:

1.  An introduction to myself and my personal mission statement
2.  An example of how to run Python from inside of a web browser - which is an example of how I'm putting my personal mission statement into action


## Introducing myself

The best way that I can think of to introduce myself is by sharing
my "personal mission statement".  Before I do that, though, 
I want to give some background on why I have
one in the first place.

It's common for corporations to have a "mission statement" — a short
statement on what they view as their goals.

People often mock corporate mission statements, and for
good reason. Mission statements are frequently long, vague, and uninspiring.
But not always! Sometimes a company will create a mission statement that
is truly great: short, inspiring and so lofty it almost seems unachievable.

For example. Microsoft's statement once was: "A computer on every desk and in every home."
This mission statement probably seemed unachievable
when it was first announced by Bill Gates in 1980. Forty years later, it's
clear that this mission statement wasn't grand enough!

One day, as I was reflecting on mission statements that sound impossible, I
started brainstorming joke statements to share with a friend. In the process, I stumbled across a statement that I couldn't
stop thinking about:

"Make all software, from all time, instantly available for use by any
programmer" — this is now what I consider my personal mission statement to be.


## My personal mission statement:

There are a lot of ways to interpret this mission
statement-which I like. I want this mission statement to be
flexible and able to grow and change over time.
That said, let me break down how I'm thinking about it right now:

Let's start with the first part of the mission statement: "Make all software,
from all time". My thinking here is that, given enough time, software can be refined to the point that it's nearly perfect, or at least its inadequacies are well
understood. When software reaches this level of perfection, it
doesn't really make sense to re-write it. So, why should we have to?
It should be easy to use code from any programming language in
any other programming language. Most programming languages have
limited support for this type of functionality, though it usually
involves bindings into code written in C. Why should it end there? I want to be able to use, Haskell code from Python, Java from Lua, or
Fortran from Go, and so on.

Now, for the next part of the mission statement: "instantly available". I  believe that a programmer's code should go into production as soon as they lift their finger off the keyboard. They shouldn't have
to wait for a compile to finish, for tests to pass, or for an
interpreter to reload their code. All of those things, especially
testing, are important, but they should happen automatically and
finish within milliseconds.

Now for the last part of the mission statement: "for use by any programmer".
My opinion is that *any* programmer should be able to leverage code written by
another programmer, no matter what the skill level or programming language
either programmer has. This distinction is important to me because nearly
everything I've described above is already possible, but only for very
experienced programmers. As William Gibson famously said, "The future is
already here — it's just not very evenly distributed."


## That all sounds great, but what are you going to do about it?

Even if you agree that the things I want to do are worthwhile, it's
still fair to ask what that means in concrete terms.

One of things that I'm passionate about is making software
development more "instantly available". There are many problems that need solving in this
area. For example, much of software development today involves unnecessary waiting. As
programmers, we spend a lot of time waiting for software to install, tests to
pass, a deploy to finish-the list goes on and on.

It doesn't have to be this way, though. We can and should make better tools for
ourselves and each other.

One example of something I've made is a page that lets
you [edit the code of the Okta Sign-In Widget with instant feedback, from inside
your web browser](https://developer.okta.com/live-widget/). However, it uses JavaScript and, since I'm focusing
on Python and Go, I wanted to make an example of running Python from inside of
the browser. So, I wrote a game for you to play which I have included below:


## Running Python in a Web Browser

This is a simple game where the goal is to write a Python function (`answer()`) that takes
three numbers of a sequence as input (we label these `a`, `b`, and `c`) and
returns the next number in that sequence.

For example, let's imagine that the `answer(a, b, c)` function is given part of this
integer sequence as input:

<p style="height: 150px">
  <a href="https://dilbert.com/strip/2001-10-25">
    <img style="max-height: 90%; max-width:90%;" src="https://assets.amuniversal.com/321a39e06d6401301d80001dd8b71c47"/>
  </a>      
</p>

In this case, `answer()` would be called with the first three numbers of the sequence, like so:
`answer(9, 9, 9)`. In this case, the correct answer would be `9` and the code
to "solve" this sequence might look something like this:

    def answer(a, b, c):
        return 9

To win this game, you have to write a function that will be able to give
the correct answer for **all** of the sequences that show up on the
checklist below. The checklist will update as you solve for each sequence.
Update the Python code below to start playing!

Sequence checklist:

<div class="jf-game">
  <ul id="messages"></ul>
  <div id="error" class="alert error"></div>
  <div id="success" class="alert success">
    You did it!
    Reward yourself by <a href="https://oeis.org/wiki/Welcome">learning more about The On-Line Encyclopedia of Integer Sequences</a> ®
    and why Donald Knuth says you can use it to
    <a href="https://youtu.be/BxQw4CdxLr8?t=1187">"compute your way into the literature"</a>.
  </div>
  <textarea id="editor">def answer(a, b, c):
    return True

play(answer)</textarea>
</div>
<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function(){
    brython(1)
});
</script>

Edit the code above to play. No need to press a "save" button or anything. Your code will run once you've
stopped typing for a bit.


## "That's interesting, I guess. Why should I care?"

Perhaps you played the game, perhaps you didn't. But in either case, the reason
I included this game in this blog post might not be apparent. I
did so to show that, not only is it fairly easy to run
a non-JavaScript interpreter in the browser, it can be a lot of fun when you do.

I wanted to make something that:

* Involves writing some mildly-complex code, something just a little bit more complicated than "hello world".
* Runs as soon as you stop typing.
* Teaches the player something new.
* Shows that it's fairly easy, and fun, to run Python directly from a browser.

If you want to see how all of this works, just use the "View Source"
functionality of your browser. The entire game is written in Python and I plan
on writing an in-depth explanation of the code behind this game in a subsequent
post.


## That's all for now

In closing, I hope you found my "personal mission statement" to be as thought
provoking as I do and I hope that you had as much fun playing
my little game as I did making it.

I'd love to hear from you in the comments below, or [on Twitter](https://twitter.com/jf).
