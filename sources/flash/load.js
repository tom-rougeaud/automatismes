'use strict';
/* Charge le moteur Flash Maths sous Node (tests et build). */
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function () {
  const code = fs.readFileSync(path.join(__dirname, 'engine_body.js'), 'utf8');
  const sandbox = { console, Math, JSON, Array, Object, String, Number, Error, __dirname };
  sandbox.require = require;
  const fn = vm.runInNewContext('(function(require,__dirname){' + code + '\n})', sandbox);
  return fn(require, __dirname);
};
