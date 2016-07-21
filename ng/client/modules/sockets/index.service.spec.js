'use strict';

describe('Service: Socket @probedock(contributor=laurent.prevost@probedock.io tag=socket)', function () {
  var
    configMock,
    socketMock,
    socketFactoryMock,
    socketService;

  beforeEach(module('probedock-rt.sockets', function($provide) {
    io = {
      connect: jasmine.createSpy().and.callFake(function(url) {
        expect(url).toEqual('http://localhost:1234');
        return socketMock;
      })
    };

    configMock = {
      host: 'localhost',
      port: 1234
    };

    socketMock = {
      forward: jasmine.createSpy()
    };

    socketFactoryMock = jasmine.createSpy().and.callFake(function(config) {
      expect(config).toEqual({
        ioSocket: socketMock
      });

      return socketMock;
    });

    $provide.value('config', configMock);
    $provide.value('socketFactory', socketFactoryMock);
  }));

  beforeEach(inject(function ($injector) {
    socketService = $injector.get('socket');
  }));

  it ('The socket service should be correctly initialized to forward the notifications', function() {
    expect(socketMock.forward.calls.count()).toEqual(3);
    expect(socketMock.forward).toHaveBeenCalledWith('run:start');
    expect(socketMock.forward).toHaveBeenCalledWith('run:test:result');
    expect(socketMock.forward).toHaveBeenCalledWith('run:end');
  });
});
