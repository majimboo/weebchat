'use strict';

var DB = require('./manager').servers;
var _  = require('lodash');

function Servers() {
  this.data = DB;
}

module.exports = new Servers();

Servers.prototype.add = function(socket) {
  var id = socket.remoteAddress + ':' + socket.remotePort;
  this.data[id] = socket;
  return this.data[id];
};

Servers.prototype.count = function() {
  return _.keys(this.data).length;
};

Servers.prototype.indexOf = function(id) {
  return _.keys(this.data).indexOf(id);
};

Servers.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};
