weebchat [![Build Status](https://travis-ci.org/majimboo/weebchat.svg?branch=master)](https://travis-ci.org/majimboo/weebchat)
========

A dynamically distributed telnet chat server. **"Work In Progress"**

Demo
----

    $ telnet majidarif.com 9399

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

    $ bin/school -h

    Usage: school [options]

    Options:

      -h, --help           output usage information
      -V, --version        output the version number
      -c, --config [path]  path to config

Connect
-------

    $ telnet localhost 9399
    <= Welcome to the Weeb chat server
    <= Login Name?
    => arif
    <= Welcome arif!
    => /create room secretpass
    => /join room
    <= Entering room: room
    <=  * arif (** this is you)
    <= end of list.
    <= * new user joined room: majid
    <= majid: hi there
    => /kick majid
    <= Permission denied.
    => /login secretpass
    <= Successfully authenticated.
    => /kick majid
    <= * user has been kicked from chat: majid
    => /quit
    <= * user has left chat: arif (** this is you)
    <= BYE
    Connection closed by foreign host.
