'use strict';

var DB = require('./manager').users;
var _  = require('lodash');

function Users() {
  this.data = DB;
}

module.exports = new Users();

Users.prototype.insert = function(id, session) {
  this.data[id] = new User(session);
  return this.data[id];
};

Users.prototype.select = function(id) {
  if (!!id) return this.data[id];

  return this.data;
};

Users.prototype.isNotTaken = function(name) {
  return this.select(name) === undefined;
};

// individual
function User(session) {
  // required
  if (!session.realname) return 'real name is required';

  this.realname = session.realname;
  this.nickname = session.nickname || session.realname;
}
