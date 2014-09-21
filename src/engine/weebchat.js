'use strict';

var _   = require('lodash');

var Room = require('../db/room');
var User = require('../db/user');
var Log  = require('../utils/log');
var RPC  = require('../network/remote');

var Network = new RPC.Server();
var Remote  = new RPC.Client();

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // connect to RPC server
  Remote.reconnect(config.inter_port, config.inter_port);
  Remote.on('connect', Log.info.bind(Log, 'lobby connection established'));
  Remote.on('disconnect', Log.warn.bind(Log, 'lobby connection lost'));

  Remote.on('ready', function() {
    Remote.setAddress(Remote.id, config.host, config.port, config.max_rooms);
  });

  Network.def({
    findRoom: findRoom,
    findRooms: findRooms,
    roomCount: roomCount,
    createRoom: createRoom,
    joinRoom: joinRoom,
    leaveRoom: leaveRoom,
    chat: chat
  });
}

function findRoom(room, callback) {
  callback(Room.select(room));
}

function findRooms(callback) {
  callback(Room.select());
}

function roomCount(callback) {
  callback(Room.select().length);
}

function createRoom(name, callback) {
  Room.insert(name, { name: name });
  callback(true);

  Log.success('[%s] room created ', name);
}

function joinRoom(room, session) {
  var selectedRm = Room.select(room.name);
  selectedRm.addUser(session.nickname);

  // show room info
  Remote.send(session.id, 'Entering room: ' + selectedRm.name);
  _.each(selectedRm.users, function(user) {
    if (user === session.nickname) {
      Remote.send(session.id, ' * ' + user + ' (** this is you)');
    } else {
      Remote.send(session.id, ' * ' + user);
    }
  });
  Remote.send(session.id, 'end of list.');

  // notify members of new user
  var noty = '* new user joined ' + selectedRm.name + ': ' + session.nickname;
  Remote.sendToRoom(selectedRm.name, noty, session.id);

  Log.info('%s joined [%s] room', session.nickname, room.name);
}

function leaveRoom(room, session, callback) {
  var selectedRm = Room.select(room.name);
  selectedRm.removeUser(session.nickname);

  var noty = '* user has left chat: ' + session.nickname;
  Remote.sendToRoom(selectedRm.name, noty, session.id);
  Remote.send(session.id, noty + ' (** this is you)');

  Log.info('%s left [%s] room', session.nickname, room.name);
  callback();
}

function chat(room, msg, session) {
  Remote.sendToRoom(room.name, session.nickname + ': ' + msg);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
