'use strict';

var Log = require('../utils/log');
var User = require('../db/user');
var utils = require('../utils/helpers');
var Network = require('../network/manager').create();

/**
 * [enter description]
 *
 * @param  {Object} msg     - Message structure.
 * @param  {Object} session - User session that sent the request.
 */
module.exports = function(msg, session) {
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
