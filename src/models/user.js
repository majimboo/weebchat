'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  realname: {
    type: String,
    unique: true
  },
  nickname: {
    type: String,
    unique: true
  }
});

module.exports = mongoose.model('User', User);
