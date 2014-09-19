#!/usr/bin/env node
'use strict';

var kamote   = require('kamote');
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

module.exports = {
  create: create,
  destroy: destroy,
  get: get,
  getAll: getAll
};

function Session(sid, socket) {
  this.id = sid;
  this.realname = null;
  this.nickname = null;
  this.currentRoom = null;
  this.settings = {};

  // private
  Object.defineProperty(this, '_socket', {
    value: socket,
    configurable: true
  });

  Object.defineProperty(this, '_remote', {
    value: new kamote.Client(),
    configurable: true
  });
}

Session.prototype.set = function(setting, value) {
  this.settings[setting] = value;
};

Session.prototype.get = function(setting) {
  return this.settings[setting];
};

Session.prototype.kick = function() {
  this._socket.destroy();
};

Session.prototype.setName = function(name) {
  return this.nickname = this.realname = name;
};
