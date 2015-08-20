var
  _ = require('underscore'),
  express = require('express'),
  logger = require('./logger')('assets'),
  path = require('path');

module.exports = function(app) {
  var config = require('../config');

  // in development, live-compile assets with the asset pipeline
  if (process.env.NODE_ENV == 'development') {
    var mincer = require('mincer'),
        mincerEnvironment = require(path.join(config.root, 'mincer', 'environment'));

    app.use('/assets', mincer.createServer(mincerEnvironment));

    var templateHelpers = require(path.join(config.root, 'mincer', 'helpers', 'templates'));
    _.extend(app.locals, templateHelpers());

    logger.debug('Assets will be compiled live through mincer (configuration in mincer/environment.js)');
  }

  // in production, use pre-compiled assets
  else {
    app.use(express.static(path.join(config.root, 'public')));

    logger.debug('Assets have been precompiled (configuration in mincer/environment.js) and will be served statically from the "public" directory');
  }
};
