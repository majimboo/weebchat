'use strict';

var DB = require('./manager').users;

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

Users.prototype.delete = function(id) {
  delete this.data[id];
};

/**
 * A object that represents a single user.
 *
 * @param {Object} session
 */
function User(session) {
  // required
  if (!session.realname) return 'real name is required';

  this.realname = session.realname;
  this.nickname = session.nickname || session.realname;
}
