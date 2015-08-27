var
  _ = require('underscore'),
  ioc = require('./ioc');

if (_.isUndefined(process.env.NODE_ENV)) {
  process.env.NODE_ENV = 'development';
}

var
  express = require('express'),
  fs = require('fs'),
  http = require('http'),
  logger = require('./logger')('app'),
  p = require('bluebird'),
  path = require('path');

p.promisifyAll(fs);
p.promisifyAll(http.Server.prototype);

var
  app = express(),
  config = require('../config');

//app.set('config', config);

//logger.info('Starting in ' + process.env.NODE_ENV + ' environment...');
//logger.debug('Configuration: ' + JSON.stringify(config.values()));

require('./express')(app);
require('./assets')(app);
require('./views')(app);
require('./handlers')(app);

var port = normalizePort(config.port);
app.set('port', port);

var server = http.createServer(app);

ioc.create('websockets')(server);

p.resolve().then(startServer).then(onListening, onError);

function startServer() {
  return server.listenAsync(port);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  logger.info('Listening on ' + bind);
}
