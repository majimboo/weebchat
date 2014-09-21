'use strict';

var Network = require('../network/manager').create();

/**
 * [onChatAction description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var message = msg.msg;
  var sid = session.id;
  var room = session.getRoom();

  // validate params
  if (!message.length) return Network.send(sid, '/me <message>');

  if (room) return session.getRemote().chatAction(room, message, session);

  Network.send(session.id, 'Sorry, you are not in any room.');
}
