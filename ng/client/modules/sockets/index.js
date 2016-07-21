angular.module('probedock-rt.sockets', [ 'btford.socket-io', 'probedock-rt.config' ])
  .factory('socket', function(config, socketFactory) {
    var socket = socketFactory({
      ioSocket: io.connect('http://' + config.host + ':' + config.port)
    });

    socket.forward('run:start');
    socket.forward('run:test:result');
    socket.forward('run:end');

    return socket;
  })
;
