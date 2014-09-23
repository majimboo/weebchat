'use strict';

var utils   = require('../utils/helpers');
var consts  = require('../utils/constants');
var Server  = require('../db/server');
var Log     = require('../utils/log');

/**
 * [create description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var roomName   = params.name;
  var roomPass   = params.pass;
  var validName  = !!utils.validateName(roomName);

  // session info
  var nick = session.realname;

  // validate room name
  if (!validName) return reply('Sorry, invalid chatroom name.');

  // find the room through all the active servers
  Server.findRoom(roomName, findRoom);

  // find room callback
  function findRoom(result) {
    var room = result.room;

    // check if room is already taken
    if (room) return reply('Sorry, name taken.');

    // pick a server to create room in
    Server.pick(function(server) {
      if (!server) {
        Log.warn('%s failed to create [%s] room', nick, roomName);
        return reply('Sorry, no available servers.');
      }

      server.createRoom(roomName, roomPass, function(done) {
        if (done) Log.success('%s has created [%s] room', nick, roomName);
      });
    });
  }
}

exports.struct = function(msg) {
  var data = {};
  data.name = msg[0];
  data.pass = msg[1];
  return data;
}

exports.manual = {
  usage: '/create <room> <password>',
  info: 'creates a new room with a password.'
}

exports.permission = consts.GUEST;
