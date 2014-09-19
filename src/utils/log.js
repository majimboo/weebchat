/**
 * Transport based logging. Allows us to use console.log for
 * development and database/file logging when in production.
 */
'use strict';

var styles = {
  bold:      ['\u001b[1m',  '\u001b[22m'],
  italic:    ['\u001b[3m',  '\u001b[23m'],
  underline: ['\u001b[4m',  '\u001b[24m'],
  inverse:   ['\u001b[7m',  '\u001b[27m'],
  black:     ['\u001b[30m', '\u001b[39m'],
  red:       ['\u001b[31m', '\u001b[39m'],
  green:     ['\u001b[32m', '\u001b[39m'],
  yellow:    ['\u001b[33m', '\u001b[39m'],
  blue:      ['\u001b[34m', '\u001b[39m'],
  magenta:   ['\u001b[35m', '\u001b[39m'],
  cyan:      ['\u001b[36m', '\u001b[39m'],
  white:     ['\u001b[37m', '\u001b[39m'],
  default:   ['\u001b[39m', '\u001b[39m'],
  grey:      ['\u001b[90m', '\u001b[39m'],
  bgBlack:   ['\u001b[40m', '\u001b[49m'],
  bgRed:     ['\u001b[41m', '\u001b[49m'],
  bgGreen:   ['\u001b[42m', '\u001b[49m'],
  bgYellow:  ['\u001b[43m', '\u001b[49m'],
  bgBlue:    ['\u001b[44m', '\u001b[49m'],
  bgMagenta: ['\u001b[45m', '\u001b[49m'],
  bgCyan:    ['\u001b[46m', '\u001b[49m'],
  bgWhite:   ['\u001b[47m', '\u001b[49m'],
  bgDefault: ['\u001b[49m', '\u001b[49m']
};

function Log(options) {
  options = options || {};

  var transport = options.transport || 'console';

  this.logger = console.log;
}

Log.prototype.format = function(color, type,  argv, full) {
  var args = Array.prototype.slice.call(argv, 0);
  var style = styles[color];
  var msg = args.shift();
  if (full)
    args.unshift(style[0] + type + ': ' + (msg || '') + style[1]);
  else
    args.unshift(style[0] + type + ':' + style[1] + ' ' + (msg || ''));
  return args;
};

Log.prototype.info = function() {
  this.logger.apply(this, this.format('blue', 'info', arguments));
};

Log.prototype.success = function() {
  this.logger.apply(this, this.format('green', '!!!!', arguments, true));
};

Log.prototype.debug = function() {
  this.logger.apply(this, this.format('cyan', 'dbug', arguments));
};

Log.prototype.warn = function() {
  this.logger.apply(this, this.format('magenta', 'warn', arguments));
};

Log.prototype.cls = function() {
  process.stdout.write('\u001B[2J\u001B[f');
};

/**
 * @export
 */
module.exports = new Log();
