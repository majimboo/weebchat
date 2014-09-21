'use strict';

/**
 * [onQuit description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var room = session.getRoom();

  // if in room, leave first before quiting
  if (!room) {
    return session.kick('BYE');
  }

  session.getRemote().leaveRoom(room, session, function() {
    session.setRoom(null);
    session.kick('BYE');
  });
}
