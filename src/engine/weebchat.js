'use strict';

var kamote   = require('kamote');
var mongoose = require('mongoose');

var Network = new kamote.Server();
var Remote  = new kamote.Client();

var Log     = require('../utils/log');

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
 * @param  {String} host - Host to bind to.
 * @param  {Number} port - Port to bind to.
 * @param  {String} env  - Environment to run in.
 */
function start(config) {
  var host = config.host;
  var port = config.port;
  var env  = config.env;

  Log.info('booting in %s', env);

  // connect to mongodb
  var mongodb = mongodb_connect('mongodb://localhost/qchat_test');
  mongodb.on('connected', function() {
    Log.info('database connection established');
  });

  Network.listen(port, host, function listen_callback() {
    Log.info('staged on %s:%s', host, port);
    bootNetwork();
  });

  // connect to RPC server
  Remote.reconnect(config.inter_port, config.inter_port);
  bootRemote(config);
}

function bootNetwork() {
  Network.add(join);
  Network.add(makeRoom);
}

function bootRemote(config) {
  Remote.on('connect', function() {
    Log.info('lobby connection established');
  });
  Remote.on('disconnect', function() {
    Log.warn('lobby connection lost');
  });
  Remote.on('ready', function() {
    Remote.addToPool({ host: config.host, port: config.port });
  });
}

function join(msg, session) {
  console.log(session);
}

function makeRoom(msg, session) {
  console.log(session);
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
