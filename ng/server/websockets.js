var
  _ = require('underscore'),
  logger = require('./logger')('websockets'),
  websockets = require('socket.io');

module.exports = function(server) {
  var io = websockets(server, { serveClient: false });
  logger.debug('Listening for websockets connections');

  io.on('connection', function(socket) {
    logger.debug('Client connected');

    _.each([ 'help', 'i18n', 'print', 'scroll', 'view' ], function(event) {
      socket.on('control:' + event, function(data) {
        socket.broadcast.emit('control:' + event, data);
        logger.debug('Control screen emitted "control:' + event + '": ' + JSON.stringify(data));
      });
    });

    socket.on('control:state', function(data) {
      socket.broadcast.emit('control:state', data);
      logger.debug('Control screen changed state to "' + data.state + '": ' + JSON.stringify(data.params));
    });
  });

  return io;
};
