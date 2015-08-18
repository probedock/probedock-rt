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
   	});

   	socket.on('filters:reset', function() {
   		filters.filters = [];
   	});

  });

  return io;
};
