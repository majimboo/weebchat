'use strict';

var fs   = require('fs');
var path = require('path');

function validateName(name) {
  if (/^(#?)[A-Za-z0-9_\-]{2,16}$/i.test(name)) return true;
  return false;
}

function loadManual() {
  var manualPath   = path.join(__dirname, '../../config/manual.txt');
  var resolvedPath = path.resolve(manualPath);
  return fs.readFileSync(resolvedPath);
}

module.exports = {
  validateName: validateName,
  loadManual: loadManual
}
