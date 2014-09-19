/**
 * Lobby acts as a load balancer.
 */
'use strict';

var kamote   = require('kamote');
var mongoose = require('mongoose');

var Network = require('../network/manager').init();
var Room    = require('../models/room');
var Pool    = {};

var Log     = require('../utils/log');
var utils   = require('../utils/helpers');

var Inter  = new kamote.Server();

function mongodb_connect(config) {
  mongoose.connect(config, {
    server: { socketOptions: { keepAlive: 1 }}
  });
  var conn = mongoose.connection;
  // reconnect if lost connection to mongodb
  conn.on('disconnected', function() {
    Log.warn('lost connection to database');
    // recursive retry...
    mongodb_connect(config);
  });
  return conn;
}

function start(config) {
  Log.info('booting in %s', config.env);

  // connect to mongodb
  var mongodb = mongodb_connect(config.db);
  mongodb.on('connected', function() {
    Log.info('database connection established');
  });

  // frontend
  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // backend
  Inter.listen(config.inter_port, config.inter_host, function() {
    Log.info('staged on %s:%s', config.inter_host, config.inter_port);
    bootInter();
  });

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('enter', onEnter);
  Network.hookCommand('rooms', onRooms);
  Network.hookCommand('create', onCreate);
  Network.hookCommand('join', onJoin);
}

function bootInter() {
  Inter.add(function addToPool(info) {
    Pool[info.host + ':' + info.port] = info;
  });

  Inter.add(function sendToRoom(roomId, msg) {
    Network.sendToRoom(roomId, msg);
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

  Room.find(function(err, rooms) {
    if (err) return handleError(sid);

    if (!rooms.length) {
      Network.send(sid, 'There are currently no active rooms.');
      return;
    }

    Network.send(sid, 'Active rooms are:');
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      Network.send(sid, ' * ' + room.name + ' (' + room.users.length + ')');
    }
    Network.send(sid, 'end of list.');
  });
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
  Room.findOne({ name: name }, function(err, room) {
    if (err) return handleError(sid);

    // room isn't taken yet
    if (!room) {
      Room.create({
        name: name,
        users: [],
        archive: [],
        operators: []
      }, function(err, room) {
        if (err) return handleError(sid);
        if (room) {
          Network.send(sid, 'Successfully created.');
          Log.success('%s has created [%s] room', nick, name);
          return;
        }

        // fallback for unexpected behaviour
        Network.send(sid, 'Sorry, something went wrong.');
      });
      return;
    }

    // room already exists
    Network.send(sid, 'Sorry, name taken.');
  });
}

function onJoin(msg, session) {
  var room = msg.room;
  var sid  = session.id;

  // validate params
  if (!room) return Network.send(sid, '/join <room>');

  // validate if room exist
  Room.findOne({ name: room }, function(err, room) {
    if (err) return handleError(sid);

    // room is active
    if (room) {
      // find room server

      return;
    }

    // fallback for unexpected behaviour
    Network.send(sid, 'Sorry, invalid room.');
  });
}

function handleError(sid) {
  Network.send(sid, 'Sorry, an error occured.');
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
