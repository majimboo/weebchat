'use strict';

var Network = require('../network/manager').create();

/**
 * [onPrivateMsg description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var message = msg.msg;
  var nickname = msg.nick;
  var sid = session.id;
  var room = session.getRoom();

  // give info because user is using command incorrectly
  if (!nickname || !message.length) {
    Network.send(sid, '/msg <nickname> <message>');
    return;
  }

  // cannot pm self
  if (nickname === session.nickname) {
    Network.send(sid, 'Sorry, you can not msg yourself.');
    return;
  }

  if (room) {
    var otherUser = Network.sessions.getByNick(nickname);
    if (!otherUser) {
      return Network.send(sid, 'Sorry, user is not online.');
    }
    if (otherUser.getRoom().name !== room.name) {
      return Network.send(sid, 'Sorry, user is on another room.');
    }
    session.getRemote().privateMsg(otherUser.id, message, session);
    return;
  }

  Network.send(session.id, 'Sorry, you are not in any room.');
}
