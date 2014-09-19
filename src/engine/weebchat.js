'use strict';

var _        = require('lodash');
var kamote   = require('kamote');

var Network = new kamote.Server();
var Remote  = new kamote.Client();

var Log     = require('../utils/log');

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // connect to RPC server
  Remote.reconnect(config.inter_port, config.inter_port);
  Remote.on('connect', Log.info.bind(Log, 'lobby connection established'));
  Remote.on('disconnect', Log.warn.bind(Log, 'lobby connection lost'));

  Remote.on('ready', function() {
    Remote.setAddress(Remote.id, config.host, config.port);
  });

  Network.add(createRoom);
}

function createRoom(name) {
  console.log(name);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
