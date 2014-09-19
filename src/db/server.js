'use strict';

var DB = require('./manager').servers;
var _  = require('lodash');

var kamote = require('kamote');

function Servers() {
  this.data = DB;
}

module.exports = new Servers();

Servers.prototype.add = function(socket) {
  var self = this;

  var id = socket.remoteAddress + ':' + socket.remotePort;
  this.data[id] = new Server(id, socket);

  // delete self on lost connection
  this.data[id].socket.on('end', function() {
    self.delete(id);
  });

  return this.data[id];
};

Servers.prototype.count = function() {
  return _.keys(this.data).length;
};

Servers.prototype.indexOf = function(id) {
  return _.keys(this.data).indexOf(id);
};

Servers.prototype.pick = function() {
  return _.find(this.data, function(server) {
    return server.roomCount() < 10;
  });
};

Servers.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};

Servers.prototype.delete = function(id) {
  delete this.data[id];
};

// individual
function Server(id, socket) {
  // required
  if (!socket) return 'room name is required';

  this.id     = id;
  this.socket = socket;
  this.rooms  = {};
  this.remote = new kamote.Client();
}

Server.prototype.roomCount = function() {
  return _.keys(this.rooms).length;
};

Server.prototype.createRoom = function(room) {
  this.rooms[room] = room;
};
