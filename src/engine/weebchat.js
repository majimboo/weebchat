'use strict';

var _   = require('lodash');
var RPC = require('../network/remote');

var Network = new RPC.Server();
var Remote  = new RPC.Client();

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
    Remote.setAddress(Remote.id, config.host, config.port, config.max_rooms);
  });

  Network.add(createRoom);
  Network.add(joinRoom);
  Network.add(chat);
}

function createRoom(name) {
  Log.info('created: %s', name);
}

function joinRoom(room) {
  Log.info('joined: %s', room);
}

function chat(room, msg, session) {
  console.log(room, msg, session);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
