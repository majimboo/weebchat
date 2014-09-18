/**
 * Simplest prototype for the task given.
 */
'use strict';

var net = require('net');

var clients = {};
var nicknames = [];
var invalidNicks = ['badword'];
var aRooms = {
  default: { users: {}, archive: [], ops: ['majidarif'] }
};

var commands = {
  help: function(msg, session) {
    if (!session.room) {
      session.write('Commands:\n');
      session.write(' * /rooms        - lists all available rooms.\n');
      session.write(' * /join <room>  - join room of your choice.\n');
      session.write(' * /join #<room> - creates a new room and joins it.\n');
      session.write(' * /quit         - disconnects from the server.\n');
    } else {
      session.write('Commands:\n');
      session.write(' * /rooms                - lists all available rooms.\n');
      session.write(' * /leave                - leaves the current room.\n');
      session.write(' * /quit                 - leaves then disconnects from the server.\n');
      session.write(' * /nick <nickname>      - changes your nickname.\n');
      session.write(' * /me <action>          - an action message.\n');
      session.write(' * /msg <nick> <message> - send a private message to specified nickname.\n');

      // operator commands
      if (aRooms[session.room].ops.indexOf(session.nickname) > -1) {
        session.write('Operator:\n');
        session.write(' * /kick <nickname>      - kicks the user off the room.\n');
      }
    }
  },
  ns: function(msg, session) {
    // validate
    if (!msg.length) {
      session.write('/ns (register|login)\n');
      return;
    }

    var action = msg.shift().toLowerCase();

    switch (action) {
      case 'register':
        var pass  = msg[0];
        var email = msg[1];

        break;
      case 'login':
        var pass = msg[0];

        break;
      default:
        // give info because user is using command incorrectly
        session.write('/ns (register|login) <pass> <email>\n');
    }
  },
  rooms: function(msg, session) {
    // show available room
    session.write('Active rooms are:\n');
    var rooms = Object.keys(aRooms);
    rooms.forEach(function(room) {
      var users = Object.keys(aRooms[room].users);
      session.write(' * ' + room + ' (' + users.length + ')\n');
    });
    session.write('end of list.\n');
  },
  join: function(msg, session) {
    var room = msg[0];

    // validate room name
    if (!(/^(#?)[A-Za-z0-9_\-]{3,16}$/i.test(room))) {
      session.write('Sorry, invalid room name.\n');
      return;
    }

    // this is creating a new channel
    if (room.charCodeAt(0) === 0x23) {
      room = room.substr(1);
      // validate topic
      var existRooms = Object.keys(aRooms);
      if (existRooms.indexOf(room) > -1) {
        session.write('Sorry, room already exists.\n');
        return;
      }

      // successful room creation
      if (!session.room) {
        aRooms[room] = {
          users: {},
          archive: [],
          ops: [session.nickname]
        };
      }
    }

    var selectedRm = aRooms[room];

    // validate command
    if (!!session.room) {
      session.write('Sorry, you must leave before joining another room.\n');
      return;
    }

    // validate room
    if (!selectedRm) {
      session.write('Sorry, invalid room.\n');
      return;
    }

    // add user to room
    session.room = room;
    // this was an array of user objects but it seems to be a bad idea
    // because the server uses the nickname a lot and iterating through
    // each object in the array to find a specific nickname is not ideal.
    selectedRm.users[session.nickname] = {
      nickname: session.nickname,
      address: session.remoteAddress + ':' + session.remotePort
    };

    // show room info
    session.write('Entering room: ' + session.room + '\n');
    var usernicks = Object.keys(selectedRm.users);
    for (var i = 0; i < usernicks.length; i++) {
      var user = selectedRm.users[usernicks[i]];
      if (user.nickname === session.nickname) {
        session.write(' * ' + user.nickname + ' (** this is you)\n');
      } else {
        session.write(' * ' + user.nickname + '\n');
      }
    }
    session.write('end of list.\n');

    // notify members of new user
    var sessions = Object.keys(clients);
    sessions.forEach(function(client) {
      client = clients[client];
      if (client.room === session.room &&
        client.nickname !== session.nickname)
      {
        client.write('* new user joined ' + session.room + ': ' +
          session.nickname + '\n');
      }
    });
  },
  leave: function(msg, session) {
    // notify members of leaving user
    var sessions = Object.keys(clients);
    sessions.forEach(function(client) {
      client = clients[client];
      if (session.room === client.room) {
        if (session.nickname === client.nickname) {
          client.write('* user has left chat: ' + session.nickname +
            ' (** this is you)\n');
        } else {
          client.write('* user has left chat: ' + session.nickname + '\n');
        }
      }
    });

    // remove user from room
    delete aRooms[session.room].users[session.nickname];
    session.room = null;
  },
  quit: function(msg, session) {
    if (!!session.room) {
      commands.leave(msg, session);
    }
    session.end('BYE\n');
    // remove everything about the user
    nicknames.splice(nicknames.indexOf(session.nickname), 1);
  },
  nick: function(msg, session) {
    var newNick = msg[0];

    // give info because user is using command incorrectly
    if (!newNick) {
      session.write('/nick <nickname>\n');
      return;
    }

    // verify new nick
    if (!(/^[A-Za-z0-9_\-]{3,16}$/i.test(newNick)) ||
      nicknames.indexOf(newNick) > -1 ||
      invalidNicks.indexOf(newNick) > -1
      )
    {
      session.write('Sorry, invalid or taken nick.\n');
      session.write('Login Name?\n');
      return;
    }

    // TODO

    session.write('Sorry, this command is not available here.\n');
  },
  me: function(msg, session) {
    var action = msg.join(' ');

    // give info because user is using command incorrectly
    if (!action.length) {
      session.write('/me <action>\n');
      return;
    }

    if (!!session.room) {
      var sessions = Object.keys(clients);
      sessions.forEach(function(client) {
        client = clients[client];
        if (session.room === client.room) {
          client.write(session.nickname + ' ' + action + '\n');
        }
      });
      return;
    }

    session.write('Sorry, this command is not available here.\n');
  },
  msg: function(msg, session) {
    var nickname = msg.shift();
    var message  = msg.join(' ');

    // give info because user is using command incorrectly
    if (!nickname || !message.length) {
      session.write('/msg <nickname> <message>\n');
      return;
    }

    // cannot pm self
    if (nickname === session.nickname) {
      session.write('Sorry, you can not msg yourself.\n');
      return;
    }

    if (!!session.room) {
      // get users in room
      var roomUsers = aRooms[session.room].users;
      if (roomUsers[nickname]) {
        var address = roomUsers[nickname].address;
        clients[address].write(session.nickname + ' says ' + message + '\n');
        return;
      }

      session.write('Sorry, user not found.\n');
      return;
    }

    session.write('Sorry, this command is not available here.\n');
  },
  kick: function(msg, session) {
    var nickname = msg[0];

    // command can only be invoked while in a room
    if (!session.room) {
      session.write('Sorry, this command is not available here.\n');
      return;
    }

    // check if user is operator of room
    if (aRooms[session.room].ops.indexOf(session.nickname) === -1) {
      session.write('Sorry, you do not own this room.\n');
      return;
    }

    // give info because user is using command incorrectly
    if (!nickname) {
      session.write('/kick <nickname>\n');
      return;
    }

    // check if nickname is active in current room
    // kick and remove all data
    if (aRooms[session.room].users[nickname]) {
      // TODO
      return;
    }

    session.write('Sorry, user not found.\n');
  }
}

net.createServer(function(socket) {
  var id = socket.remoteAddress + ':' + socket.remotePort;
  var session = clients[id] = socket;

  // welcome the user
  session.write('Welcome to the simple chat server\n');

  // ask the user name
  session.write('Login Name?\n');

  // incoming data
  session.on('data', function(data) {
    // container
    var container = '';

    // text based protocol
    if (data instanceof Buffer) {
      data = data.toString();
    }

    // stream framing
    data = container + data;
    var lines = data.split(/\r?\n/);
    container = lines.pop();

    lines.forEach(function(line) {
      // clean data
      line = line.replace(/(\r\n|\n|\r)/gm, '');

      // set nickname
      if (!session.nickname) {
        // verify nickname
        if (!(/^[A-Za-z0-9_\-]{3,16}$/i.test(line)) ||
          nicknames.indexOf(line) > -1 ||
          invalidNicks.indexOf(line) > -1)
        {
          session.write('Sorry, invalid or taken name.\n');
          session.write('Login Name?\n');
          return;
        }

        // successfully set name
        session.nickname = line;
        nicknames.push(session.nickname);
        session.write('Welcome ' + session.nickname + '!\n');
        return;
      }

      // commands
      if (/^[\/]/.test(line)) {
        var argv = line.substr(1).split(/[\s,]+/);
        var command = commands[argv[0]];

        // validate command
        if (command) {
          command(argv.slice(1), session);
          return;
        }

        session.write('Sorry, command not valid.\n');
        return;
      }

      // chat
      if (!!session.room) {
        var sessions = Object.keys(clients);
        sessions.forEach(function(client) {
          client = clients[client];
          if (client.room === session.room) {
            client.write(session.nickname + ': ' + line + '\n');
          }
        });
      }
    });

  });

  // ended session
  session.on('end', function() {
    // remove client
    delete clients[id];
  });
}).listen(6000, function() {
  var local = this.address();
  console.log('staged on %s:%s', local.address, local.port);
});
