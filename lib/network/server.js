#!/usr/bin/env node
'use strict';

var net     = require('net'),
    util    = require('util'),
    debug   = require('debug')('lib:network:server'),
    session = require('../session');

function Server() {
  net.Server.call(this);

  this.emit('ready');
  this.ready();
}

function createServer() {
  return new Server();
}

util.inherits(Server, net.Server);

Server.prototype.ready = function() {
  this.on('listening', this.onListening);
};

Server.prototype.onListening = function() {
  this.on('connection', this.onConnection);
};

Server.prototype.onConnection = function(socket) {
  var identity = socket.remoteAddress + ':' + socket.remotePort,
      lsession = session.create(identity, socket);

  lsession.dataCallback(this.onData);
};

Server.prototype.onData = function(data) {
  console.log(data);
};

module.exports = {
  create: createServer
};
