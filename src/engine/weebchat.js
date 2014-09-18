#!/usr/bin/env node
'use strict';

var mongoose = require('mongoose');

var Network = require('../network/manager').init();
var Log     = require('../utils/log');
var Room    = require('../models/room');

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

/**
 * Starts the engine.
 *
 * @param  {String} host - Host to bind to.
 * @param  {Number} port - Port to bind to.
 * @param  {String} env  - Environment to run in.
 */
function start(config) {
  var host = config.host;
  var port = config.port;
  var env  = config.env;

  Log.info('booting in %s', env);

  // connect to mongodb
  var mongodb = mongodb_connect('mongodb://localhost/qchat_test');
  mongodb.on('connected', function() {
    Log.info('successfully established database connection');
  });

  Network.listen(port, host, function listen_callback() {
    Log.info('staged on %s:%s', host, port);
  });

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('connect', onConnect);
  Network.hookCommand('rooms', onRooms);
}

function accept(session) {
  Network.send(session.id, '\nWelcome to the Weeb chat server');
  Network.send(session.id, 'Login Name?');
}

function onConnect(msg, session) {
  // set the nickname for the session
  session.setName(msg.name);
  Network.send(session.id, 'Welcome ' + session.realname + '!');
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
