#!/usr/bin/env node
'use strict';

var CMD = require('./structure');

module.exports = {
  enter: CMD.ENTER,
  rooms: CMD.ROOMS,
  create: CMD.CREATE,
  join: CMD.JOIN
}
