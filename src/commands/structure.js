#!/usr/bin/env node
'use strict';

var CMD = {};

CMD.CONNECT = function(msg) {
  return {
    name: msg
  }
}

CMD.ROOMS = function(msg) {
  return msg;
}

module.exports = CMD;
