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
    // i dont think this is necesarry as the session
    // is already deleted when the client disconnects
    // but im just gonna keep it here
    session.setRoom(null);
    session.authenticated = null;
    session.kick('BYE');
  });
}
