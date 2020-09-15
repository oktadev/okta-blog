---
layout: blog_post
title: "Reintroducing Joël Franusic"
author: joel-franusic
by: advocate
communities: [python]
description: "Joël Franusic shares his personal mission statement, with an live example"
tags: [python, brython]
tweets:
- ""
- ""
- ""
image:
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
  ul {
    list-style: none;
  }
li:before {
  margin: 0 0.25em;
}
  li.pass:before {
    content: "\2611"
  }
  li.fail:before {
    content: "\2610"
  }
  
  .alert {
    border-radius: 4px;
    padding: 12px 20px 12px 20px;
    display: none;
  }
  
  .alert > code {
    font-size: 16px;
  }
  
  .error {
    background-color: rgb(255, 243, 205);
    color: rgb(113, 100, 4);
  }
  
  .success {
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

Hi my name is Joël Franusic and I&rsquo;m happy to announce that I am,
once again, a developer evangelist at Okta, focusing on the Python and Go communities.

(Why do I say &ldquo;once again&rdquo;? well, 6 years ago I started at Okta as a
developer evenagelst, but over the course of time I&rsquo;ve had a series
of other jobs at Okta, including: &ldquo;Software Engineer&rdquo;, &ldquo;Technical Marketing
Manager&rdquo;, and &ldquo;Product Marketing Manager&rdquo;)

The best way that I can think of to introduce myself is by sharing
my &ldquo;personal mission statement&rdquo; - before I go into what my
mission statement is, I want to give some background on why I have
one in the first place.

It&rsquo;s common for corporations to have a &ldquo;mission statement&rdquo; - a short
statement on what they view as their goals.

People often mock corporate mission statements, and for
good reason. Mission statements are frequently are long, vague, and uninspiring.
But not always! Sometimes a company will create a mission statement that
is truly great: short, inspiring and so lofty it could never be
achieved.

Microsoft used to have a mission statement like this: "A computer on every desk and in every home."
This mission statement probably seemed unachieveable
when it was first announced by Bill Gates in 1980. Thirty years later, it&rsquo;s
clear that this mission statement wasn&rsquo;t lofy enough!

One day, as I was reflecting on mission statements that sound impossible, I
started thinking of mission statements to jokinly propose to a friend of
mine. In the process, I stubled across a mission statement that I couldn&rsquo;t
stop thinking about:

&ldquo;Make all software, from all time, instantly available for use by any
programmer&rdquo; - this is now what I consider my personal mission statement to be.


# My personal mission statement

Hi, I&rsquo;m Joël Franusic and my personal mission is to &ldquo;make all
software, from all time, instantly available to any programmer&rdquo;.

There are a lot of ways to intrepret this mission
statement, which I like. I want this mission statement to be
flexible and able to grow and change over time.
That said, let me break down how I&rsquo;m thinking about this mission statement
right now:

Let&rsquo;s start with the first part of the mission statement: &ldquo;Make all software,
from all time&rdquo;: My thinking here is that, given enough time, software can be refined to the
point where it&rsquo;s nearly perfect, or at least its inadequacies are well
understood. When software reaches this level of perfection, it
doesn&rsquo;t really make sense to re-write it. So why should we have to?
It should be trivial to use a code from any programming language in
any other programming language. Most programming langauges have
limited support for this type of functionality, though it usually
involves bindings into code written in C. Why should it end there? I want to be able to
use, for example, Haskell code from Python, Java from Lua, or
Fortran from Go.

Now, for the next part of the mission statement: &ldquo;instantly available&rdquo;: My
view here is that a programmer should be able to write code that goes into
production
as soon as they lift their finger off of the keyboard. I don&rsquo;t want
to wait for a compile to finish, for tests to pass, for an
intrepreter to reload my code. All of those things, especially
testing, are important, but they should happen automatically and
complete within milliseconds.

For the last part of the missions statement: &ldquo;for use by any programmer&rdquo;:
My opinion is that *any* programmer should be able to leveage code written by
another programmer, no matter what the skill level or programming language
either programmer has. This distinction is important to me because nearly
everything I&rsquo;ve describe above is already possible, but only for very
experienced programmers. As William Gibson famously said: &ldquo;The future is
already here — it&rsquo;s just not very evenly distributed.&rdquo;


# That all sounds great, but how what are you doing to do about it?

Even if you agree that the things I want to do are worthwhile, it&rsquo;s
still fair to ask what that means in concrete terms.

One of things things that I&rsquo;m passionate about is working on making software
development more &ldquo;instantly available&rdquo;. There are many problems to solve in this
area. For example, much of software development today involves unneccessary waiting. As
programmers, we spend a lot of time waiting for software to install, tests to
pass, a deploy to finish. The list goes on and on.

It doesn&rsquo;t have to be this way though. We can and should make better tools for
ourselves and eachother.

As an example of one way we can make better tools. I created a tool that lets
you <a href=&ldquo;<https://developer.okta.com/live-widget/>&rdquo;>edit the code of the Okta Sign-In Widget with instant feedback, from inside
your web browser</a>. However, that tool uses JavaScript, and since I&rsquo;m focusing
on Python and Go, I wanted to make an example of running Python from inside of
the browser. So, I wrote a game for you to play and I have included this game below:


# How to play

The goal of this game is to write a Python function (`answer()`) that takes
three numbers of a sequence as input (we label these `a`, `b`, and `c`) and
returns the next number in that sequence.

For example, let&rsquo;s imagine that the `answer()` fucntion is given part of this
integer sequence as input:

<p style="height: 150px">
  <a href="https://dilbert.com/strip/2001-10-25">
    <img style="max-height: 90%; max-width:90%;" src="https://assets.amuniversal.com/321a39e06d6401301d80001dd8b71c47"/>
  </a>      
</p>

In this case, `answer` would be called with the first three numbers of the sequence, like so:
`answer(9, 9, 9)` and in this case the correct answer would be `9`. In this scenario the solution would look something like this:

    def answer(a, b, c):
        return 9

To win this game, your job will be to write a function that will be able to give
the correct answer for **all** of the sequences that will show up on this checklist:

  <ul id="messages"></ul>
  <div id="error" class="alert error"></div>
  <div id="success" class="alert success">
    You did it!
    Reward yourself by <a href="https://oeis.org/wiki/Welcome">learning more about The On-Line Encyclopedia of Integer Sequences</a> ®
    and why Donald Knuth says you can use it to
    <a href="https://youtu.be/BxQw4CdxLr8?t=1187">"You can compute your way into the literature"</a>.
  </div>
  <textarea id="editor">def answer(a, b, c):
    return True

play(answer)</textarea>
<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function(){
    brython(1)
});
</script>

