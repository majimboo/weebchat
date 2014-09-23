'use strict';

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [ns description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var password = msg.password;
  var room = session.getRoom();
  var sid = session.id;

  if (!password) {
    return Network.send(sid, '/login <password>');
  }

  if (!room) {
    return Network.send(sid, 'You are not in any room.');
  }

  if (session.authenticated === room.name) {
    return Network.send(sid, 'Already authenticated.');
  }

  // check if user already has password
  if (room.password) {
    // if user already has a password compare it
    if (room.password === password) {
      session.authenticated = room.name;
      return Network.send(sid, 'Successfully authenticated.');
    }
  }

  Network.send(sid, 'Sorry, login failed.');
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
