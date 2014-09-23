'use strict';

var _      = require('lodash');

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');
var Server = require('../db/server');

/**
 * [servers description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var sid = session.id;
  var allowed = session.realname === 'admin';

  if (!allowed) {
    return Network.send(sid, 'Permission denied.');
  }

  Server.all(function(result) {
    if (result.length) {
      Network.send(sid, 'Active servers are:');
      _.each(result, function(sv) {
        var name =  sv.server.getName();
        var count = sv.count;
        var max = sv.server.maxRooms;
        Network.send(sid, ' * ' + name + ' (' + count + '/' + max + ')');
      });
      Network.send(sid, 'end of list.');
    }

    Network.send(sid, 'There are currently no active servers.');
  });
}

exports.struct = function(msg) {
  var data = {};
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/servers',
  info: 'shows all the active servers.'
}

exports.permission = consts.ADMIN;
