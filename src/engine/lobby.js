/**
 * Lobby acts as a load balancer.
 */
'use strict';

var _        = require('lodash');
var kamote   = require('kamote');
var mongoose = require('mongoose');

var Network = require('../network/manager').init();
var Room    = require('../models/room');
var User    = require('../models/user');
var Pool    = {};

var Log     = require('../utils/log');
var utils   = require('../utils/helpers');

var Inter  = new kamote.Server();

function mongodb_connect(config) {
  mongoose.connect(config, {
    server: { socketOptions: { keepAlive: 1 }}
  });
  var conn = mongoose.connection;
  // reconnect if lost connection to mongodb
  conn.on('disconnected', function() {
    Log.warn('lost connection to database');
    // recursive retry...
    mongodb_connect(config);
  });
  return conn;
}

/**
 * Starts the engine.
 *
 * @param  {Object} config - configs.
 */
function start(config) {
  Log.info('booting in %s', config.env);

  // connect to mongodb
  var mongodb = mongodb_connect(config.db);
  mongodb.on('connected', function() {
    Log.info('database connection established');
  });

  // frontend
  Network.listen(config.port, config.host, function() {
    Log.info('staged on %s:%s', config.host, config.port);
  });

  // backend
  Inter.listen(config.inter_port, config.inter_host, function() {
    Log.info('staged on %s:%s', config.inter_host, config.inter_port);
    bootInter();
  });

  roomCleaner();

  Network.on('new client', accept);

  // hooks
  Network.hookCommand('enter', onEnter);
  Network.hookCommand('rooms', onRooms);
  Network.hookCommand('create', onCreate);
  Network.hookCommand('join', onJoin);
  Network.hookCommand('chat', onChat);
}

function bootInter() {
  Inter.add('addToPool', function(info) {
    Pool[info.id] = info;
    Log.success('server %s added to pool', info.id);
  });

  Inter.add('sendToRoom', function(roomId, msg) {
    Network.sendToRoom(roomId, msg);
  });

  Inter.add('send', function(sid, msg) {
    Network.send(sid, msg);
  });

  Inter.add('store', function(sid, key, val) {
    var session = Network.sessions.get(sid);
    session.set(key, val);
  });
}

function roomCleaner() {
  // delete all rooms that the loc is not in the Pool
  Room.find({ loc: { $ne: null }}, function(err, rooms) {
    if (err) return Log.warn('room cleanup failed');

    var danglers = _.filter(rooms, function(room) {
      return Pool[room.loc] === undefined;
    })

    _.each(danglers, function(room) {
      // deactive
      room.loc = null;
      room.save(function(err) {
        if (!err) return Log.success('room [%s] deactived', room.name);
      });
    });
  });
}

function accept(session) {
  Network.send(session.id, '\nWelcome to the Weeb chat server');
  Network.send(session.id, 'Login Name?');
}

function onEnter(msg, session) {
  var name = msg.name;
  var sid  = session.id;

  // validate name
  var validName = utils.validateName(name);
  var goodName  = true;
  var notTaken  = true;

  if (validName && goodName && notTaken) {
    // set the nickname for the session
    session.setName(name);
    Network.send(sid, 'Welcome ' + session.realname + '!');
    return Log.success('%s has entered the Lobby', session.realname);
  }

  if (!notTaken) {
    return Network.send(sid, 'Sorry, name taken.');
  }

  Network.send(sid, 'Sorry, name is invalid.');
}

function onRooms(msg, session) {
  var sid = session.id;

  if (!session.realname) return notAllowed(sid);

  Room.find({ loc: { $ne: null }}, function(err, rooms) {
    if (err) return handleError(sid);

    if (!rooms.length) {
      Network.send(sid, 'There are currently no active rooms.');
      return;
    }

    Network.send(sid, 'Active rooms are:');
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      Network.send(sid, ' * ' + room.name + ' (' + room.users.length + ')');
    }
    Network.send(sid, 'end of list.');
  });
}

function onCreate(msg, session) {
  var name = msg.name;
  var sid  = session.id;
  var nick = session.realname;

  if (!name) return Network.send(sid, '/create <room>');

  // validate room name
  if (!utils.validateName(name)) {
    return Network.send(sid, 'Sorry, invalid name.');
  }

  // check if room doesn't exist yet
  Room.findOne({ name: name }, function(err, room) {
    if (err) return handleError(sid);

    // room isn't taken yet
    if (!room) {
      Room.create({
        name: name,
        users: [],
        archive: [],
        operators: [],
        loc: null
      }, function(err, room) {
        if (err) return handleError(sid);
        if (room) {
          Network.send(sid, 'Successfully created.');

          var server = _.find(Pool, function(server) {
            return Object.keys(server.rooms).length < server.max_rooms;
          });

          // create new Remote connection
          session._remote.connect(server.port, server.host);
          session._remote.on('ready', function() {
            session._remote.makeRoom(server.id, room);
          });

          Log.success('%s has created [%s] room', nick, name);
          return;
        }

        // fallback for unexpected behaviour
        Network.send(sid, 'Sorry, something went wrong.');
      });
      return;
    }

    // room already exists
    Network.send(sid, 'Sorry, name taken.');
  });
}

function onJoin(msg, session) {
  var room = msg.room;
  var sid  = session.id;
  var nick = session.realname;

  // validate params
  if (!room) return Network.send(sid, '/join <room>');

  // validate if room exist
  Room.findOne({ name: room, loc: { $ne: null }}, function(err, room) {
    if (err) return handleError(sid);

    // room is active
    if (room) {
      // find room server
      var server = _.find(Pool, function(server) {
        return _.find(server.rooms, function(rooms, key) {
          return key === room.name;
        }) !== undefined;
      });

      // create new Remote connection
      session._remote.connect(server.port, server.host);
      session._remote.on('ready', function() {
        session._remote.join(room, session);
      });
      return;
    }

    // fallback for unexpected behaviour
    Network.send(sid, 'Sorry, invalid room.');
  });
}

function onChat(msg, session) {
  var room = session.get('room');
  var message = msg.msg;

  if (!!room) {
    session._remote.chat(room, message, session);
  }

  Network.send(session.id, 'Sorry, you are not in any room.');
}

function handleError(sid) {
  Network.send(sid, 'Sorry, an error occured.');
}

function notAllowed(sid) {
  Network.send(sid, 'Sorry, request not available here.');
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
