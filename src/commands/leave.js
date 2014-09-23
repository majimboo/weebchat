'use strict';

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [onLeave description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var room = session.getRoom();

  if (!room) {
    return Network.send(session.id, 'You are not in any room.');
  }

  session.getRemote().leaveRoom(room, session, function() {
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
