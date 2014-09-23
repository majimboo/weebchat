'use strict';

var consts  = require('../utils/constants');

/**
 * [me description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var message = params.msg;
  var room = session.getRoom();

  // call remote server
  if (room) return session.getRemote().chatAction(room, message, session);

  reply('Sorry, you are not in any room.');
}

exports.struct = function(msg) {
  var data = {};
  data.msg = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/me <action>',
  info: 'broadcast an action.'
}

exports.permission = consts.MEMBER;
