weebchat [![Build Status](https://travis-ci.org/majimboo/weebchat.svg?branch=master)](https://travis-ci.org/majimboo/weebchat)
========

A dynamically distributed telnet chat server. **"Work In Progress"**

Features
--------

- Kicks clients that does not specify a name within 9 seconds.
- Detects connection flooding.
- Limits every message to 100 characters. Avoiding a few more exploits.
- Private messaging to users in the same room.
- Authority levels. Allowing operators to kick users.
- Distributes rooms across servers.
- Strict and stable.

Commands
--------

- /help                      - shows this message.
- /quit                      - disconnects from the server.
- /rooms                     - shows all the active rooms.
- /enter <nickname>          - joins the server as nickname.
- /create <room> <password>  - creates a new room with a password.
- /join <room>               - joins the specified room.
- /chat <message>            - broadcasts message to everyone in room.
- /leave                     - leaves the chatroom.
- /login <password>          - be an operator of the room.
- /me <action>               - broadcast an action.
- /msg <nickname> <message>  - sends a private message to specified nickname.
- /poke <nickname>           - poke another user in chatroom.
- /kick <nickname>           - kicks the nickname off the chatroom.

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

TODO
----

- `/goto <nickname>`. Goes to the room where the user currently is.
- `/whois <nickname>`. Shows the user's information.
- `/announce <message>`. Broadcasts a message to users. Admin ONLY.
- Discard commands like CTRL+C.
- Cross server or room communication.
- Do not allow chat with empty messages.
- Stricter arity checking.
- Refactor src/db.
- Better logging.
- More informative replies on commands.
