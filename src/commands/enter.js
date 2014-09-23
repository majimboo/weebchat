'use strict';

var utils   = require('../utils/helpers');
var consts  = require('../utils/constants');
var User    = require('../db/user');
var Log     = require('../utils/log');

/**
 * [enter description]
 *
 * @param  {Object} params  - Message structure.
 * @param  {Object} session - User session that sent the request.
 * @param  {Function} reply - An alternative to Network.send(sid, ...).
 */
exports.callback = function(params, session, reply) {
  // params
  var name = params.name;

  // validate name
  var goodName  = true;
  var notTaken  = User.isNotTaken(name);
  var validName = (utils.validateName(name) && goodName && notTaken);

  if (validName) {
    // describe session
    session.setName(name);
    session.permission = consts.GUEST;

    // add user
    User.insert(name, session);

    Log.success('%s has entered the Lobby', session.realname);

    // response
    return reply('Welcome %s!', session.realname);
  }

  if (!notTaken)
    reply('Sorry, name taken.');
  else
    reply('Sorry, name is invalid.');

  return reply('Login Name?');
}

exports.struct = function(msg) {
  var data = {};
  data.name = msg[0];
  return data;
}

exports.manual = {
  usage: '/enter <nickname>',
  info: 'joins the server as nickname.'
}

exports.permission = consts.STRANGER;
