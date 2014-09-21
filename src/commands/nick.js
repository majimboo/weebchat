'use strict';

var Network = require('../network/manager').create();

/**
 * [nick description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var nick = msg.nick;
  var sid = session.id;

  // validate params
  if (!nick) return Network.send(sid, '/nick <nickname>');

  // TODO
}
