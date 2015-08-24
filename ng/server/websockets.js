var
  _ = require('underscore'),
  logger = require('./logger')('websockets'),
  util = require('util'),
  websockets = require('socket.io');

var filters = {filters: []};

module.exports = function(server) {
  var io = websockets(server, { serveClient: false });
  logger.debug('Listening for websockets connections');

  io.on('connection', function(socket) {
    logger.debug('Client connected');

    socket.on('filters:set', function(data) {
   		util.log(util.inspect(data));
   		filters.filters = data.filters;

      if (process.env.SOCKETIO_TEST) {
        io.emit('test:filters:set', data);
      }
   	});

   	socket.on('filters:reset', function() {
      console.log('filters:reset');
   		filters.filters = [];

      if (process.env.SOCKETIO_TEST) {
        io.emit('test:filters:reset');
      }
   	});

  });

  return io;
};
