'use strict';
/* Charge les automatismes des manuels (3ᵉ, 1re, Tle) sous Node : tests et vérifications. */
const path = require('path');
module.exports = () => ({
  a3: require(path.join(__dirname, 'auto3/auto.js')),
  a1: require(path.join(__dirname, 'auto1/auto.js')),
  aT: require(path.join(__dirname, 'autoT/auto.js'))
});
