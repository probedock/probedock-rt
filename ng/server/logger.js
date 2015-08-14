var
  _ = require('underscore'),
  log4js = require('log4js'),
  config = require('../config');

module.exports = function(tag, options) {
  var logger = log4js.getLogger(tag);
  logger.setLevel(options && options.level ? options.level : 'TRACE');

  if (options && options.filter) {

    var originalLog = logger.log;
    logger.log = function() {
      if (options.filter.apply(options.filterContext, arguments)) {
        originalLog.apply(logger, arguments);
      }
    };
  }

  return logger;
};
