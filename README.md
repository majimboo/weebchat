weebchat [![Build Status](https://travis-ci.org/majimboo/weebchat.svg?branch=master)](https://travis-ci.org/majimboo/weebchat)
========

A dynamically distributed telnet chat server. **"Work In Progress"**

Install
-------

    $ git clone git@github.com:majimboo/weebchat.git
    $ cd weebchat
    $ npm install

Usage
-----

Starting the load balancer.

    $ bin/lobby -h

    Usage: lobby [options]

    Options:

      -h, --help           output usage information
      -V, --version        output the version number
      -c, --config [path]  path to config

Starting a server.

    $ bin/weebchat -h

    Usage: weebchat [options]

    Options:

      -h, --help           output usage information
      -V, --version        output the version number
      -c, --config [path]  path to config

Connect
-------

    $ telnet localhost 9399
    Welcome to the Weeb chat server
    Login Name?
    arif
    Welcome arif!
    /create room secretpass
    /join room
    Entering room: room
     * arif (** this is you)
    end of list.
    * new user joined room: majid
    majid: hi there
    /kick majid
    Permission denied.
    /login secretpass
    Successfully authenticated.
    /kick majid
    * user has been kicked from chat: majid
    /quit
    * user has left chat: arif (** this is you)
    BYE
    Connection closed by foreign host.

Architecture
------------

First of all, **Dynamic**, the word itself means always active or changing. Second, **Distributed**, which is one, if not the best way to write a future ready server.  Put them together and you have a server that can scale _horizontally_ in N number of servers.

Why horizontal? Well, this helps you accommodate more users and can save you money because the marginal cost of adding (vertical scaling) one more core or a hard drive that does a few more I/O operations per second grows exponentially. In the long run, the cost of adding one more node to the system becomes far cheaper than the cost of additional hardware.

With those in mind, I decided to write a load balancer called “Lobby” to distribute workloads across multiple servers I call “School”. Initially, the lobby does not know any school. A school introduces itself to the lobby when it comes online thus, making the number of schools dynamic.

A school is a server that can host a limited number of chatrooms depending on admin configuration. Each time a user creates a chatroom the lobby asks each active school for available slots, the first to respond gets to host the new chatroom. Now when a user tries to join a chatroom the lobby should pass the clients connection to the specific school hosting the room freeing itself from the duty of handling the client.

One of the things to consider when developing a server is the client. A lot of the server’s architecture must be complimented by the client’s design. Given this task that restrains me to only use Telnet as a client, I encountered my first major problem: “How do I properly distribute load between schools when I cannot pass the client’s connection from the lobby to a school?”

...to be continued
