'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Room = new Schema({
  name: {
    type: String,
    unique: true
  },
  users: [Schema.Types.Mixed],
  archive: [Schema.Types.Mixed],
  operators: [String],
  loc: String
});

module.exports = mongoose.model('Room', Room);
