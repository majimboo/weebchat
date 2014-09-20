'use strict';

var DB = require('./manager').servers;
var _  = require('lodash');

var Room = require('./room');
var RPC  = require('../network/remote');
var Log  = require('../utils/log');

function Servers() {
  this.data = DB;
}

module.exports = new Servers();

Servers.prototype.add = function(socket) {
  var self = this;

  var id = socket.remoteAddress + ':' + socket.remotePort;
  var server = this.data[id] = new Server(id, socket, this.count());

  // delete self on lost connection
  server.socket.on('end', function() {
    Log.warn('lost connection from server [%s]', server.index);
    self.delete(id);
  });

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
    return server.isNotFull();
  });
};

Servers.prototype.findByRoom = function(room) {
  return _.find(this.data, function(server) {
    return server.findRoom(room) === room;
  });
};

Servers.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};

Servers.prototype.setAddress = function(id, host, port, size) {
  var server = this.select(id);
  server.setAddress(host, port);
  server.setMaxRooms(size);

  Log.info('server [%s] online (0/%s)', server.index, server.maxRooms);
};

Servers.prototype.delete = function(id) {
  delete this.data[id];
};

// individual
function Server(id, socket, index) {
  // required
  if (!socket) return 'socket is required';

  this.id       = id;
  this.index    = index + 1;
  this.rooms    = {}; // make this the room model
  this.maxRooms = 50;

  this.socket = socket;
  this.remote = new RPC.Client();
}

Server.prototype.isNotFull = function() {
  return this.roomCount() < this.maxRooms;
};

Server.prototype.setMaxRooms = function(size) {
  this.maxRooms = size;
};

Server.prototype.roomCount = function() {
  return _.keys(this.rooms).length;
};

Server.prototype.findRoom = function(room) {
  return this.rooms[room];
};

Server.prototype.createRoom = function(room) {
  this.rooms[room] = room;
  this.remote.createRoom(room, function callback(a, b) {
    console.log(a);
    console.log(b);
  });
};

Server.prototype.joinRoom = function(room) {
  this.remote.joinRoom(room);
  return this.remote;
};

Server.prototype.setAddress = function(host, port) {
  Object.defineProperty(this, 'address', { value: { host: host, port: port } });
  this.remote.reconnect(port, host);
};

Server.prototype.getName = function() {
  if (!!this.address) {
    return this.address.host + ':' + this.address.port;
  }
  return this.id;
};
