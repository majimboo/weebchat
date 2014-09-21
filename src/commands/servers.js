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
