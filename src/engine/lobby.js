/**
 * Lobby acts as a load balancer.
 */
'use strict';

var _      = require('lodash');

var User   = require('../db/user');
var Server = require('../db/server');

var Network = require('../network/manager').init();
var RPC     = require('../network/remote');
var Log     = require('../utils/log');
var utils   = require('../utils/helpers');

var Lobby  = new RPC.Server();
var MANUAL = utils.loadManual();

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  // frontend
  Network.listen(config.port, config.host, Network.listen_callback);

  // backend
  Lobby.listen(config.inter_port, config.inter_host, Network.listen_callback);
  Lobby.def({
    send: Network.send.bind(Network),
    sendToRoom: Network.sendToRoom.bind(Network),
    setAddress: Server.setAddress.bind(Server)
  });
  Lobby.on('connection', Server.add.bind(Server));

  Network.on('new client', onNewClient);

  // hooks
  Network.hookCommand('help', onHelp);
  Network.hookCommand('enter', onEnter);
  Network.hookCommand('rooms', onRooms);
  Network.hookCommand('servers', onServers);
  Network.hookCommand('create', onCreate);
  Network.hookCommand('join', onJoin);
  Network.hookCommand('chat', onChat);
  Network.hookCommand('me', onChatAction);
  Network.hookCommand('msg', onPrivateMsg);
  Network.hookCommand('leave', onLeave);
  Network.hookCommand('quit', onQuit);
}

/**
 * [onNewClient description]
 *
 * @param  {Object} session - User session that sent the request.
 */
function onNewClient(session) {
  Network.send(session.id, '\u001B[2J\u001B[fWelcome to the Weeb chat server');
  Network.send(session.id, 'Login Name?');
}

/**
 * [onHelp description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onHelp(msg, session) {
  var sid = session.id;
  Network.send(sid, MANUAL);
}

/**
 * [onEnter description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onEnter(msg, session) {
  var name = msg.name;
  var sid  = session.id;

  // validate name
  var validName = utils.validateName(name);
  var goodName  = true;
  var notTaken  = User.isNotTaken(name);

  if (validName && goodName && notTaken) {
    // set the nickname for the session
    session.setName(name);
    User.insert(name, session);
    Network.send(sid, 'Welcome ' + session.realname + '!');
    return Log.success('%s has entered the Lobby', session.realname);
  }

  if (!notTaken)
    Network.send(sid, 'Sorry, name taken.');
  else
    Network.send(sid, 'Sorry, name is invalid.');

  Network.send(session.id, 'Login Name?');
}

/**
 * [onRooms description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onRooms(msg, session) {
  var sid = session.id;

  if (!session.realname) return notAllowed(sid);

  Server.findRooms(function(rooms) {
    if (!!rooms && !!rooms.length) {
      Network.send(sid, 'Active rooms are:');
      _.each(rooms, function(room) {
        var userCount = '(' + _.keys(room.users).length + ')';
        Network.send(sid, ' * ' + room.name + ' ' + userCount);
      });
      Network.send(sid, 'end of list.');
      return;
    }

    Network.send(sid, 'There are currently no active rooms.');
  });
}

/**
 * [onServers description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onServers(msg, session) {
  var sid = session.id;

  if (session.realname !== 'admin') {
    Network.send(sid, 'Permission denied.');
    return;
  }

  if (!!Server.count()) {
    var servers = Server.select();
    Network.send(sid, 'Active servers are:');
    _.each(servers, function(sv) {
      Network.send(sid, ' * ' + sv.getName() + ' (' + sv.roomCount() + ')');
    });
    Network.send(sid, 'end of list.');
    return;
  }

  Network.send(sid, 'There are currently no active servers.');
}

/**
 * [onCreate description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onCreate(msg, session) {
  var name = msg.name;
  var sid  = session.id;
  var nick = session.realname;

  // validate params
  if (!name) return Network.send(sid, '/create <room>');

  // validate room name
  if (!utils.validateName(name)) {
    return Network.send(sid, 'Sorry, invalid name.');
  }

  Server.findRoom(name, function(result) {
    var room = result.room;
    // check if room doesn't exist yet
    if (room) {
      return Network.send(sid, 'Sorry, name taken.');
    } else {
      Server.pick(function(server) {
        if (!server) {
          Network.send(sid, 'Sorry, no available servers.');
          return Log.warn('%s failed to create [%s] room', nick, name);
        }

        server.createRoom(name, function(done) {
          if (done) {
            return Log.success('%s has created [%s] room', nick, name);
          }
        });
      });
    }
  });
}

/**
 * [onJoin description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onJoin(msg, session) {
  var room = msg.room;
  var sid  = session.id;

  // validate params
  if (!room) return Network.send(sid, '/join <room>');

  // cannot join while in room
  if (session.getRoom()) {
    Network.send(sid, 'Sorry, you must leave before joining another room.');
    return;
  }

  Server.findRoom(room, function(result) {
    var room = result.room;
    var server = result.server;

    // if a server is given then the room exists
    if (server) {
      server.joinRoom(room, session);

      session.setRoom(room);
      session.setRemote(server.remote);
      return;
    }

    // fallback for unexpected behaviour
    Network.send(sid, 'Sorry, no server is hosting such room.');
  });
}

/**
 * [onChat description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onChat(msg, session) {
  var room = session.getRoom();
  var message = msg.msg;

  if (room) return session.getRemote().chat(room, message, session);

  Network.send(session.id, 'Sorry, you are not in any room.');
}

/**
 * [onChatAction description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onChatAction(msg, session) {
  var message = msg.msg;
  var sid = session.id;
  var room = session.getRoom();

  // validate params
  if (!message.length) return Network.send(sid, '/me <message>');

  if (room) return session.getRemote().chatAction(room, message, session);

  Network.send(session.id, 'Sorry, you are not in any room.');
}

/**
 * [onPrivateMsg description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onPrivateMsg(msg, session) {

}

/**
 * [onLeave description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onLeave(msg, session, callback) {
  var room = session.getRoom();

  if (!room) {
    return Network.send(session.id, 'You are not in any room.');
  }

  session.getRemote().leaveRoom(room, session, function() {
    session.setRoom(null);
    if (callback) callback();
  });
}

/**
 * [onQuit description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
function onQuit(msg, session) {
  var room = session.getRoom();

  // if in room, leave first before quiting
  if (!room) {
    return session.kick('BYE');
  }

  onLeave(msg, session, function() {
    session.kick('BYE');
  });
}

/**
 * [handleError description]
 *
 * @param  {String} sid - Session ID.
 */
function handleError(sid) {
  Network.send(sid, 'Sorry, an error occured.');
}

/**
 * [notAllowed description]
 *
 * @param  {String} sid - Session ID.
 */
function notAllowed(sid) {
  Network.send(sid, 'Sorry, request not available here.');
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
