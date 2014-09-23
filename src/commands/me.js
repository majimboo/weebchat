'use strict';

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [onChatAction description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var message = msg.msg;
  var sid = session.id;
  var room = session.getRoom();

  // validate params
  if (!message.length) return Network.send(sid, '/me <message>');

  if (room) return session.getRemote().chatAction(room, message, session);

  Network.send(session.id, 'Sorry, you are not in any room.');
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
