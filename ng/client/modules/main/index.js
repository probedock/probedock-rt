angular.module('probedock-rt.main', [ 'probedock-rt.sockets' ])
  .controller('MainCtrl', function($scope, socket) {
    //var ioSocket = socket();

    socket.on('connect', function() {
      console.log('connected');
    })
  });
