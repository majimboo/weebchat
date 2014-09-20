#!/usr/bin/env node
'use strict';

var CMD = {};

CMD.HELP = function(msg) {
  return msg;
}

CMD.ENTER = function(msg) {
  return {
    name: msg
  }
}

CMD.ROOMS = function(msg) {
  return msg;
}

CMD.SERVERS = function(msg) {
  return msg;
}

CMD.CREATE = function(msg) {
  return {
    name: msg[0]
  }
}

CMD.JOIN = function(msg) {
  return {
    room: msg[0]
  }
}

CMD.CHAT = function(msg) {
  return {
    msg: msg
  }
}

CMD.LEAVE = function(msg) {
  return msg;
}

CMD.QUIT = function(msg) {
  return msg;
}

module.exports = CMD;
