'use strict';

var _ = require('lodash');

var Network = require('../network/manager').get();
var consts  = require('../utils/constants');
var util = require('util');

/**
 * [help description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(params, session) {
  var sid = session.id;
  var commands = Network.getCommand();

  // sort commands by permission level
  var sortedCmd = _.sortBy(commands, 'permission');

  // longest usage
  var longest = _.max(sortedCmd, function(cmd) {
    return cmd.manual.usage.length;
  }).manual.usage.length;

  // start building manual
  var manuals = _.reduce(sortedCmd, formater, '');

  // show the manual
  Network.send(sid, 'Commands:');
  Network.sendRaw(sid, manuals);

  function formater(result, cmd) {
    var usage  = cmd.manual.usage;
    var info   = cmd.manual.info;
    var wspace = Array(longest - usage.length + 1).join(' ');
    var data   = '';

    if (session.permission >= cmd.permission) {
      data += util.format(' * %s %s - %s\r\n', usage, wspace, info);
    }

    return result += data;
  }
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
