'use strict';

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [kick description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var nickname = params.nickname;
  var room     = session.getRoom();
  var isSelf   = nickname === session.nickname;

  if (!room) return reply('You are not part of any chatroom.');

  if (!nickname) return reply(this.manual.usage);

  // cannot kick self
  if (isSelf) return reply('Sorry, you can not kick yourself.');

  if (session.authenticated === room.name) {
    var user = Network.sessions.getByNick(nickname);
    var otherRm = user.getRoom().name !== room.name;

    if (!user) return reply('Sorry, user is not online.');
    if (otherRm) return reply('Sorry, user is on another room.');

    session.getRemote().kick(room, user, callback);
  }

  function callback() {
    user.setRoom(null);
    user.authenticated = null;
    var noty = '* user has been kicked from chat: ' + user.realname;

    Network.send(user.id, '%s (** this is you)', noty);
    Network.sendToRoom(room.name, noty, user.id);
  }
}

exports.struct = function(msg) {
  var data = {};
  data.nickname = msg[0];
  return data;
}

exports.manual = {
  usage: '/kick <nickname>',
  info: 'kicks the nickname off the chatroom.'
}

exports.permission = consts.OPERATOR;
