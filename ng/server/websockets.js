var logger = require('./logger')('websockets');

module.exports = function(socketIo, filtersSocket, testRunSocket) {
  return function (server) {
    var io = socketIo(server);

    logger.debug('Listening for websockets connections');

    io.on('connect', function(socket) {
      filtersSocket(socket);
      testRunSocket(socket);
    });
  };
};

module.exports['@require'] = [ 'socket.io', 'socket/filtersSocket', 'socket/testRunSocket' ];
