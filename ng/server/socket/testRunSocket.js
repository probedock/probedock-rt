var
  _ = require('underscore'),
  util = require('util'),
  logger = require('../logger')('websockets');

module.exports = function() {
  return function(socket) {
    socket.on('run:start', function(data) {
      logger.debug('Test run start');
      logger.debug(util.inspect(data));

   		socket.broadcast.emit('run:start', data);
   	});

   	socket.on('run:test:result', function(data) {
      logger.debug('Test run test result');
      logger.debug(util.inspect(data));

   		socket.broadcast.emit('run:test:result', data);
   	});

   	socket.on('run:end', function(data) {
      logger.debug('Test run end');
      logger.debug(util.inspect(data));

   		socket.broadcast.emit('run:end', data);
   	});
	};
};

module.exports['@require'] = [ ];
