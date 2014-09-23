'use strict';

var _      = require('lodash');

var Server = require('../db/server');
var Network = require('../network/manager').get();
var consts  = require('../utils/constants');

/**
 * [rooms description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var sid = session.id;

  Server.findRooms(function(rooms) {
    if (!!rooms && !!rooms.length) {
      Network.send(sid, 'Active rooms are:');
      _.each(rooms, function(room) {
        var userCount = '(' + _.keys(room.users).length + ')';
        Network.send(sid, ' * ' + room.name + ' ' + userCount);
      });
      Network.send(sid, 'end of list.');
      return;
    }

    Network.send(sid, 'There are currently no active rooms.');
  });
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
