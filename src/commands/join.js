'use strict';

var consts  = require('../utils/constants');
var Server  = require('../db/server');

/**
 * [join description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var room     = params.room;
  var userRoom = session.getRoom();

  // validate params
  if (!room) return reply(this.manual.usage);

  // cannot join while in room
  if (userRoom) return reply('Sorry, must not be part of any chatroom.');

  Server.findRoom(room, findRoom);

  function findRoom(result) {
    var room = result.room;
    var server = result.server;

    // if a server is given then the room exists
    if (server) {
      server.joinRoom(room, session);

      session.permission = consts.MEMBER;
      session.setRoom(room);
      session.setRemote(server.remote);
      return;
    }

    // fallback for unexpected behaviour
    return reply('Sorry, no server is hosting such room.');
  }
}

exports.struct = function(msg) {
  var data = {};
  data.room = msg[0];
  return data;
}

exports.manual = {
  usage: '/join <room>',
  info: 'joins the specified room.'
}

exports.permission = consts.GUEST;
