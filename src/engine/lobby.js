/**
 * Lobby acts as a load balancer.
 */
'use strict';

var kamote   = require('kamote');
var mongoose = require('mongoose');

var Network = require('../network/manager').init();
var Log     = require('../utils/log');
var Room    = require('../models/room');
var utils   = require('../utils/helpers');

var Inter = new kamote.Server();

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
    Log.info('successfully established database connection');
  });

  // frontend
  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // backend
  Inter.listen(config.inter_port, config.inter_host, function() {
    Log.info('staged on %s:%s', config.inter_host, config.inter_port);
  });

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('enter', onEnter);
  Network.hookCommand('rooms', onRooms);
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
    return Network.send(sid, 'Welcome ' + session.realname + '!');
  }

  if (!notTaken) {
    return Network.send(sid, 'Sorry, name taken.');
  }

  Network.send(sid, 'Sorry, name is invalid.');
}

function onRooms(msg, session) {
  var sid = session.id;

  Room.find(function(err, rooms) {
    if (err) return Network.send(sid, 'Sorry, an error occured.');

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

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
