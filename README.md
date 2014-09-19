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

Architecture
------------

Have a load balancer running and waiting for clients or servers. When you need
more servers just run a new server on another machine and it automatically gets
added to the load balancers server pool, ready to pass new clients to the new
server. No need to restart the balancer.
