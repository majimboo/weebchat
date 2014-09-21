'use strict';

var CMD = {};

CMD.HELP = function(msg) {
  return msg;
}

CMD.ENTER = function(msg) {
  return {
    name: msg
  }
}

CMD.ROOMS = function(msg) {
  return msg;
}

CMD.SERVERS = function(msg) {
  return msg;
}

CMD.NICK = function(msg) {
  return {
    nick: msg[0]
  }
}

CMD.CREATE = function(msg) {
  return {
    name: msg[0]
  }
}

CMD.JOIN = function(msg) {
  return {
    room: msg[0]
  }
}

CMD.CHAT = function(msg) {
  return {
    msg: msg
  }
}

CMD.ME = function(msg) {
  return {
    msg: msg.join(' ')
  }
}

CMD.MSG = function(msg) {
  return {
    nick: msg.shift(),
    msg: msg.join(' ')
  }
}

CMD.LEAVE = function(msg) {
  return msg;
}

CMD.QUIT = function(msg) {
  return msg;
}

module.exports = CMD;
