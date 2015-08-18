angular.module('probedock-rt.sockets', [ 'btford.socket-io', 'probedock-rt.config' ])
  .factory('socket', function(config, socketFactory) {
    return socketFactory({
      ioSocket: io.connect('http://' + config.host + ':' + config.port)
    });
  })
;
