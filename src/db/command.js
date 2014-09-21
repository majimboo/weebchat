'use strict';

module.exports = {
  help: function(msg) {
    return msg;
  },
  enter: function(msg) {
    var data = {}
    data.name = msg;
    return data;
  },
  rooms: function(msg) {
    return msg;
  },
  servers: function(msg) {
    return msg;
  },
  nick: function(msg) {
    var data = {}
    data.nick = msg[0];
    return data;
  },
  create: function(msg) {
    var data = {}
    data.name = msg[0];
    return data;
  },
  join: function(msg) {
    var data = {}
    data.room = msg[0];
    return data;
  },
  chat: function(msg) {
    var data = {}
    data.msg = msg;
    return data;
  },
  me: function(msg) {
    var data = {}
    data.msg = msg.join(' ');
    return data;
  },
  msg: function(msg) {
    var data = {};
    data.nick = msg.shift();
    data.msg  = msg.join(' ');
    return data;
  },
  leave: function(msg) {
    return msg;
  },
  quit: function(msg) {
    return msg;
  }
}
