/**
 * Lobby acts as a load balancer.
 */
'use strict';

var _        = require('lodash');
var kamote   = require('kamote');

var Network = require('../network/manager').init();
var Room    = require('../db/room');

var Log     = require('../utils/log');
var utils   = require('../utils/helpers');

var Inter  = new kamote.Server();

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  // frontend
  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // backend
  Inter.listen(config.inter_port, config.inter_host, function() {
    Log.info('staged on %s:%s', config.inter_host, config.inter_port);
    bootInter();
  });

  roomCleaner();

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('enter', onEnter);
  Network.hookCommand('rooms', onRooms);
  Network.hookCommand('create', onCreate);
  Network.hookCommand('join', onJoin);
  Network.hookCommand('chat', onChat);
}

function bootInter() {
  Inter.add('addToPool', function(info) {
    DB.setPool(info.id, info);
    Log.success('server %s added to pool', info.id);
  });

  Inter.add('sendToRoom', function(roomId, msg) {
    Network.sendToRoom(roomId, msg);
  });

  Inter.add('send', function(sid, msg) {
    Network.send(sid, msg);
  });

  Inter.add('store', function(sid, key, val) {
    var session = Network.sessions.get(sid);
    session.set(key, val);
  });
}

function roomCleaner() {
  // delete all rooms that the loc is not in the Pool
  var rooms = Room.select();

  _.each(rooms, function(room) {
    if (!!room.loc) {
      room.loc = null;
      return Log.success('room [%s] deactived', room.name);
    }
  });
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
    Room.insert(name, { name: name });
    return Log.success('%s has created [%s] room', nick, name);
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
