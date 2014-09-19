'use strict';

var net = require('net');
var util = require('util');
var events = require('events');

var registry = require('../commands/registry');

var Log = require('../utils/log');
var _   = require('lodash');
var sessions = require('./session');

/**
 * The network manager.
 *
 * @constructor
 * @extends events.EventEmitter
 */
function Manager(raw) {
  events.EventEmitter.call(this);
  this.commands = {};

  this.raw = !!raw;

  // expose sessions
  this.sessions = sessions;

  // initialize encryptions
}

util.inherits(Manager, events.EventEmitter);

/**
 * Listen for connection.
 *
 * @public
 */
Manager.prototype.listen = function() {
  var server = net.createServer();
  server.listen.apply(server, arguments);
  this.ready(server);
};

Manager.prototype.ready = function(server) {
  var self = this;
  server.on('connection', function(socket) {
    self.accept(socket);
  });
};

Manager.prototype.accept = function(socket) {
  // double check connection if it has
  // gone through proper authorities
  var self = this;

  // create a new session
  var identity = socket.remoteAddress + ':' + socket.remotePort;
  var session  = this.sessions.create(identity, socket);

  // expose new session
  this.emit('new client', session);

  // frame all incoming stream
  session._socket.on('data', function(data) {
    self.receive(data, session);
  });

  // destroy session if socket is gone
  session._socket.on('close', function() {
    self.sessions.destroy(session.id);
    Log.success('%s has gone offline', session.realname || session.id);
  });
};

Manager.prototype.send = function(sid, msg) {
  // get the session
  var session = this.sessions.get(sid);

  // encrypt message

  // send msg
  session._socket.write(msg + '\r\n');
};

Manager.prototype.sendToRoom = function(roomId, msg) {
  var sessions = this.sessions.inRoom(roomId);
  var sessionIds = Object.keys(sessions);

  // send msg to all
  for (var i = 0; i < sessionIds.length; i++) {
    this.send(sessionIds[i], msg);
  }
};

Manager.prototype.receive = function(data, session) {
  var self = this;

  // handle received data here
  var container = '';

  // text based protocol
  if (data instanceof Buffer) {
    data = data.toString();
  }

  // do not allow beyond 100 characters
  if (data.length > 100) {
    this.send(session.id, 'Sorry, message cannot exceed 100 characters');
    return;
  }

  // stream framing
  data = container + data;
  var lines = data.split(/\r?\n/);
  container = lines.pop();

  _.each(lines, function(message) {
    // clean messages
    message = message.replace(/(\r\n|\n|\r)/gm, '');

    // should be entry
    if (!session.realname && !session.nickname) {
      return self.command_callback('enter', message, session);
    }

    // commands
    if (/^[\/]/.test(message)) {
      var argv = message.substr(1).split(/[\s]+/);
      var command = argv.shift();
      return self.command_callback(command, argv, session);
    }

    // chat only allowed when in room
    if (session.getRoom()) {
      return self.command_callback('chat', message, session);
    }

    self.send(session.id, 'Sorry, invalid request.');
  });
};

Manager.prototype.command_callback = function(action, message, session) {
  // also check if action is not native_code
  var command = this.getCommand(action);

  if (!command) {
    this.send(session.id, 'Sorry, invalid command.');
    var identity = (session.realname || session.id);
    return Log.warn('invalid command [%s] invoked by %s', action, identity);
  }

  var struct = command.struct(message);

  if (command.callback) {
    return command.callback(struct, session);
  }

  return Log.warn('command [%s] has no registered callback', action);
};

Manager.prototype.listen_callback = function() {
  Log.info('staged on %s:%s', this.address().address, this.address().port);
};

Manager.prototype.getCommand = function(action) {
  if (this.commands.hasOwnProperty(action)) {
    return this.commands[action];
  }

  return false;
};

Manager.prototype.registerCommand = function(cmd, struct) {
  this.commands[cmd] = {};
  this.commands[cmd].struct = struct;
  this.commands[cmd].callback = null;
};

Manager.prototype.hookCommand = function(cmd, callback) {
  this.commands[cmd].callback = callback;
};

/**
 * Creates a new weebchat manager.
 *
 * @return {Manager}
 */
function init(raw) {
  var mgr = new Manager(raw);

  var keys = Object.keys(registry);
  // register all known commands
  for (var i = 0; i < keys.length; i++) {
    var cmd = keys[i];
    mgr.registerCommand(cmd, registry[cmd]);
  }

  return mgr;
}

/**
 * @export
 * @type {Object}
 */
module.exports = {
  init: init
}
