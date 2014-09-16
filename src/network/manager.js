#!/usr/bin/env node
'use strict';

var net = require('net'),
    util = require('util'),
    events = require('events'),
    //
    registry = require('../commands/registry'),
    //
    Log = require('../utils/log'),
    SessionService = require('./session');

/**
 * The network manager.
 *
 * @constructor
 * @extends events.EventEmitter
 */
function Manager(raw) {
  events.EventEmitter.call(this);
  this.commands = [];

  this.raw = !!raw;

  // expose sessions
  this.sessions = SessionService;

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
}

Manager.prototype.ready = function(server) {
  var _this = this;
  server.on('connection', function(socket) {
    _this.accept(socket);
  });
}

Manager.prototype.accept = function(socket) {
  // double check connection if it has
  // gone through proper authorities
  var _this = this;

  // create a new session
  var identity = socket.remoteAddress + ':' + socket.remotePort;
  var session  = this.sessions.create(identity, socket);

  // expose new session
  this.emit('new client', session);

  // frame all incoming stream
  socket.on('data', function(data) {
    _this.receive(data, session);
  });

  // destroy session if socket is gone
  socket.on('end', function() {
    _this.sessions.destroy(identity);
  });
}

Manager.prototype.send = function(sid, msg) {
  // get the session
  var session = this.sessions.get(sid);

  // encrypt message

  // send msg
  session.$socket.write(msg);
}

Manager.prototype.sendToRoom = function(roomId, msg) {
  var sessions = this.sessions.inRoom(roomId);
  var sessionIds = Object.keys(sessions);

  // send msg to all
  for (var i = 0; i < sessionIds.length; i++) {
    this.send(sessionIds[i], msg);
  }
}

Manager.prototype.receive = function(data, session) {
  // our protocol is text based but node.js gives as a buffer
  var req = data.toString().replace(/(\r\n|\n|\r)/gm, '');

  // treat everything as a command

  // discard all empty requests
  if (req.length <= 0) return;

  // nickname
  if (req[0] !== '/' && !session.nickname) {
    req = '/setname ' + req;
  }

  // room select
  if (req[0] !== '/' && session.nickname) return;

  // chat
  if (req[0] !== '/' && !!session.currentRoom) {
    req = '/chat ' + req;
  }

  // check the arguments;
  Log.debug(req);

  var args = req.split(' ');
  var command = this.commands[args[0].substring(1)];

  if (req[0] === '/' && !command) {
    // send back info to requestor
    this.send(session.id, 'unknown command');

    // maybe give back complete list of valid commands

    // log the unknown command and the requestor for security purposes
    return Log.warn();
  }

  if (command.callback) {
    return command.callback(args.slice(1), session);
  }

  return Log.warn('command has no registered callback');
}

Manager.prototype.registerCommand = function(cmd, level) {
  this.commands[cmd] = {};
  this.commands[cmd].level = level;
  this.commands[cmd].callback = null;
}

Manager.prototype.hookCommand = function(cmd, callback) {
  this.commands[cmd].callback = callback;
}

/**
 * Creates a new weebchat manager.
 *
 * @return {Manager}
 */
function createServer(raw) {
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
  init: createServer,
}
