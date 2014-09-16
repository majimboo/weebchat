#!/usr/bin/env node
'use strict';

var server = require('./lib/network/server').create(),
    debug  = require('debug')('weebchat');

/**
 * Main program entry point.
 *
 * @param  {String} host - Host to bind to.
 * @param  {Number} port - Port to bind to.
 * @param  {String} env  - Environment to run in.
 */
function main(host, port, env) {
  server.listen(port, host);

  debug('booting in %s', env);

  server.on('listening', staged.bind(null, host, port));
}

function staged(host, port) {
  debug('staged on %s:%s', host, port);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  go: main
}
