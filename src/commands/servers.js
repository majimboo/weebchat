'use strict';

var _      = require('lodash');

var consts  = require('../utils/constants');
var Server = require('../db/server');

/**
 * [servers description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  var allowed = session.realname === 'admin';

  if (!allowed) return reply('Permission denied.');

  Server.all(callback);

  function callback(result) {
    if (result.length) {
      reply('Active servers are:');
      _.each(result, function(sv) {
        var name  = sv.server.getName();
        var count = sv.count;
        var max   = sv.server.maxRooms;
        reply(' * %s (%s/%s)', name, count, max);
      });
      return reply('end of list.');
    }

    return reply('There are currently no active servers.');
  }
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
