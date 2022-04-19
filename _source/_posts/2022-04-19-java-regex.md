---
layout: blog_post
title: "A Quick Guide to Regular Expressions in Java"
author: karl-hughes
by: contractor
communities: [java]
description: "In this tutorial, you'll learn how to use regular expressions to define a pattern for searching or manipulating strings in Java."
tags: [java, regex, regular-expressions]
tweets:
- "A regular expression can be a single character, or a more complicated pattern. Learn how to use them in @java with this quick guide."
- "A regular expression is a pattern of characters that describes a set of strings. Learn how to use the `java.util.regex` package in this tutorial."
- "Java has a regular expressions API for defining String patterns that can be used for searching, manipulating, and editing a string in Java. Learn more in this tutorial."
image: blog/regular-expressions-java/regular-expressions-java.jpg
type: awareness
github: https://github.com/oktadev/java-regex-examples
---

Whether you're coding, using a search engine, searching and replacing text in a text editor, or using the command-line utilities `grep`, `sed`, and `awk` in Linux, you're using regular expressions (also known as "regex" or "regexp"). Yes, they're everywhere.

A regular expression is a sequence of characters used to describe a text pattern. Working with regular expressions is rarely described as fun, but they are useful for various problems while coding a feature, such as finding and replacing operations with strings.

When coding a solution using regular expressions, you typically use the built-in libraries provided by the programming language you're using. Java is no exception. It includes support for regular expressions using classes in the `java.util.regex` package.

In this article, you'll learn how to use regular expressions to define a pattern for searching or manipulating strings in Java. You can find [the code in this article on GitHub](https://github.com/oktadev/java-regex-examples).

{% include toc.md %}

## The what and why of regular expressions

