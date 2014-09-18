/**
 * Lobby acts as a load balancer.
 */
'use strict';

var Network = require('../network/manager').init();
var Log     = require('../utils/log');

function start(config) {
  var host = config.host;
  var port = config.port;
  var env  = config.env;

  Log.info('booting in %s', env);

  Network.listen(port, host, function listen_callback() {
    Log.info('staged on %s:%s', host, port);
  });
}

/**
 * Public...
 * @type {Object}
 */
module.exports = {
  start: start
}
