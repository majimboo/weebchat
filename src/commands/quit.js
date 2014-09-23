'use strict';

var consts  = require('../utils/constants');

/**
 * [quit description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(params, session) {
  var room = session.getRoom();

  // if in room, leave first before quiting
  if (!room) return session.kick('BYE');

  session.getRemote().leaveRoom(room, session, function() {
    // i dont think this is necesarry as the session
    // is already deleted when the client disconnects
    // but im just gonna keep it here
    session.permission = consts.STRANGER;
    session.setRoom(null);
    session.authenticated = null;
    session.kick('BYE');
  });
}

exports.struct = function(msg) {
  var data = {};
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/quit',
  info: 'disconnects from the server.'
}

exports.permission = consts.ALL;
