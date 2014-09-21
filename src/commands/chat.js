'use strict';

var Network = require('../network/manager').create();

/**
 * [chat description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var room = session.getRoom();
  var message = msg.msg;

  if (room) return session.getRemote().chat(room, message, session);

  Network.send(session.id, 'Sorry, you are not in any room.');
}
