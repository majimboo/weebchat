'use strict';

function validateName(name) {
  if (/^(#?)[A-Za-z0-9_\-]{3,16}$/i.test(name)) return true;
  return false;
}

module.exports = {
  validateName: validateName
}
