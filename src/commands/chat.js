'use strict';

var consts  = require('../utils/constants');

/**
 * [chat description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  // params
  var message = params.msg;

  // user current room
  var room = session.getRoom();

  if (room) return session.getRemote().chat(room, message, session);

  return reply('Sorry, you are not in any room.');
}

exports.struct = function(msg) {
  var data = {};
  data.msg  = msg[0];
  return data;
}

exports.manual = {
  usage: '/chat <message>',
  info: 'broadcasts message to everyone in room.'
}

exports.permission = consts.MEMBER;
