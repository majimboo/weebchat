'use strict';

var consts  = require('../utils/constants');

/**
 * [login description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var password = params.password;
  var room     = session.getRoom();
  var alreadyAuth = session.authenticated === room.name;

  if (!password) return reply(this.manual.usage);
  if (!room) return reply('You are not in any room.');
  if (alreadyAuth) return reply('Already authenticated.');

  // make sure room has password
  if (room.password) {
    // compare
    if (room.password === password) {
      session.authenticated = room.name;
      session.permission = consts.OPERATOR;
      return reply('Successfully authenticated.');
    }
  }

  return reply('Sorry, login failed.');
}

exports.struct = function(msg) {
  var data = {};
  data.password = msg[0];
  return data;
}

exports.manual = {
  usage: '/login <password>',
  info: 'be an operator of the room.'
}

exports.permission = consts.MEMBER;
