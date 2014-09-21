'use strict';

var Network = require('../network/manager').create();
var utils   = require('../utils/helpers');
var Server  = require('../db/server');
var Log     = require('../utils/log');

/**
 * [create description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var name = msg.name;
  var sid  = session.id;
  var nick = session.realname;

  // validate params
  if (!name) return Network.send(sid, '/create <room>');

  // validate room name
  if (!utils.validateName(name)) {
    return Network.send(sid, 'Sorry, invalid name.');
  }

  Server.findRoom(name, function(result) {
    var room = result.room;
    // check if room doesn't exist yet
    if (room) {
      return Network.send(sid, 'Sorry, name taken.');
    } else {
      Server.pick(function(server) {
        if (!server) {
          Network.send(sid, 'Sorry, no available servers.');
          return Log.warn('%s failed to create [%s] room', nick, name);
        }

        server.createRoom(name, function(done) {
          if (done) {
            return Log.success('%s has created [%s] room', nick, name);
          }
        });
      });
    }
  });
}
