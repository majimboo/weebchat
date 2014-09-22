'use strict';

var _   = require('lodash');

var Room = require('../db/room');
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
    Remote.setAddress({
      id: Remote.id,
      name: config.id,
      host: config.host,
      port: config.port,
      rooms: Room.select().length,
      maxRooms: config.max_rooms
    });
  });

  Network.def({
    findUser: findUser,
    findUsers: findUsers,
    findRoom: findRoom,
    findRooms: findRooms,
    roomCount: roomCount,
    createRoom: createRoom,
    joinRoom: joinRoom,
    leaveRoom: leaveRoom,
    chat: chat,
    kick: kick,
    chatAction: chatAction,
    privateMsg: privateMsg
  });
}

function findUser(nickname, callback) {
  callback(Room.findUser(nickname));
}

function findUsers(callback) {
  callback(Room.users());
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

function createRoom(name, password, callback) {
  Room.insert(name, { name: name, password: password });
  callback(true);

  Log.success('[%s] room created ', name);
}

function joinRoom(room, session) {
  var selectedRm = Room.select(room.name);
  selectedRm.addUser(session.nickname, session);

  // show room info
  Remote.send(session.id, 'Entering room: ' + selectedRm.name);
  _.each(selectedRm.users, function(user) {
    if (user.nickname === session.nickname) {
      Remote.send(session.id, ' * ' + user.nickname + ' (** this is you)');
    } else {
      Remote.send(session.id, ' * ' + user.nickname);
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
  // TODO chat anti flood

  if (msg) Remote.sendToRoom(room.name, session.nickname + ': ' + msg);
}

function kick(room, session, callback) {
  var selectedRm = Room.select(room.name);
  selectedRm.removeUser(session.nickname);

  Log.info('%s left [%s] room', session.nickname, room.name);
  callback();
}

function chatAction(room, msg, session) {
  Remote.sendToRoom(room.name, session.nickname + ' ' + msg);
}

function privateMsg(otherUser, msg, session) {
  Remote.send(otherUser, session.nickname + ' says ' + msg);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
