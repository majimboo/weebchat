'use strict';

var DB = require('./manager').users;
var _  = require('lodash');

function Users() {
  this.data = DB;
}

module.exports = new Users();

Users.prototype.insert = function(id, value) {
  this.data[id] = new User(value);
  return this.data[id];
}

// individual
function User(data) {
  // required
  if (!data.realname) return 'real name is required';

  this.realname = data.realname;
  this.nickname = data.nickname || data.realname;
}
