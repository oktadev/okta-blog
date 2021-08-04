---
layout: blog_post
title: Getting Started with Libsodium in Python and Go
author: phill-edwards
by: contractor
communities: [python,go]
description: "Tutorial: Learn how to use libsodium to encrypt files in Python and decrypt them in Go!"
tags: [python,go]
tweets:
- "Encrypt your bits with Python 🐍 and libsodium🧂"
- "Learn how to encrypt cross-language with Python and Go, using libsodium🧂"
image: blog/libsodium-encryption-go-python/social.png
type: awareness
---

The Networking and Cryptography library (NaCl pronounced "salt") is a software library that provides the core operations required to build cryptographic tools. Sodium is a fork of NaCl with an extended API; it's portable, and binaries are available to be used by various programming languages and operating systems. It comes in the form of a library called `libsodium`.

Although there are several Python and Go cryptography libraries, it is primarily a matter of personal choice which one to use. One advantage of `libsodium` is that it is available for many languages.

Today, we will use `libsodium` for Python to encrypt messages and decrypt them using `libsodium` in Go. Let's get started!

**NOTE**: You can find the code for this project on [GitHub](https://github.com/oktadev/python-go-libsodium-example.git).

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Prerequisites to Building a Libsodium Application

First, if you don't already have Python on your computer, you'll need to [install a recent version of Python 3](https://www.python.org/downloads/).

Next, create a directory where all of our future code will go:

```bash
mkdir libsodium
cd libsodium
```

To avoid issues running the wrong version of Python and its dependencies, we recommend creating a virtual environment so that the commands `python` and `pip` run the correct versions:

```bash
python3 -m venv .venv
```

This creates a directory called `.venv` containing the Python binaries and dependencies. The new directory should be added to the `.gitignore` file and then activated for use:

```bash
source .venv/bin/activate
```

You can run the following command to see which version you are running:

```bash
python --version
```

Next, install the PyNaCl library:

```bash
pip install pynacl
```

Next, if you haven't already installed Go on your computer you will need to [Download and install - The Go Programming Language](https://golang.org/doc/install).


Finally, make the directory a Go module and install the Go crypto library:

```bash
go mod init crypto
go get golang.org/x/crypto
go mod download golang.org/x/sys
```

## What is Public Key Encryption
Public key or asymmetric encryption requires the generation of two numbers called keys. One key is the private key, which only the owner knows. The second key is public; it is published and widely known.

A message encrypted using the private key can only be decrypted using the public key. Anyone who possesses the public key can decrypt the message. The public key holder knows the message could only have been encrypted by the private key owner.

Conversely, a message encrypted using the public key can only be decrypted using the private key. You can be sure that only one person can view the message. The strength of the encryption depends on how much "effort" it takes to break the math without access to the decryption key.

A secure way of exchanging messages is to use two sets of keys, one for each party involved. Alice wants to send a secret message to Bob and ensure that only Bob can receive it. Bob wants to ensure that only Alice could have sent it. To achieve this, Alice first encrypts the message using her private key, then she encrypts it with Bob's public key.  To recover the original message, Bob decrypts the message with his private key, and then with Alice's public key.

> **NOTE:** The above explanation is simplified slightly. In the example below, Bob's private key and Alice's public key are used to generate an encryption key.  The same key is generated using Alice's private and Bob's public key, [creating a shared key](https://libsodium.gitbook.io/doc/public-key_cryptography/authenticated_encryption#purpose).

The encryption and decryption processes require complex computation. Low-level libraries do exist for doing this, but they are not very convenient to use. Using `libsodium` greatly simplifies the process.

## How to Create Key Pairs with `libsodium`

First, we are going to write a Python program to generate public-private key pairs. Create a script called `generate_keys.py` containing the following code:

```python
import nacl.utils
from nacl.public import PrivateKey
from nacl.encoding import HexEncoder
import sys

def write(name, hex, sp):
    filename = 'key_' + name + '_' + sp 
    file = open(filename, 'wb')
    file.write(hex)
    file.close()

def make_keys(name):
    sk = PrivateKey.generate()
    write(name, sk.encode(encoder=HexEncoder), 'sk')
    pk = sk.public_key
    write(name, pk.encode(encoder=HexEncoder), 'pk')

if len(sys.argv) != 2:
    print("Usage:", sys.argv[0], "name")
    sys.exit()

make_keys(sys.argv[1])
```

The program uses `libsodium` to generate a key pair. It also uses `libsodium` to encode the keys as hexadecimal strings for portability. These hexadecimal key strings are written to files using `write()` function. The `make_keys()` function generates a public-private key pair. The `PrivateKey.generate()` function returns the private key.

Libsodium objects have an `encode()` function to encode the object. In this case, it uses `HexEncoder`. The public key is an attribute on the private key object. The name of the key owner is passed as a command-line argument.

Now run the program to generate keys for Alice and Bob:

```bash
python generate_keys.py alice
python generate_keys.py bob
```

The files `key_alice_sk`, `key_alice_pk`, `key_bob_sk`, and `key_bob_pk` should have been created.

## Encrypt a Message with `libsodium`

The message to be encrypted is a text file containing the poem *Jabberwocky* by Lewis Carroll. The poem itself is somewhat cryptic, as the meaning of the words is open to interpretation! Rather fittingly, Jabberwocky was first published in the book *Through the Looking-Glass, and What Alice Found There*.

Download the Jabberwocky poem to `jabberwocky.txt`:

```bash
curl https://raw.githubusercontent.com/oktadev/libsodium/main/Jabberwocky.txt > Jabberwocky.txt
```

Libsodium makes it very easy to encrypt messages. It uses a `Box` object constructed from your private key and the recipient's public key. The box is then used to encrypt a message. Create a file called `encrypt.py` with the following content:

```python
import nacl.utils
from nacl.public import PrivateKey, PublicKey, Box
from nacl.encoding import HexEncoder
import sys

class EncryptFile :
    def __init__(self, sender, receiver):
        self.sender = sender
        self.receiver = receiver
        self.sk = PrivateKey(self.get_key(sender, 'sk'), encoder=HexEncoder)
        self.pk = PublicKey(self.get_key(receiver, 'pk'), encoder=HexEncoder)

    def get_key(self, name, suffix):
        filename = 'key_' + name + '_' + suffix
        file = open(filename, 'rb')
        data = file.read()
        file.close()
        return data

    def encrypt(self, textfile, encfile):
        box = Box(self.sk, self.pk)
        tfile = open(textfile, 'rb')
        text = tfile.read()
        tfile.close()
        etext = box.encrypt(text)
        efile = open(encfile, 'wb')
        efile.write(etext)
        efile.close()

encrypter = EncryptFile('alice', 'bob')
encrypter.encrypt('Jabberwocky.txt', 'message.enc')
print('Done!')
```

We use the names of the sender and the receiver to construct the  `EncryptFile` class. `EncryptFile` uses the `get_key()` helper function to read the hexadecimal encoded key from a file. Libsodium `PublicKey`and `PrivateKey` objects are constructed from the encoded keys. The `encrypt()` function constructs a `Box` object from the sender's private key and the recipient's public key. Then the message is read from a text file as a byte string and is encrypted by the box. The encrypted message is saved to a file for transmission.

Note that this generates a 24-byte random, one-time-use number called a *nonce* ("Number used ONCE"). The purpose of the nonce is to ensure that if the same message is encrypted more than once, the resulting encrypted message will be different. The nonce forms the first 24 bytes of the encrypted message.

Encrypt the poem by running:

```sh
python encrypt.py
```

## Decrypt a Message with Go and `libsodium`

We are going to write a simple Go program that can decrypt a message. Create a file named `decrypt.go` with the following content:

```go
package main

import (
	"encoding/hex"
	"fmt"
	"io/ioutil"

	"golang.org/x/crypto/nacl/box"
)

var PublicKey [32]byte
var SecretKey [32]byte

func GetKeys() {
	sk, _ := ioutil.ReadFile("key_bob_sk")
	keysk, _ := hex.DecodeString(string(sk))
	copy(SecretKey[:], keysk)
	pk, _ := ioutil.ReadFile("key_alice_pk")
	keypk, _ := hex.DecodeString(string(pk))
	copy(PublicKey[:], keypk)
}

func Decrypt() {
	enc, _ := ioutil.ReadFile("message.enc")
	var nonce [24]byte
	copy(nonce[:], enc[:24])
	crypto := enc[24:]
	message, _ := box.Open(nil, crypto, &nonce, &PublicKey, &SecretKey)
	fmt.Println(string(message))
}

func main() {
	GetKeys()
	Decrypt()
}
```

Go is a strongly typed language, so we have to create 32-byte arrays to store the keys. The `GetKeys()` function reads Bob's private key and Alice's public key for the files. They are converted from hexadecimal strings into byte arrays and copied into the fixed-length arrays. The `Decrypt` function reads the encrypted message into a byte array. The nonce needs to be separated from the encrypted message and copied into a 24-byte array. The `box.Open()` function performs the decryption and then prints the decrypted message.

Run the application to see the poem Jabberwocky restored:

```bash
go run decrypt.go
```

## What is Secret Key Encryption

Secret key encryption uses a single key to both encrypt and decrypt a message. It is commonly used as a faster alternative to public-key encryption. The key itself is a fixed-length random number. As there is only a single key, both the sender and recipient need a copy of it. This requires a key exchange which is often performed out of band or by using public-key encryption.

## Encrypt a Message with `libsodium` and Secret Key

We will again encrypt the poem Jabberwocky, but this time using secret key encryption. For convenience, we will again generate and store the key in a file:

```sh
gpg --gen-random 2 32 > key_secret
```

> **NOTE:** Secure key exchange must be used between parties holding any shared secret.

Create a file called `encrypt_shared.py` with the following content:

```python
import nacl.utils
from nacl.public import PrivateKey, PublicKey, Box
from nacl.encoding import HexEncoder
from nacl.secret import SecretBox
import sys

class Encrypter :
    def __init__(self):
        file = open('key_secret', 'rb')
        self.key = file.read()
        file.close()

    def encrypt(self, textfile, encfile):
        box = SecretBox(self.key)
        tfile = open(textfile, 'rb')
        text = tfile.read()
        tfile.close()
        etext = box.encrypt(text)
        efile = open(encfile, 'wb')
        efile.write(etext)
        efile.close()

encrypter = Encrypter()
encrypter.encrypt('Jabberwocky.txt', 'message.sec')
print('Done!')
```

This time the constructor creates a random secret key and stores it in a file. The `encrypt()` function uses a `SecretBox` to encrypt the message. Once again a 24-byte nonce is automatically created and prepended to the encrypted message.

Run the script to create the key and encrypted message files:

```python
python encrypt_shared.py
```

## Decrypt a Message with `libsodium` and Secret Key

The Go code for decryption is quite simple. Create a file called `decryptsec.go` containing the following code:

```go
package main

import (
	"fmt"
	"io/ioutil"

	"golang.org/x/crypto/nacl/secretbox"
)

var SecretKey [32]byte

func GetKey() {
	sk, _ := ioutil.ReadFile("key_secret")
	copy(SecretKey[:], sk)
}

func Decrypt() {
	enc, _ := ioutil.ReadFile("message.sec")
	var nonce [24]byte
	copy(nonce[:], enc[:24])
	crypto := enc[24:]
	message, _ := secretbox.Open(nil, crypto, &nonce, &SecretKey)
	fmt.Println(string(message))
}

func main() {
	GetKey()
	Decrypt()
}
```

In this case, only the secret key is extracted from the file using the `GetKey()` function. The program reads the encrypted message from a file and extracts the nonce. Finally, the function `secretbox.Open()` decrypts the message using the nonce and the secret key.

Run the program to see the Jabberwocky poem restored:

```bash
go run decryptsec.go
```

## Learn more about Python, Go, and `libsodium`

NaCl, Libsodium, and the language-specific wrappers around them simplify the process of encrypting and decrypting messages. Most cryptographic libraries provide low-level operations that are complex to use. The box mechanism performs encryption and decryption in a single function call. All you need is the data, the key or keys, and a nonce.
If you enjoyed this post, check out these related ones on our blog.

- [Offline JWT Validation with Go](/blog/2021/01/04/offline-jwt-validation-with-go)
- [Build and Secure an API in Python with FastAPI](/blog/2020/12/17/build-and-secure-an-api-in-python-with-fastapi)

Follow us for more great content and updates from our team! You can find us on [Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) or start the conversation below.
