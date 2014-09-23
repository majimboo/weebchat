'use strict';

var sessions = require('../network/session');
var consts  = require('../utils/constants');

/**
 * [msg description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var message  = params.msg;
  var nickname = params.nick;
  var room     = session.getRoom();
  var isSelf   = (nickname === session.nickname);

  // cannot pm self
  if (isSelf) return reply('Sorry, you can not msg yourself.');

  if (room) {
    var user   = sessions.getByNick(nickname);
    var sameRm = (user.getRoom().name === room.name);

    if (!user) return reply('Sorry, user is not online.');
    if (!sameRm) return reply('Sorry, user is on another room.');

    return session.getRemote().privateMsg(user.id, message, session);
  }

  return reply('Sorry, you are not in any room.');
}

exports.struct = function(msg) {
  var data = {};
  data.nick = msg.shift();
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/msg <nickname> <message>',
  info: 'sends a private message to specified nickname.'
}

exports.permission = consts.MEMBER;
