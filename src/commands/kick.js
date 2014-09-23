'use strict';

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [kick description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
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
    session.getRemote().kick(room, user, function() {
      user.setRoom(null);
      user.authenticated = null;
      var noty = user.realname + ' has been kicked from the room.';
      Network.send(user.id, noty + ' (** this is you)');
      Network.sendToRoom(room.name, noty, user.id);
    });
    return;
  }

  Network.send(sid, 'Permission denied.');
}

exports.struct = function(msg) {
  var data = {};
  data.nick = msg[0];
  return data;
}

exports.manual = {
  usage: '/kick <nickname>',
  info: 'kicks the nickname off the chatroom.'
}

exports.permission = consts.OPERATOR;
