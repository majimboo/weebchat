'use strict';

var Network = require('../network/manager').get();
var utils   = require('../utils/helpers');
var consts  = require('../utils/constants');
var Server  = require('../db/server');
var Log     = require('../utils/log');

/**
 * [create description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var name = msg.name;
  var pass = msg.pass;
  var sid  = session.id;
  var nick = session.realname;

  // validate params
  if (!name || !pass) return Network.send(sid, '/create <room> <password>');

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

        server.createRoom(name, pass, function(done) {
          if (done) {
            return Log.success('%s has created [%s] room', nick, name);
          }
        });
      });
    }
  });
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
