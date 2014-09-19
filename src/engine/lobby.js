/**
 * Lobby acts as a load balancer.
 */
'use strict';

var _      = require('lodash');
var kamote = require('kamote');

var Room   = require('../db/room');
var User   = require('../db/user');
var Server = require('../db/server');

var Network = require('../network/manager').init();
var Log     = require('../utils/log');
var utils   = require('../utils/helpers');

var Lobby = new kamote.Server();

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
  Lobby.add('setAddress', Server.setAddress.bind(Server));
  Lobby.on('connection', Server.add.bind(Server));

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('enter', onEnter);
  Network.hookCommand('rooms', onRooms);
  Network.hookCommand('servers', onServers);
  Network.hookCommand('create', onCreate);
  Network.hookCommand('join', onJoin);
  Network.hookCommand('chat', onChat);
  Network.hookCommand('quit', onQuit);
}

function accept(session) {
  Network.send(session.id, '\nWelcome to the Weeb chat server');
  Network.send(session.id, 'Login Name?');
}

function onEnter(msg, session) {
  var name = msg.name;
  var sid  = session.id;

  // validate name
  var validName = utils.validateName(name);
  var goodName  = true;
  var notTaken  = true;

  if (validName && goodName && notTaken) {
    // set the nickname for the session
    session.setName(name);
    Network.send(sid, 'Welcome ' + session.realname + '!');
    return Log.success('%s has entered the Lobby', session.realname);
  }

  if (!notTaken) {
    return Network.send(sid, 'Sorry, name taken.');
  }

  Network.send(sid, 'Sorry, name is invalid.');
}

function onRooms(msg, session) {
  var sid = session.id;

  if (!session.realname) return notAllowed(sid);

  var rooms = Room.find({ loc: { not: null } });

  if (!!rooms.length) {
    Network.send(sid, 'Active rooms are:');
    _.each(rooms, function(room) {
      Network.send(sid, ' * ' + room.name + ' (' + room.userCount() + ')');
    });
    Network.send(sid, 'end of list.');
    return;
  }

  Network.send(sid, 'There are currently no active rooms.');
}

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

function onCreate(msg, session) {
  var name = msg.name;
  var sid  = session.id;
  var nick = session.realname;

  if (!name) return Network.send(sid, '/create <room>');

  // validate room name
  if (!utils.validateName(name)) {
    return Network.send(sid, 'Sorry, invalid name.');
  }

  // check if room doesn't exist yet
  if (!!Room.select(name)) {
    return Network.send(sid, 'Sorry, name taken.');
  } else {
    var server = Server.pick();

    if (!!server) {
      Room.insert(name, { name: name });
      server.createRoom(name);
      return Log.success('%s has created [%s] room', nick, name);
    }

    Network.send(sid, 'Sorry, no available servers.');
    return Log.warn('%s failed to create [%s] room', nick, name);
  }

  // fallback for unexpected behaviour
  Network.send(sid, 'Sorry, something went wrong.');
}

function onJoin(msg, session) {
  var room = msg.room;
  var sid  = session.id;

  // validate params
  if (!room) return Network.send(sid, '/join <room>');

  // check if room exists
  if (!!Room.select(room)) {
    return;
  }

  // fallback for unexpected behaviour
  Network.send(sid, 'Sorry, invalid room.');
}

function onChat(msg, session) {
  var room = session.get('room');
  var message = msg.msg;

  if (!!room) {
    session._remote.chat(room, message, session);
  }

  Network.send(session.id, 'Sorry, you are not in any room.');
}

function onQuit(msg, session) {
  session.kick();
}

function handleError(sid) {
  Network.send(sid, 'Sorry, an error occured.');
}

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
