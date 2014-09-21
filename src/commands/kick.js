'use strict';

var Network = require('../network/manager').create();

/**
 * [kick description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var nick = msg.nick;
  var room = session.getRoom();
  var sid = session.id;

  if (!room) {
    return Network.send(sid, 'You are not in any room.');
  }

  if (!nick) {
    return Network.send(sid, '/kick <nick>');
  }

  // cannot kick self
  if (nick === session.nickname) {
    Network.send(sid, 'Sorry, you can not kick yourself.');
    return;
  }

  if (session.authenticated === room.name) {
    var user = Network.sessions.getByNick(nick);
    if (!user) {
      return Network.send(sid, 'Sorry, user is not online.');
    }
    if (user.getRoom().name !== room.name) {
      return Network.send(sid, 'Sorry, user is on another room.');
    }
    user.kick('BYE');
    Network.sendToRoom(room.name, user.realname + ' was kicked.', user.id);
    return;
  }

  Network.send(sid, 'Permission denied.');
}
