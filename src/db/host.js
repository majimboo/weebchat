'use strict';

var DB = require('./manager').hosts;

function Hosts() {
  this.data = DB;
}

module.exports = new Hosts();

Hosts.prototype.insert = function(id) {
  var host = this.data[id];

  if (host) {
    host.count++;
    host.lastIn = Date.now();
  } else {
    this.data[id] = { count: 1, lastIn: Date.now() };
  }
};

Hosts.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};

Hosts.prototype.delete = function(id) {
  var host = this.data[id];

  if (host.count < 1) {
    delete this.data[id];
  } else {
    this.data[id].count--;
  }
};
