#!/usr/bin/env node
'use strict';

var CMD = {};

CMD.NICK = function(msg) {
  return msg;
}

CMD.ROOMS = function(msg) {
  return msg;
}

module.exports = CMD;