So, what are regular expressions? Wikipedia defines a [regular expression](https://en.wikipedia.org/wiki/Regular_expression) as "a sequence of characters that specifies a search pattern in text."

For example, if you use the regular expression `ab*`, you're issuing an instruction to match a string that has an `a` followed by zero or more `b`'s. So parts of the strings: `ab`, `abc`, `abbc`, etc. will match our regular expression. The asterisk symbol, `*`, denotes the number of times a character or a sequence of characters may occur.

Regular expressions make finding patterns in text much easier. Some high-level use cases include:
* Email validation
* Phone number validation
* Credit card number validation
* Password pattern matching
* String replacement

Regular expressions are also well-supported in many programming languages.

## How to use regular expressions in Java

Supporting classes for regular expressions in Java are available in the `java.util.regex` package. As per [Java's documentation](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html), the package primarily consists of the three classes below.

**`Pattern`:** The object of this class is a compiled representation of a regular expression. There are no public constructors available in this class, so you need to call the `compile()` static method to create an object.

Here are the different implementation details and method signature of the `compile()` method available in the `Pattern` class as per Java's documentation.

```java
/**
* Compiles the given regular expression into a pattern.
*
* @param  regex
*         The expression to be compiled
* @return the given regular expression compiled into a pattern
* @throws  PatternSyntaxException
*          If the expression's syntax is invalid
*/
public static Pattern compile(String regex) {
    return new Pattern(regex, 0);
}

/**
* Compiles the given regular expression into a pattern with the given
* flags.
* @param  regex
*         The expression to be compiled
*
* @param  flags
*         Match flags, a bit mask that may include
*         {@link #CASE_INSENSITIVE}, {@link #MULTILINE}, {@link #DOTALL},
*         {@link #UNICODE_CASE}, {@link #CANON_EQ}, {@link #UNIX_LINES},
*         {@link #LITERAL}, {@link #UNICODE_CHARACTER_CLASS}
*         and {@link #COMMENTS}
*
* @return the given regular expression compiled into a pattern with the given flags
*/
public static Pattern compile(String regex, int flags) {
    return new Pattern(regex, flags);
}
 ```

**`Matcher`:** This class also has no public constructor, and the object of this class is constructed by invoking the `matcher()` method on a `Pattern` class object. The `Matcher` object will match the given input against a given pattern.

**`PatternSyntaxException`:** This class throws an unchecked exception to indicate a syntax error in a regular-expression pattern.

The typical code flow of working with a regular expression in Java is shown below.

We first create a `Pattern` object by invoking its static `compile()` method, and then we pass it a pattern, i.e., string literal Java, as the first input parameter. The second input parameter, `Pattern.CASE_INSENSITIVE`, enables case-insensitive matching.

Next, we create an object of the `Matcher` class by calling the `Pattern` object's `matcher()` method. We are also passing the text we want to check for matches: if there is a match, the program prints `true`, and `false` if there isn't.

```java
public class TestRegularExpressions {

    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("Java", Pattern.CASE_INSENSITIVE);
        System.out.println(pattern.matcher("java").matches()); // prints true
        System.out.println(pattern.matcher("JAVA").matches()); // prints true
        System.out.println(pattern.matcher("javascript").matches()); // prints false
    }
}
```

Moreover, in Java, `String` class has methods for string manipulation using regular expressions. Here are some coding examples:

```java
public class StringRegexOperations {
    public static void main(String[] args) {
        String str1 = "J A V A";
        System.out.println(str1.replaceAll("\\s", "")); // prints "JAVA"
        String str2 = "J,AVA";
        System.out.println(str2.replaceFirst(",", "")); // prints "JAVA"
        String str3 = "C,Java,Kotlin,C++";
        System.out.println(Arrays.stream(str3.split(","))
            .filter(s -> s.equals("Java")).findFirst().get()); // prints "Java"
        String str4 = "jane@okta.com";
        System.out.println(str4.matches("^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$")); // prints true
    }
}
```

While the preceding coding example is self-explanatory, here is a summary of methods available in the `String` class that accepts regex as one of its input parameters:

| Method Name  | What it does |
| ------------- | ------------- |
| `replaceAll()`  | Replaces each substring of this string that matches the given regular expression with the given replacement.  |
| `replaceFirst()`  | Replaces the first substring of this string that matches the given regular expression with the given replacement.  |
| `split()`  | Splits this string around matches of the given regular expression.  |
| `matches()`  | Tells whether or not this string matches the given regular expression. |

## How to use regular expressions to validate email addresses and phone numbers

A common use case for regular expressions is to validate email addresses and phone numbers, which you'll learn to do here.

```java
import org.junit.jupiter.api.Test;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoApplicationTests {
    /**
     * We will use the following test method `setUp()` that accepts two inputs, i.e. the regex pattern and the string to be searched in the given pattern.
     * @param inputRegex
     * @param searchString
     */
    boolean setUp(String inputRegex, String searchString) {
        Pattern p = Pattern.compile(inputRegex, Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(searchString);
        return m.matches();
    }

    /**
     * The following test shows how to do email validation using classes available in the `java.util.regex` Java package against the valid input.
     * This test should pass.
     */
    @Test
    void when_email_is_valid() {
        assertTrue(setUp("[a-zA-Z0-9_+&*-]*@" + "okta.com$", "julia@okta.com"));
    }

    /**
     * And this test shows how to do so against the invalid input. This test should result in a failure.
     */
    @Test
    void when_email_is_invalid() {
        assertFalse(setUp("[a-zA-Z0-9_+&*-]*@" + "okta.com$", "julia@okta"));
    }

    /**
     * The following tests show how to do phone validation using classes available in the `java.util.regex` Java package.
     * It uses a basic regular expression to check if the number is a valid ten digit. Advanced use cases could also handle country codes and so forth.
     */
    @Test
    void when_phone_number_is_valid() {
        String regex = "^[0-9]{10}$";
        assertTrue(setUp("^[0-9]{10}$", "1234567890"));
    }

    /**
     * And this test shows how to do so against the invalid input. This test should result in a failure.
     */
    @Test
    void when_phone_number_is_invalid() {
        String regex = "^[0-9]{10}$";
        assertFalse(setUp("^[0-9]{10}$", "123456789"));
    }
}
```

## Alternative resources for building and validating regular expressions

Several resources are available to help you with using regular expressions. Here are three relevant for Java.

### Regexr

[Regexr](https://regexr.com/) is an HTML/JS-based tool for creating, testing, and learning about regular expressions. It's a good resource for building and validating patterns in the browser. One of the best features of Regexr is its Community Patterns feature, where you can search for patterns submitted by other users.

To use a community pattern, you must first select a pattern, click on its URL, or double-click the list to load the full pattern. You can also use the right arrow icon to load the expression or text. In the screenshot below, we have picked an existing community pattern for password validation. We have run some tests to ensure that it does proper password validation as per the regex.

{% img blog/regular-expressions-java/regexr.png alt:"Regexr screenshot" width:"800" %}{: .center-image }

### GitHub Copilot

Thanks to [GitHub Copilot](https://copilot.github.com/), an AI tool developed by GitHub, you no longer have to write your own regular expressions.

The following screenshot shows Copilot suggesting a regex for email validation. In the IntelliJ Idea IDE, we can press `TAB` to accept the suggestion.

{% img blog/regular-expressions-java/github-copilot.png alt:"GitHub Copilot" width:"800" %}{: .center-image }

### JavaVerbalExpressions

[JavaVerbalExpressions](https://github.com/VerbalExpressions/JavaVerbalExpressions) is a library written in Java that helps to construct difficult regular expressions. You can add the following Maven dependency to add support for this library to your project.

```xml
<dependency>
    <groupId>ru.lanwen.verbalregex</groupId>
    <artifactId>java-verbal-expressions</artifactId>
    <version>1.8</version>
</dependency>
```

JavaVerbalExpressions uses a builder pattern to construct regex. Below is an example showing how to use it to play with regular expressions.

```java
VerbalExpression testRegex = VerbalExpression.regex()
  .startOfLine().then("abc").or("def")
  .build();

String testString = "defzzz";

// Use VerbalExpression's test() method to test if parts of the string match the regex
testRegex.test(testString);       // true
testRegex.testExact(testString);  // false
testRegex.getText(testString);    // returns: def
```

## Learn more about regular expressions in Java

Regular expressions aren't exciting, but it's useful to learn how to use them well. They're also a valuable transferable skill that you won't only use in Java. This article showed you how to use regular expressions to define a pattern for searching or manipulating strings in Java. 

You can find the source code used in this example in the [oktadev/java-regex-examples repository on GitHub](https://github.com/oktadev/java-regex-examples).

These resources offer more information about regular expressions and Java:

- [Regular Expressions for Security Professionals](https://sec.okta.com/articles/2020/04/quick-introduction-regular-expressions-security-professionals)
- [Java Regex](https://www.javatpoint.com/java-regex)
- [JavaVerbalExpressions](https://github.com/VerbalExpressions/JavaVerbalExpressions)
- [Quick-Start: Regex Cheat Sheet](https://www.rexegg.com/regex-quickstart.html)
- [OAuth 2.0 Java Guide: Secure Your App in 5 Minutes](/blog/2019/10/30/java-oauth2)

If you have any questions about this post, feel free to comment below. For more relevant and interesting content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, connect with us on [LinkedIn](https://www.linkedin.com/company/oktadev), and subscribe to [our YouTube channel](https://www.youtube.com/oktadev).
