'use strict';

var Network = require('../network/manager').create();
var Server  = require('../db/server');

/**
 * [join description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var room = msg.room;
  var sid  = session.id;

  // validate params
  if (!room) return Network.send(sid, '/join <room>');

  // cannot join while in room
  if (session.getRoom()) {
    Network.send(sid, 'Sorry, you must leave before joining another room.');
    return;
  }

  Server.findRoom(room, function(result) {
    var room = result.room;
    var server = result.server;

    // if a server is given then the room exists
    if (server) {
      server.joinRoom(room, session);

      session.setRoom(room);
      session.setRemote(server.remote);
      return;
    }

    // fallback for unexpected behaviour
    Network.send(sid, 'Sorry, no server is hosting such room.');
  });
}
