#!/usr/bin/env node
'use strict';

var CMD = require('./structure');

module.exports = {
  enter: CMD.ENTER,
  rooms: CMD.ROOMS,
  servers: CMD.SERVERS,
  create: CMD.CREATE,
  join: CMD.JOIN,
  chat: CMD.CHAT,
  quit: CMD.QUIT
}
