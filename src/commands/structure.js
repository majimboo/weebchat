#!/usr/bin/env node
'use strict';

var CMD = {};

CMD.ENTER = function(msg) {
  return {
    name: msg
  }
}

CMD.ROOMS = function(msg) {
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

module.exports = CMD;
