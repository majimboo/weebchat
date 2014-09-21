'use strict';

var _      = require('lodash');

var Network = require('../network/manager').create();
var Server = require('../db/server');

/**
 * [servers description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var sid = session.id;

  if (session.realname !== 'admin') {
    Network.send(sid, 'Permission denied.');
    return;
  }

  if (!!Server.count()) {
    var servers = Server.select();
    Network.send(sid, 'Active servers are:');
    _.each(servers, function(sv) {
      Network.send(sid, ' * ' + sv.getName() + ' (' + sv.roomCount() + ')');
    });
    Network.send(sid, 'end of list.');
    return;
  }

  Network.send(sid, 'There are currently no active servers.');
}
