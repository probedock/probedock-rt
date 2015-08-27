var
  _ = require('underscore'),
  util = require('util'),
  logger = require('../logger')('websockets');

module.exports = function(filtersService) {
  return function(socket) {
    socket.on('filters:set', function (data) {
      logger.debug(util.inspect(data));

      filtersService.setFilters(data.filters);

      if (process.env.SOCKETIO_TEST === 'test') {
        socket.broadcast.emit('test:filters:set', data);
      }
    });

    socket.on('filters:get', function(callback) {
   		callback(filtersService.getFilters());
   	});

    socket.on('filters:reset', function () {
      logger.debug('filters:reset');

      filtersService.reset();

      if (process.env.SOCKETIO_TEST === 'test') {
        socket.broadcast.emit('test:filters:reset');
      }
    });
	};
};

module.exports['@require'] = [ 'services/filtersService' ];
