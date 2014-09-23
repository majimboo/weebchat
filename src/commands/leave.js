'use strict';

var consts  = require('../utils/constants');

/**
 * [onLeave description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var room = session.getRoom();

  if (!room) return reply('You are not in any room.');

  session.getRemote().leaveRoom(room, session, function() {
    session.permission = consts.GUEST;
    session.setRoom(null);
    session.authenticated = null;
  });
}

exports.struct = function(msg) {
  var data = {};
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/leave',
  info: 'leaves the chatroom.'
}

exports.permission = consts.MEMBER;
