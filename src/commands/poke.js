'use strict';

var sessions = require('../network/session');
var consts  = require('../utils/constants');

/**
 * [poke description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var nickname = params.nickname;
  var room     = session.getRoom();
  var isSelf   = (nickname === session.nickname);

  // cannot pm self
  if (isSelf) return reply('Sorry, you can not poke yourself.');

  // call remote server
  if (room) {
    var user   = sessions.getByNick(nickname);
    if (!user) return reply('Sorry, user is not online.');

    var sameRm = (user.getRoom().name === room.name);
    if (!sameRm) return reply('Sorry, user is on another room.');

    return session.getRemote().pokeUser(user.id, session);
  }

  reply('Sorry, you are not in any room.');
}

exports.struct = function(msg) {
  var data = {};
  data.nickname = msg[0];
  return data;
}

exports.manual = {
  usage: '/poke <nickname>',
  info: 'poke another user in chatroom.'
}

exports.permission = consts.MEMBER;
