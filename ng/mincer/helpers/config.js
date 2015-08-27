var
  _ = require('underscore'),
  config = require('../../config');

module.exports = function() {
  return {
    version: config.app.version,
    env: process.env.NODE_ENV,
    port: config.port,
    host: config.host
  };
};
