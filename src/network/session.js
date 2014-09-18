#!/usr/bin/env node
'use strict';

function SessionService() {
  this.sessions = {};
}

module.exports = new SessionService();

SessionService.prototype.create = function(sessionId, socket) {
  var session = new Session(sessionId, socket, this);

  this.sessions[session.id] = session;

  return session;
};

SessionService.prototype.get = function(sessionId) {
  return this.sessions[sessionId];
};

function Session(sid, socket, service) {
  this.id = sid;
  this.realname = null;
  this.nickname = null;
  this.currentRoom = null;

  // private
  this.$socket  = socket;
  this.$service = service;
}

Session.prototype.dataCallback = function(callback) {
  this.$socket.on('data', callback);
};

Session.prototype.setName = function(name) {
  return this.nickname = this.realname = name;
};
