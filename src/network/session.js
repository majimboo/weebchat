'use strict';

var _ = require('lodash');
var consts = require('../utils/constants');

var _sessions = {};

function create(sid, socket) {
  var session = new Session(sid, socket);
  _sessions[session.id] = session;

  return session;
}

function destroy(sid) {
  delete _sessions[sid];
}

function get(sid) {
  return _sessions[sid];
}

function getAll() {
  return _sessions;
}

function getByNick(nickname) {
  return _.find(_sessions, function(session) {
    return session.nickname === nickname;
  });
}

function inRoom(room, except) {
  return _.filter(_sessions, function(session) {
    var sRoom = session.getRoom();
    return sRoom && sRoom.name === room && session.id !== except;
  });
}

module.exports = {
  create: create,
  destroy: destroy,
  get: get,
  getByNick: getByNick,
  getAll: getAll,
  inRoom: inRoom
};

function Session(sid, socket) {
  this.id = sid;
  this.realname = null;
  this.nickname = null;
  this.host = sid.split(':').shift();

  this.currentRoom = null;

  this.permission = consts.STRANGER;
  this.settings = {};

  // private
  Object.defineProperty(this, '_socket', { value: socket });
}

Session.prototype.set = function(setting, value) {
  this.settings[setting] = value;
};

Session.prototype.get = function(setting) {
  return this.settings[setting];
};

Session.prototype.kick = function(msg) {
  if (msg) {
    this._socket.write(msg + '\n');
  }
  this._socket.destroy();
};

Session.prototype.setRoom = function(room) {
  this.currentRoom = room;
};

Session.prototype.getRoom = function() {
  return this.currentRoom;
};

Session.prototype.getRemote = function() {
  return this._remote;
};

Session.prototype.setRemote = function(remote) {
  Object.defineProperty(this, '_remote', {
    value: remote,
    configurable: true
  });
};

Session.prototype.socketErrorHandler = function(callback) {
  this._socket.on('error', callback);
};

Session.prototype.socketCloseHandler = function(callback) {
  this._socket.on('close', callback);
};

Session.prototype.setName = function(name) {
  this.nickname = this.realname = name;
};
