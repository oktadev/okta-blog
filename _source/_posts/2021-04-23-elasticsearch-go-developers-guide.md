---
disqus_thread_id: 8489740287
discourse_topic_id: 17368
discourse_comment_url: https://devforum.okta.com/t/17368
layout: blog_post
title: "Elasticsearch in Go: A Developer's Guide"
author: phill-edwards
by: contractor
communities: [go]
description: "How to get started with Elasticsearch in Go"
tags: [go, elasticsearch]
tweets:
- "Have you used Elasticsearch in Go yet? Learn how with this post"
- "Get up to speed with Elasticsearch and Go with this easy tutorial"
- "Learn how to quickly search through data in Go and Elasticsearch"
image: blog/elasticsearch-go/social-image.png
type: awareness
---

Elasticsearch is a popular datastore for all types of information. It is distributed for speed and scalability and can index many types of content which makes it highly searchable. It uses simple REST APIs for ease of access.

Go has an official Elasticsearch library which makes it simple for Go developers to work with data stored in Elasticsearch programmatically.

Today we're going to take a look at how you can easily build a simple app that allows data to be added and searched in Elasticsearch using Go. Let's get started!

**PS**: The code for this project can be found on [GitHub](https://github.com/oktadeveloper/go-elasticsearch-example)

## Prerequisites to Writing an Elasticsearch Application in Go

First things first, if you haven't already got Go installed on your computer you will need to [Download and install - The Go Programming Language](https://golang.org/doc/install).

A Go workspace is required. This is a directory in which all Go libraries live. It is usually `~/go`, but can be any directory as long as the environment variable `GOPATH` points to it.

Next, create a directory where all our future code will live.

```bash
mkdir go-elasticsearch-example
cd go-elasticsearch-example
```

Then, make the directory a Go module and install the Go Elasticsearch library.

```bash
go mod init go-elasticsearch-example
go get github.com/elastic/go-elasticsearch/v8
```

A file called `go.mod` should have been created containing the dependency that you installed with `go get`.

After this, we need to install Elasticsearch. A convenient way of doing this is to use a Docker image containing an already configured Elasticsearch. If you haven't already got Docker on your machine [Install Docker Engine](https://docs.docker.com/engine/install/).

We then need to pull an Elasticsearch Docker image. This will take some time to download.

```bash
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.5.2
```

Now we need to create a Docker volume so that Elasticsearch data doesn't get lost when a container exits:

```bash
docker volume create elasticsearch
```

The Docker command line to run an Elasticsearch container is quite long, so we will create a script called `run-elastic.sh` to run the Docker command for us:

```bash
#! /bin/bash

docker rm -f elasticsearch
docker run -d --name elasticsearch -p 9200:9200 -e discovery.type=single-node \
    -v elasticsearch:/usr/share/elasticsearch/data \
    docker.elastic.co/elasticsearch/elasticsearch:7.5.2
docker ps
```

The script needs to be made executable and then run.

```bash
chmod +x run-elastic.sh
./run-elastic.sh
```

Finally, verify that Elasticsearch is running:

```bash
curl http://localhost:9200
```

You should see a JSON object containing details of the server.

## How to Find and Understand How to Handle Data in Go

We need a fairly large set of data to load into Elasticsearch. This web site [STAPI, a Star Trek API](http://stapi.io) contains huge amounts of data from the Star Trek universe. We will use the spacecraft data as our dataset for this application. It is always a good idea to know what the data looks like. Enter the URL http://stapi.co/api/v1/rest/spacecraft/search?pageNumber=0&pageSize=100&pretty into a web browser. You should see a JSON object containing page information and a list of spacecraft information. There are over 1200 spacecraft in total.
**PS:** Bookmark this link or keep the page open for future reference.

### A brief introduction to data types in Go

If you're new to Go, this section covers topics that will be helpful to understand before you move forward. If you're already familiar with Go, you can skip ahead to the next section.

The STAPI site and the results of Elasticsearch searches are sent to clients as JSON objects. The Go APIs receive JSON objects like maps and lists. Map and list values can be of type `nil`, `int`, `float`, `string`, `list`, and `map`. Go is a compiled language and it is also strongly typed. Map keys are always strings. The values of any map or list can be a mixture of types, so the values of a map or list can't be given an explicit type in the code.

Go allows maps and lists to have values of any type by declaring the type as an interface:

```go
var vessels []interface{}
var craft map[string]interface{}
```

This leads to another issue. It is impossible for the compiler to determine what the actual type of the value is. This can only be determined at runtime, making it important to know what the data structure is. If you know the type, you can use a type assertion that tells the compiler what the actual type is. In our example, `vessels` is a list of maps and `craft` is a map containing a number of attributes including a name which is a string.

The type assertions become:

```go
craft0, err := vessels[0].(map[string]interface{})
name, err := craft["name"].(string)
```

If the type assertion agrees with the actual type the `err` will be `nil`. You can omit the `err` return value, but if the type assertion fails then an exception will be thrown. Multiple type assertions can be used in the same expression:

```go
name := vessels[0].(map[string]interface[])["name"].(string)
```

Finally, if you don't know the actual type of an interface value, then you can use `reflect` to find it out:

```go
print(reflect.TypeOf(vessels[0]))
```

## How to Access Elasticsearch from Go

First of all, we will write a simple Go program that connects to Elasticsearch and prints out server information. Create a file called `simple.go` containing:

```go
package main

import (
    "github.com/elastic/go-elasticsearch/v8"
    "log"
)

func main() {
    es, err := elasticsearch.NewDefaultClient()
    if err != nil {
   	 log.Fatalf("Error creating the client: %s", err)
    }
    log.Println(elasticsearch.Version)

    res, err := es.Info()
    if err != nil {
   	 log.Fatalf("Error getting response: %s", err)
    }
    defer res.Body.Close()
    log.Println(res)
}
```

The program should be self-explanatory.

Now run the program.

```bash
go run simple.go
```

You should see the server information displayed in JSON format.

## How to Build a Console Menu in Go

We are going to build a user interface in the form of a simple console-based menu-driven application. Create a file called `Elastic.go` containing the following Go code:

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func Exit() {
	fmt.Println("Goodbye!")
	os.Exit(0)
}

func ReadText(reader *bufio.Scanner, prompt string) string {
	fmt.Print(prompt + ": ")
	reader.Scan()
	return reader.Text()
}

func main() {
	reader := bufio.NewScanner(os.Stdin)
	for {
        fmt.Println("0) Exit")
        option := ReadText(reader, "Enter option")
        if option == "0" {
			Exit()
		} else {
			fmt.Println("Invalid option")
		}
	}
}
```

Let's see what this code does. The function `Exit()` prints out a message and terminates the program.

The function `ReadText` is a helper function that encapsulates the three lines of Go code required to print out a prompt and read a line of text from the keyboard.

The main function first creates a scanner object which reads from standard input. It then enters an infinite loop as we don't know how many times the loop needs to execute. The menu options are printed out and then an option string is read from the keyboard. Finally, either the `Exit()` function is called or an error message is displayed.

Now, run the program and try entering a few options.

```bash
go run Elastic.go
```

You should only see one option: "0) Exit"

Exit from the program by pressing "0" and hitting the "Enter" key.

## How to Read Data from STAPI and Store it in Elasticsearch from Go

We are going to add a menu item to load the data from STAPI and store it in Elastic search.

First of all, we need to make some changes to `Elastic.go`. We need an import statement and create an instance of the Elasticsearch client.

```go
import (
    "bufio"
    "fmt"
    "os"
    "github.com/elastic/go-elasticsearch/v8"
)

var es, _ = elasticsearch.NewDefaultClient()
```

Next, add another menu item to load the data:

```go
func main() {
    reader := bufio.NewScanner(os.Stdin)
    for {
        fmt.Println("0) Exit")
        fmt.Println("1) Load spacecraft")
        fmt.Println("2) Get spacecraft")
        option := ReadText(reader, "Enter option")
        if option == "0" {
            Exit()
        } else if option == "1" {
            LoadData()
        } else {
            fmt.Println("Invalid option")
        }
    }
}
```

The code isn't ready to run yet. We still need to write the `LoadData()` function. For that function, we are going to read all of the spacecraft data from the STAPI site. The site only allows up to 100 entries to be read at once, so the data is spread over 13 pages. This means that we need to read each page in turn. Create a file called `LoadData.go` containing the following Go code:

```go
package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

	"github.com/elastic/go-elasticsearch/esapi"
)

func LoadData() {
	var spacecrafts []map[string]interface{}
	pageNumber := 0
	for {
		response, _ := http.Get("http://stapi.co/api/v1/rest/spacecraft/search?pageSize=100&pageNumber=" + strconv.Itoa(pageNumber))
		body, _ := ioutil.ReadAll(response.Body)
		defer response.Body.Close()
		var result map[string]interface{}
		json.Unmarshal(body, &result)

		page := result["page"].(map[string]interface{})
		totalPages := int(page["totalPages"].(float64))

		crafts := result["spacecrafts"].([]interface{})

		for _, craftInterface := range crafts {
			craft := craftInterface.(map[string]interface{})
			spacecrafts = append(spacecrafts, craft)
		}

		pageNumber++
		if pageNumber >= totalPages {
			break
		}
	}

	for _, data := range spacecrafts {
		uid, _ := data["uid"].(string)
		jsonString, _ := json.Marshal(data)
		request := esapi.IndexRequest{Index: "stsc", DocumentID: uid, Body: strings.NewReader(string(jsonString))}
		request.Do(context.Background(), es)
	}
	print(len(spacecrafts), " spacecraft read\n")
}
```

So, what does this code do?

First of all, it creates a variable named `spacecrafts` containing an empty list of maps. Map entries have string keys and the values can be of any type. It also declares a page number that starts from zero.

Next, we have an infinite loop to fetch the pages of data. We will terminate the loop when the last page has been read.

Then, the Go `http` API to fetches a page of data from STAPI, specifying the page number to fetch. The response body is then read, and the body is closed to free up resources. The response body is a JSON object which is unmarshaled into a Go map called `result`.

The `result` map has two entries, a map called `page`, and a list of spacecraft information called `spacecrafts`. The page map contains information about the current page. We are only interested in the total number of pages so we extract that information into a variable named `totalPages`. Next, the code iterates over the spacecraft list and uses type assertion to type each entry as a map. The entry is then appended to the list of spacecraft maps.

It then increments the page number and if it is the last page terminates the infinite loop using `break`.

We now have a list containing all of the spacecraft, each entry being a map containing data about the spacecraft.

Now it is time to store the data in Elasticsearch. Data is inserted in Elasticsearch by creating a map of type `esapi.IndexRequest()`. Data items in Elasticsearch are called documents and Elasticsearch stores documents in a collection called an index. Each document needs to be given a unique identifier within the index so we use the spacecraft `uid` as the unique index. For the body of the document we marshal the data for the spacecraft into JSON and use that. The actual insert operation is performed by calling the `Do()` function, passing it a Go context and the Elastic search client.

Now, run the program and select the menu item to load the data. As the code is now in two files, both need to be specified to run the program.

```bash
go run Elastic.go LoadData.go
```

You can now verify that there is some data in the `stsc` index by pointing a web browser at (http://localhost:9200/stsc/_search)[http://localhost:9200/stsc/_search]. Some, but not all of the data should be displayed.

## How to Get a Document out of Elasticsearch from Go

Loading documents into Elasticsearch was quite complex due to the data conversions that were required. Getting and searching for documents is much simpler.

The changes that we'll be making require some new imports, so let's start by updating our import statement:

```go
import (
    "bufio"
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "os"

    "github.com/elastic/go-elasticsearch/esapi"
    "github.com/elastic/go-elasticsearch/v8"
)
```

Elasticsearch returns documents in the form of a JSON object containing metadata and the document content. This is not very readable. We will add a function called `Print()` to `Elastic.go` which prints out some of the spacecraft information in a more readable form.

```go
func Print(spacecraft map[string]interface{}) {
	name := spacecraft["name"]
	status := ""
	if spacecraft["status"] != nil {

		status = "- " + spacecraft["status"].(string)
	}
	registry := ""
	if spacecraft["registry"] != nil {

		registry = "- " + spacecraft["registry"].(string)
	}
	class := ""
	if spacecraft["spacecraftClass"] != nil {

		class = "- " + spacecraft["spacecraftClass"].(map[string]interface{})["name"].(string)
	}
	fmt.Println(name, registry, class, status)
}
```

The function takes account of the fact that some of the fields can be `nil` and that type assertions are required.

Documents can be requested by specifying the index and the document identifier. Let's add another menu item to `Elastic.go` to get a spacecraft. The menu calls a function called `Get()` passing it to the reader. Next, add the function:

```go
func Get(reader *bufio.Scanner) {
	id := ReadText(reader, "Enter spacecraft ID")
	request := esapi.GetRequest{Index: "stsc", DocumentID: id}
	response, _ := request.Do(context.Background(), es)
	var results map[string]interface{}
	json.NewDecoder(response.Body).Decode(&results)
	Print(results["_source"].(map[string]interface{}))
}
```

The document is returned in a JSON object which is decoded into a map. The actual document is in the map entry `_source`.

## How to Search for Documents in Go

Elasticsearch supports a number of different types of searches. Each search has a query type and a list of key, value pairs of fields to match. The result is a list of hits, each given a value indicating how good the match was. A match search looks for work matches. The search values should always be in lowercase. A name match for `uss` would match all spacecraft with the word `uss` in the name in any case including `USS`. A prefix search matches any word which starts with the specified string.

Now, we will add searches to `Elastic.go`. First of all, let's update the `main()` function to add searches to the menu.

```go
func main() {
	reader := bufio.NewScanner(os.Stdin)
	for {
		fmt.Println("0) Exit")
		fmt.Println("1) Load spacecraft")
		fmt.Println("2) Get spacecraft")
		fmt.Println("3) Search spacecraft by key and value")
		fmt.Println("4) Search spacecraft by key and prefix")
		option := ReadText(reader, "Enter option")
		if option == "0" {
			Exit()
		} else if option == "1" {
			LoadData()
		} else if option == "2" {
			Get(reader)
		} else if option == "3" {
			Search(reader, "match")
		} else if option == "4" {
			Search(reader, "prefix")
		} else {
			fmt.Println("Invalid option")
		}
	}
}
```

Note that the new `Search()` function takes the search type as a parameter.

Next, add the search function.

```go
func Search(reader *bufio.Scanner, querytype string) {
	key := ReadText(reader, "Enter key")
	value := ReadText(reader, "Enter value")
	var buffer bytes.Buffer
	query := map[string]interface{}{
		"query": map[string]interface{}{
			querytype: map[string]interface{}{
				key: value,
			},
		},
	}
	json.NewEncoder(&buffer).Encode(query)
	response, _ := es.Search(es.Search.WithIndex("stsc"), es.Search.WithBody(&buffer))
	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)
	for _, hit := range result["hits"].(map[string]interface{})["hits"].([]interface{}) {
		craft := hit.(map[string]interface{})["_source"].(map[string]interface{})
		Print(craft)
	}
}
```

After obtaining the key and value from the user, the function constructs a data structure from the query type, the key, and the value. This then gets encoded as a JSON object. The `es.Search()` function is called with the index name and the query as a body. This returns a list of hits. These are iterated over and the source object is printed.

Run the program and try some match and prefix searches. For example:

For option 3 ("Search spacecraft by key and value") try:
Enter key: `name`
Enter value: `enterprise`

For option 4 ("Search by spacecraft key and prefix") try:
Enter key: `registry`
Enter value: `ncc`

or:

Enter key: `name`
Enter value: `iks`


## Conclusion

Elasticsearch can store many types of data in documents. Each document resides in a collection called an index. Each document also has an identifier that is unique in the index. Elasticsearch has a comprehensive REST API.

Go has a library that is an API on top of the Elasticsearch REST API. It makes inserting, getting, and searching for documents very easy for a Go developer. The only real complexity is handling maps and lists with different value data types. Once the Go interfaces and type assertions are understood, the complexity is resolved.

If you enjoyed reading this post, you might also like these posts from our blog:

- [Get Started with the ELK Stack](/blog/2019/09/26/get-started-elk-stack)
- [NoSQL Options for Java Developers](/blog/2017/09/08/nosql-options-for-java-developers)
- [Build a Single-Page App with Go and Vue](/blog/2018/10/23/build-a-single-page-app-with-go-and-vue)

As always, if you have any questions please comment below. Never miss out on any of our awesome content by following us on [Twitter](https://twitter.com/oktadev) and subscribing to our channel on [YouTube](https://www.youtube.com/c/oktadev)!
