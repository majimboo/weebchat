'use strict';

var fs = require('fs');
var net = require('net');
var util = require('util');
var path = require('path');
var events = require('events');

var commands = require('../db/command');

var Log  = require('../utils/log');
var User = require('../db/user');
var Host = require('../db/host');

var _   = require('lodash');
var sessions = require('./session');

/**
 * The network manager.
 *
 * @constructor
 * @extends events.EventEmitter
 */
function Manager() {
  events.EventEmitter.call(this);

  this.commands = {};
  this.maxUsers = 200; // default
  // expose sessions
  this.sessions = sessions;
}

util.inherits(Manager, events.EventEmitter);

Manager.prototype.setMaxUsers = function(size) {
  this.maxUsers = size;
};

/**
 * Listen for connection.
 *
 * @public
 */
Manager.prototype.listen = function() {
  var server = net.createServer();
  server.maxConnections = this.maxUsers;
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
    User.delete(session.realname);
    Host.delete(session.host);
    Log.success('%s has gone offline', session.realname || session.id);
  });

  // simple anti dos pattern

  // usually connection flooding happens from one source in
  // fast intervals. we can try to detect if connections
  // coming from the same ip is coming in too fast.
  var host = Host.select(session.host);
  if (host) {
    var delta = (Date.now() - host.lastIn);
    console.log(delta);
    if (delta < 1000 && host.count > 2) {
      Log.warn('probable dos detected from %s', session.host);
      return session.kick()
    }
  }
  Host.insert(session.host);

  // recheck if session has a nickname after 9 seconds
  // kick if still not. I mean who takes 9 seconds to think
  // of a chatroom nick :D
  setTimeout(function() {
    if (!session.realname) return session.kick();
  }, 9000);
};

Manager.prototype.send = function(sid, msg) {
  // get the session
  var session = this.sessions.get(sid);

  // i should implement a queue here

  // send msg
  session._socket.write(msg + '\r\n');
};

Manager.prototype.sendToRoom = function(room, msg, exceptMe) {
  var self = this;
  var sessions = this.sessions.inRoom(room, exceptMe);

  // send msg to all
  _.each(sessions, function(session) {
    self.send(session.id, msg);
  });
};

Manager.prototype.receive = function(data, session) {
  // should do something to telnet commands
  // noticed that when I press ctrl+C nothings gets displayed anymore
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
    if (message.charCodeAt(0) === 0x2F) {
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
function create() {
  var mgr = new Manager();

  // register all known commands
  _.each(commands, function(cmd, key) {
    mgr.registerCommand(key, cmd);
    var file = path.join(__dirname, '..', 'commands', key);
    if (fs.existsSync(file + '.js')) {
      mgr.hookCommand(key, require(file));
    }
  });

  return mgr;
}

/**
 * @export
 * @type {Object}
 */
module.exports.create = create;
