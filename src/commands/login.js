'use strict';

var Network = require('../network/manager').create();

/**
 * [ns description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
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
