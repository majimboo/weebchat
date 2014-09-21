'use strict';

var DB = require('./manager').rooms;
var _  = require('lodash');

function Rooms() {
  this.data = DB;
}

module.exports = new Rooms();

Rooms.prototype.insert = function(id, value) {
  this.data[id] = new Room(value);
  return this.data[id];
};

Rooms.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return _.toArray(this.data);
};

Rooms.prototype.find = function(obj) {
  var finder = _.pairs(obj)[0];
  var key    = finder[0];
  var val    = finder[1];

  return _.filter(this.data, function(data) {
    return _.isPlainObject(val) ? data[key] === val.not : data[key] !== val;
  });
};

Rooms.prototype.delete = function(id) {
  delete this.data[id];
};

// individual
function Room(data) {
  // required
  if (!data.name) return 'room name is required';

  this.name  = data.name;
  this.users = data.users || {};
  this.loc   = data.loc || null;
  this.password = data.password || null;
}

Room.prototype.userCount = function() {
  return _.keys(this.users).length;
};

Room.prototype.addUser = function(nickname) {
  this.users[nickname] = nickname;
}

Room.prototype.removeUser = function(nickname) {
  delete this.users[nickname];
}
