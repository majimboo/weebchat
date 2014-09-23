'use strict';

var Network = require('../network/manager').get();
var utils   = require('../utils/helpers');
var consts  = require('../utils/constants');
var MANUAL  = utils.loadManual();

/**
 * [help description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var sid = session.id;
  Network.send(sid, MANUAL);
}

exports.struct = function(msg) {
  var data = {};
  data.msg  = msg.join(' ');
  return data;
}

exports.manual = {
  usage: '/help',
  info: 'shows this message.'
}

exports.permission = consts.ALL;
