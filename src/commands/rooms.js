'use strict';

var _      = require('lodash');

var Server = require('../db/server');
var consts  = require('../utils/constants');

/**
 * [rooms description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  Server.findRooms(callback);

  function callback(rooms) {
    var valid = (!!rooms && !!rooms.length);

    if (valid) {
      reply('Active rooms are:');
      _.each(rooms, function(room) {
        reply(' * %s (%s)', room.name, _.keys(room.users).length);
      });
      reply('end of list.');
      return;
    }

    reply('There are currently no active rooms.');
  }
}

exports.struct = function(msg) {
  var data = {};
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/rooms',
  info: 'shows all the active rooms.'
}

exports.permission = consts.ALL;
