'use strict';

var _   = require('lodash');

var Room = require('../db/room');
var Log  = require('../utils/log');
var RPC  = require('../network/remote');

var Network = new RPC.Server();
var Remote  = new RPC.Client();

var sessions = require('../network/session');

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
    pokeUser: pokeUser,
    privateMsg: privateMsg
  });

  Network.on('new client', onNewClient);
}

function onNewClient(socket) {
  // create a new session
  var identity = socket.remoteAddress + ':' + socket.remotePort;
  var session  = sessions.create(identity, socket);

  session.socketErrorHandler(function() {});
  session.socketCloseHandler(function() {});
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
  if (callback) callback(true);

  Log.success('[%s] room created ', name);
}

function joinRoom(room, session) {
  var sid = session.id;
  var selectedRm = Room.select(room.name);
  selectedRm.addUser(session.nickname, session);

  // show room info
  Remote.send(sid, 'Entering room: ' + selectedRm.name);
  _.each(selectedRm.users, function(user) {
    if (user.nickname === session.nickname) {
      Remote.send(sid, ' * %s (** this is you)', user.nickname);
    } else {
      Remote.send(sid, ' * %s', user.nickname);
    }
  });
  Remote.send(sid, 'end of list.');

  // notify members of new user
  var noty = '* new user joined ' + selectedRm.name + ': ' + session.nickname;
  Remote.sendToRoom(selectedRm.name, noty, sid);

  // send last 10 message archive
  var archive = selectedRm.getLast(10);
  _.each(archive, function(message) {
    Remote.send(sid, '%s: %s', message.sender, message.message);
  });

  Log.info('%s joined [%s] room', session.nickname, room.name);
}

function leaveRoom(room, session, callback) {
  var selectedRm = Room.select(room.name);
  selectedRm.removeUser(session.nickname);

  var noty = '* user has left chat: ' + session.nickname;
  Remote.sendToRoom(selectedRm.name, noty, session.id);
  Remote.send(session.id, '%s (** this is you)', noty);

  Log.info('%s left [%s] room', session.nickname, room.name);
  if (callback) callback();
}

function chat(room, msg, session) {
  if (msg) {
    var selectedRm = Room.select(room.name);
    selectedRm.saveMessage(session.nickname, msg);
    Remote.sendToRoom(room.name, session.nickname + ': ' + msg);
  }
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

function pokeUser(otherUser, session) {
  Remote.send(otherUser, session.nickname + ' has poked you');
}

function privateMsg(otherUser, msg, session) {
  Remote.send(otherUser, '%s says %s', session.nickname, msg);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
