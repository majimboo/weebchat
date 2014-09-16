#!/usr/bin/env node
'use strict';

var Network = require('./src/network/manager').init(),
    Log     = require('./src/utils/log');

/**
 * Starts the engine.
 *
 * @param  {String} host - Host to bind to.
 * @param  {Number} port - Port to bind to.
 * @param  {String} env  - Environment to run in.
 */
function start(host, port, env) {
  Log.info('booting in ' + env);

  Network.listen(port, host, function() {
    Log.info('staged on ' + host + ':' + port);
  });

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('setname', onSetName);
  Network.hookCommand('rooms', onRooms);
}

function accept(session) {
  Network.send(session.id, '\r\n');
  Network.send(session.id, 'Welcome to the Weeb chat server\r\n');
  Network.send(session.id, 'Login Name?\r\n');
  // update session state
  return session.accepted();
}

function onSetName(msg, session) {
  // set the nickname for the session
  session.setNickname(msg[0]);
  Network.send(session.id, 'Welcome ' + session.nickname + '\r\n');
}

function onRooms(msg, session) {
  Network.send(session.id, 'rooms');
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
