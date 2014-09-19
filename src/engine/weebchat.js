'use strict';

var _        = require('lodash');
var kamote   = require('kamote');
var mongoose = require('mongoose');

var Network = new kamote.Server();
var Remote  = new kamote.Client();

var Log     = require('../utils/log');
var Room    = require('../models/room');
var Rooms   = {};

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
 * @param  {Object} config - configs.
 */
function start(config) {
  var host = config.host;
  var port = config.port;
  var env  = config.env;

  Log.info('booting in %s', env);

  // connect to mongodb
  var mongodb = mongodb_connect('mongodb://localhost/qchat_test');
  mongodb.on('connected', function() {
    Log.info('database connection established');
  });

  Network.listen(port, host, function listen_callback() {
    Log.info('staged on %s:%s', host, port);
  });

  // connect to RPC server
  Remote.reconnect(config.inter_port, config.inter_port);
  Remote.on('connect', function() {
    Log.info('lobby connection established');
  });
  Remote.on('disconnect', function() {
    Log.warn('lobby connection lost');
  });
  Remote.on('ready', function() {
    bootNetwork(config);
  });
}

function bootNetwork(config) {
  // preload some rooms
  Room
  .find({ loc: null })
  .limit(config.max_rooms)
  .exec(function(err, rooms) {
    if (err) return Log.warn(err);

    _.each(rooms, function(room) {
      makeRoom(config.id, room);
    });

    // start remote
    bootRemote(config);
  });

  Network.add(join);
  Network.add(makeRoom);
  Network.add(chat);
}

function bootRemote(config) {
  Remote.addToPool({
    id: config.id,
    address: config.host + ':' + config.port,
    host: config.host,
    port: config.port,
    rooms: Rooms,
    max_rooms: config.max_rooms
  });
}

function join(room, session) {
  var sid = session.id;
  room = Rooms[room.name];

  Remote.store(sid, 'room', room.name);
  Remote.send(sid, 'Entering room: ' + room.name);
  // enter the list
  room.users.push({ nickname: session.nickname });
  _.each(room.users, function(user) {
    if (user.nickname === session.nickname)
      Remote.send(sid, ' * ' + user.nickname + ' (** this is you)');
    else
      Remote.send(sid, ' * ' + user.nickname);
  });
  room.save();
  Remote.send(sid, 'end of list.');

  Log.success('%s has joined [%s] room', session.nickname, room.name);
}

function makeRoom(serverId, room) {
  Rooms[room.name] = null;

  // activate room
  Room.findOneAndUpdate({
    name: room.name
  }, {
    loc: serverId
  }, function(err, room) {
    if (!err) {
      Log.success('room [%s] activated', room.name);
    }

    Rooms[room.name] = room;
  });
}

function chat(room, message, session) {
  console.log(room);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
