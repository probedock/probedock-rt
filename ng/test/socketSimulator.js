var
  config = require('../config'),
  io = require('socket.io-client');

var socket = io('http://' + config.host + ':' + config.port);

var nbStartNotifications = 1;

if (process.argv[2]) {
  nbStartNotifications = process.argv[2];
}

console.log('Will emit %s notification%s', nbStartNotifications, nbStartNotifications > 1 ? 's' : '');

for (var i = 0; i < nbStartNotifications; i++) {
  console.log('Emit start notification #%s', i);
  socket.emit('run:start', {
    project: {
      apiId: 'abcdefgh',
      version: '1.2.3'
    },
    category: 'unit'
  });
}

//socket.on('closing', function() {
//  process.exit();
//});

//socket.close();
