weebchat [![Build Status](https://travis-ci.org/majimboo/weebchat.svg?branch=master)](https://travis-ci.org/majimboo/weebchat)
========

A dynamically distributed telnet chat server.

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
    majid was kicked.
    /quit
    * user has left chat: arif (** this is you)
    BYE
    Connection closed by foreign host.

Architecture
------------

Have a load balancer running and waiting for clients or servers. When you need
more servers just run a new server on another machine and it automatically gets
added to the load balancers server pool, ready to pass new clients to the new
server. No need to restart the balancer.
