'use strict';

var _        = require('lodash');
var kamote   = require('kamote');

var Network = new kamote.Server();
var Remote  = new kamote.Client();

var Log     = require('../utils/log');

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // connect to RPC server
  Remote.reconnect(config.inter_port, config.inter_port);
  Remote.on('connect', Log.info.bind(Log, 'lobby connection established'));
  Remote.on('disconnect', Log.warn.bind(Log, 'lobby connection lost'));
  Remote.on('ready', function() {

  });
}

function join(room, session) {
  var sid = session.id;
  room = Rooms[room.name];

  Remote.store(sid, 'room', room.name);
  Remote.send(sid, 'Entering room: ' + room.name);
  // enter the list
  room.users.push({ nickname: session.nickname });
  _.each(room.users, function(user) {
    if (user.nickname === session.nickname)
      Remote.send(sid, ' * ' + user.nickname + ' (** this is you)');
    else
      Remote.send(sid, ' * ' + user.nickname);
  });
  room.save();
  Remote.send(sid, 'end of list.');

  Log.success('%s has joined [%s] room', session.nickname, room.name);
}

function makeRoom(serverId, room) {
  Rooms[room.name] = null;

  // activate room
  Room.findOneAndUpdate({
    name: room.name
  }, {
    loc: serverId
  }, function(err, room) {
    if (!err) {
      Log.success('room [%s] activated', room.name);
    }

    Rooms[room.name] = room;
  });
}

function chat(room, message, session) {
  console.log(room);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
