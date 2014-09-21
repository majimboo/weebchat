'use strict';

var DB = require('./manager').servers;
var _  = require('lodash');

var RPC  = require('../network/remote');
var Log  = require('../utils/log');

var Promise = require('bluebird');

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

Servers.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};

Servers.prototype.setAddress = function(data) {
  var name = data.name;
  var rooms = data.rooms;
  var maxRooms = data.maxRooms;

  var server = this.select(data.id);
  server.setName(name);
  server.setAddress(data.host, data.port);
  server.setMaxRooms(maxRooms);

  Log.info('server %s (%s/%s) is online', name, rooms, maxRooms);
};

Servers.prototype.delete = function(id) {
  delete this.data[id];
};

// new stuff
Servers.prototype.findRooms = function(callback) {
  Promise.map(_.toArray(this.data), function(server) {
    return server.findRooms();
  }).then(_.flatten).then(function(results) {
    callback(results);
  });
}

Servers.prototype.findRoom = function(room, callback) {
  var servers = _.toArray(this.data);
  Promise.map(servers, function(server) {
    return server.findRoom(room);
  }).then(function() {
    callback();
  }).catch(callback);
};

Servers.prototype.pick = function(callback) {
  var servers = _.toArray(this.data);
  Promise.map(servers, function(server) {
    return server.isFull();
  }).then(function() {
    callback();
  }).catch(callback);
};

Servers.prototype.all = function(callback) {
  var servers = _.toArray(this.data);
  Promise.map(servers, function(server) {
    return server.roomCount();
  }).then(function(result) {
    callback(result);
  });
};

// individual
function Server(id, socket, index) {
  // required
  if (!socket) return 'socket is required';

  this.id       = id;
  this.index    = index + 1;
  this.maxRooms = 50;

  Object.defineProperty(this, 'socket', { value: socket });
  Object.defineProperty(this, 'remote', { value: new RPC.Client() });
}

// new stuff
Server.prototype.findRooms = function() {
  var self = this;
  return new Promise(function(onFulfilled) {
    self.remote.findRooms(function(result) {
      if (result) onFulfilled(result);
    });
  });
};

Server.prototype.findRoom = function(room) {
  var self = this;
  return new Promise(function(onFulfilled, onRejected) {
    self.remote.findRoom(room, function(result) {
      if (result) onRejected({ room: result, server: self });
      onFulfilled();
    });
  });
};

Server.prototype.isFull = function() {
  var self = this;
  return new Promise(function(onFulfilled, onRejected) {
    self.remote.roomCount(function(count) {
      if (count < self.maxRooms) {
        onRejected(self);
      }
      onFulfilled(count);
    });
  });
};

Server.prototype.roomCount = function() {
  var self = this;
  return new Promise(function(onFulfilled) {
    self.remote.roomCount(function(count) {
      onFulfilled({ count: count, server: self });
    });
  });
};

Server.prototype.setName = function(name) {
  this.name = name;
};

Server.prototype.setMaxRooms = function(size) {
  this.maxRooms = size;
};

Server.prototype.createRoom = function(room, pass, callback) {
  this.remote.createRoom(room, pass, callback);
};

Server.prototype.joinRoom = function(room, session) {
  this.remote.joinRoom(room, session);
};

Server.prototype.setAddress = function(host, port) {
  Object.defineProperty(this, 'address', { value: { host: host, port: port } });
  this.remote.reconnect(port, host);
};

Server.prototype.getName = function() {
  return this.name || (this.address.host + ':' + this.address.port) || this.id;
};
