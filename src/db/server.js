'use strict';

var DB = require('./manager').servers;
var _  = require('lodash');

var kamote = require('kamote');
var Log    = require('../utils/log');

function Servers() {
  this.data = DB;
}

module.exports = new Servers();

Servers.prototype.add = function(socket) {
  var self = this;

  var id = socket.remoteAddress + ':' + socket.remotePort;
  var server = this.data[id] = new Server(id, socket, this.count());

  // delete self on lost connection
  server._socket.on('end', function() {
    Log.warn('lost connection from server [%s]', server.index);
    self.delete(id);
  });

  Log.info('server [%s] connected', server.index);

  return this.data[id];
};

Servers.prototype.count = function() {
  return _.keys(this.data).length;
};

Servers.prototype.indexOf = function(id) {
  return _.keys(this.data).indexOf(id) + 1;
};

Servers.prototype.pick = function() {
  return _.find(this.data, function(server) {
    return server.roomCount() < 10;
  });
};

Servers.prototype.setAddress = function(id, host, port) {
  var server = this.select(id);
  server.setAddress(host, port);
};

Servers.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};

Servers.prototype.delete = function(id) {
  delete this.data[id];
};

// individual
function Server(id, socket, index) {
  // required
  if (!socket) return 'room name is required';

  this.id      = id;
  this.name    = null;
  this.index   = index + 1;
  this.rooms   = {};
  this.address = null;

  // private
  this._socket  = socket;
  this._remote  = new kamote.Client();
}

Server.prototype.roomCount = function() {
  return _.keys(this.rooms).length;
};

Server.prototype.createRoom = function(room) {
  this.rooms[room] = room;
  this._remote.createRoom(room);
};

Server.prototype.setAddress = function(host, port) {
  if (!this.address) {
    this.address = { host: host, port: port};
  }
  this.startRemote();
};

Server.prototype.getName = function() {
  if (!!this.address) {
    return this.address.host + ':' + this.address.port;
  }
  return this.id;
}

Server.prototype.startRemote = function() {
  this._remote.connect(this.address.port, this.address.host);
}
