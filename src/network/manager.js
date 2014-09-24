'use strict';

var _ = require('lodash');
var fs = require('fs');
var net = require('net');
var util = require('util');
var path = require('path');
var events = require('events');

var commands = require('../db/command');
var sessions = require('./session');

var Log  = require('../utils/log');
var Host = require('../db/host');

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

  // simple anti dos pattern

  // usually connection flooding happens from one source in
  // fast intervals. we can try to detect if connections
  // coming from the same ip is coming in too fast.
  var host = Host.select(session.host);
  if (host) {
    var delta = Date.now() - host.lastIn;
    if (delta < 1000 && host.count > 2) {
      Log.warn('probable dos detected from %s', session.host);
      return session.kick();
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

Manager.prototype.send = function() {
  var args = _.toArray(arguments);
  var sid  = args.shift();

  // get the session
  var session = this.sessions.get(sid);

  // format the msg
  var msg = util.format.apply(null, args);

  // maybe a queue here?

  // send msg
  session._socket.write(msg + '\r\n');
};

Manager.prototype.sendRaw = function(sid, msg) {
  // get the session
  var session = this.sessions.get(sid);

  // send msg
  session._socket.write(msg + '\r\n');
};

Manager.prototype.sendToRoom = function(room, msg, except) {
  var self = this;
  var sessions = this.sessions.inRoom(room, except);

  // send msg to all
  _.each(sessions, function(session) {
    self.send(session.id, msg);
  });
};

Manager.prototype.receive = function(data, session) {
  // should do something to telnet commands
  // noticed that when I press ctrl+C nothings gets displayed anymore
  var self = this;
  var userRoom = session.getRoom();

  // validation
  var stranger = (!session.realname && !session.nickname);

  // handle received data here
  var container = '';

  // text based protocol
  if (data instanceof Buffer) {
    data = data.toString();
  }

  // stream framing
  data = container + data;
  var lines = data.split(/\r?\n/);
  container = lines.pop();

  _.each(lines, function(message) {
    // do not allow beyond 100 characters
    if (message.length > 100) {
      return this.send(session.id, 'Sorry, cannot exceed 100 characters');
    }

    // clean messages
    message = message.replace(/(\r\n|\n|\r)/gm, '');

    // must ask for name
    if (stranger) return self.command_callback('enter', [message], session);

    // commands
    if (message.charCodeAt(0) === 0x2F) {
      var argv = message.substr(1).split(/[\s]+/);
      var command = argv.shift();
      return self.command_callback(command, argv, session);
    }

    // fallback all none commands when in room to chat
    if (userRoom) return self.command_callback('chat', [message], session);

    self.send(session.id, 'Sorry, invalid request.');
  });
};

Manager.prototype.command_callback = function(action, messages, session) {
  var self = this;

  // also check if action is not native_code
  var command   = self.getCommand(action);
  var isAllowed = (session.permission >= command.permission);
  var noCommand = (command === false);
  var commandCb = (!!command.callback);

  var sid = session.id;
  var uid = session.realname || sid;

  // check if command is valid
  if (noCommand) {
    Log.warn('invalid command [%s] invoked by %s', action, uid);
    return self.send(sid, 'Sorry, invalid command.');
  }

  // check permissions
  if (!isAllowed) return self.send(sid, 'Sorry, you cannot use this command.');

  // check command arity
  var cmdStruct  = command.struct(messages);
  var cmdArity   = command.manual.usage.match(/<[^>]*>/g) || [];
  var validArity = cmdArity.length === _.compact(_.toArray(cmdStruct)).length;
  if (!validArity) return self.send(sid, command.manual.usage);

  // confirm command has a callback handler
  if (commandCb) {
    return command.callback(cmdStruct, session, function(reply) {
      if (reply) self.send(sid, util.format.apply(null, arguments));
    });
  }

  // fallback if none of the conditions above are met
  Log.warn('something went wrong with [%s] command', action);
};

Manager.prototype.listen_callback = function() {
  Log.info('staged on %s:%s', this.address().address, this.address().port);
};

Manager.prototype.getCommand = function(action) {
  if (!action) return this.commands;

  if (this.commands.hasOwnProperty(action)) {
    return this.commands[action];
  }

  return false;
};

Manager.prototype.registerCommand = function(name, command) {
  // validate params
  if (!name) throw new Error('command name is required');
  if (!command) throw new Error('command is required');

  if (!command.callback) throw new Error(name + ' is missing a callback');
  if (!command.struct) throw new Error(name + ' is missing a struct');
  if (!command.manual) throw new Error(name + ' is missing a manual');
  if (!command.permission) throw new Error(name + ' is missing a permission');

  this.commands[name] = command;
};

var manager = null;

/**
 * Creates a new weebchat manager.
 *
 * @return {Manager}
 */
function create() {
  if (manager) {
    throw new Error('Manager already exists.');
  }

  manager = new Manager();

  // register all known commands
  _.each(commands, function(name) {
    var file = path.join(__dirname, '..', 'commands', name);
    if (fs.existsSync(file + '.js')) {
      manager.registerCommand(name, require(file));
    }
  });

  return manager;
}

function get() {
  if (!manager) {
    throw new Error('No manager exists.');
  }

  return manager;
}

/**
 * @export
 * @type {Object}
 */
module.exports = {
  create: create,
  get: get
};
