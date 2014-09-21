'use strict';

var Network = require('../network/manager').create();
var utils   = require('../utils/helpers');
var MANUAL = utils.loadManual();

/**
 * [help description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
  var sid = session.id;
  Network.send(sid, MANUAL);
}