Edit the code above to play!

No need to press a &ldquo;save&rdquo; button or anything. Your code will run once you&rsquo;ve
stopped typing for a bit.


# &ldquo;That&rsquo;s interesting, I guess, why should I care?&rdquo;

Perhaps you played the game, perhaps you didn&rsquo;t. But in either case, the reason
for me including this game in this blog post might not be apparent. Well, I
included the game above to show that not only is it fairly easy to run
a non-JavaScript interepreter in the browser, it can be a lot of fun when you do.

For this game, I wanted to make a something that:

-   Involves writing some mildly-complex code, something more than &ldquo;hello world&rdquo;.
-   Runs a soon as you stop typing.
-   Teaches the player something new.
-   Shows that it&rsquo;s fairly easy, and fun, to run Python directly from a browser.

If you want to see how all of this works, just use the &ldquo;View Source&rdquo;
functionality of your browser. The entire game is written in Python and I plan
on writing an in-depth explaination of the code behind this game in a subsequent
post.


# That&rsquo;s all for now

In closing, I hope you found my &ldquo;personal mission statement&rdquo; to be as thought
provoking as I have found it to be and I hope that you had as much fun playing
my little game as I did making it.

I&rsquo;d love to hear from you in the comments below, or [on Twitter](https://twitter.com/jf).

