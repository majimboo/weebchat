'use strict';

module.exports = {
  help: function(msg) {
    return msg;
  },
  enter: function(msg) {
    var data = {};
    data.name = msg;
    return data;
  },
  login: function(msg) {
    var data = {};
    data.password = msg[0];
    return data;
  },
  rooms: function(msg) {
    return msg;
  },
  servers: function(msg) {
    return msg;
  },
  create: function(msg) {
    var data = {};
    data.name = msg[0];
    data.pass = msg[1];
    return data;
  },
  join: function(msg) {
    var data = {};
    data.room = msg[0];
    return data;
  },
  chat: function(msg) {
    var data = {};
    data.msg = msg;
    return data;
  },
  me: function(msg) {
    var data = {};
    data.msg = msg.join(' ');
    return data;
  },
  msg: function(msg) {
    var data = {};
    data.nick = msg.shift();
    data.msg  = msg.join(' ');
    return data;
  },
  kick: function(msg) {
    var data = {};
    data.nick = msg.shift();
    return data;
  },
  leave: function(msg) {
    return msg;
  },
  quit: function(msg) {
    return msg;
  }
}
