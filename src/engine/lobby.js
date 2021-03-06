/**
 * Lobby acts as a load balancer.
 */
'use strict';

var Server = require('../db/server');

var Network = require('../network/manager').create();
var RPC     = require('../network/remote');
var Log     = require('../utils/log');
var User    = require('../db/user');
var Host    = require('../db/host');

var Lobby  = new RPC.Server();

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  Network.setMaxUsers(config.max_users);

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

  session.socketErrorHandler(onSocketError);
  session.socketCloseHandler(onSocketClose.bind(null, session));
}

function onSocketError(error) {
  // show some nice info
  Log.warn('socket error: %j', error);
}

function onSocketClose(session) {
  // delete user from list
  User.delete(session.realname);

  // remove host from list
  Host.delete(session.host);

  // disconnect from remote
  var remote = session.getRemote();
  var room   = session.getRoom();

  if (remote && room) {
    remote.leaveRoom(session.getRoom(), session, function() {
      Network.sessions.destroy(session.id);
    });
  } else {
    // destroy session
    Network.sessions.destroy(session.id);
  }

  // show some nice info
  Log.success('%s has gone offline', (session.realname || session.id));
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
