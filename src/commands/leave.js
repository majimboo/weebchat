'use strict';

var Network = require('../network/manager').create();

/**
 * [onLeave description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var room = session.getRoom();

  if (!room) {
    return Network.send(session.id, 'You are not in any room.');
  }

  session.getRemote().leaveRoom(room, session, function() {
    session.setRoom(null);
    session.authenticated = null;
  });
}
