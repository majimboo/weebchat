/**
 * Lobby acts as a load balancer.
 */
'use strict';

var Server = require('../db/server');

var Network = require('../network/manager').create();
var RPC     = require('../network/remote');
var Log     = require('../utils/log');

var Lobby  = new RPC.Server();

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  // frontend
  Network.listen(config.port, config.host, Network.listen_callback);

  // backend
  Lobby.listen(config.inter_port, config.inter_host, Network.listen_callback);
  Lobby.def({
    send: Network.send.bind(Network),
    sendToRoom: Network.sendToRoom.bind(Network),
    setAddress: Server.setAddress.bind(Server)
  });
  Lobby.on('connection', Server.add.bind(Server));

  Network.on('new client', onNewClient);
}

/**
 * [onNewClient description]
 *
 * @param  {Object} session - User session that sent the request.
 */
function onNewClient(session) {
  Network.send(session.id, '\u001B[2J\u001B[fWelcome to the Weeb chat server');
  Network.send(session.id, 'Login Name?');
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
