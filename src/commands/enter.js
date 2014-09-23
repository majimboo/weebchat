'use strict';

var Network = require('../network/manager').get();
var utils   = require('../utils/helpers');
var consts  = require('../utils/constants');
var User    = require('../db/user');
var Log     = require('../utils/log');

/**
 * [enter description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
exports.callback = function(msg, session) {
  var name = msg.name;
  var sid  = session.id;

  // validate name
  var validName = utils.validateName(name);
  var goodName  = true;
  var notTaken  = User.isNotTaken(name);

  if (validName && goodName && notTaken) {
    // set the nickname for the session
    session.setName(name);
    User.insert(name, session);
    Network.send(sid, 'Welcome ' + session.realname + '!');
    return Log.success('%s has entered the Lobby', session.realname);
  }

  if (!notTaken)
    Network.send(sid, 'Sorry, name taken.');
  else
    Network.send(sid, 'Sorry, name is invalid.');

  Network.send(session.id, 'Login Name?');
}

exports.struct = function(msg) {
  var data = {};
  data.name = msg;
  return data;
}

exports.manual = {
  usage: '/enter <nickname>',
  info: 'joins the server as nickname.'
}

exports.permission = consts.STRANGER;
