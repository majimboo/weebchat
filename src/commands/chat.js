'use strict';

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [chat description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var room = session.getRoom();
  var message = msg.msg;

  if (room) return session.getRemote().chat(room, message, session);

  Network.send(session.id, 'Sorry, you are not in any room.');
}

exports.struct = function(msg) {
  var data = {};
  data.nick = msg.shift();
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/chat <message>',
  info: 'broadcasts message to everyone in room.'
}

exports.permission = consts.MEMBER;
