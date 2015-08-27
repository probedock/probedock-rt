'use strict';

describe('Socket: Websockets @probedock(contributor=laurent.prevost@probedock.io tag=server tag=socket)', function () {
  var
    socketIoMockFactory,
    socketIoMock,
    filterSocketMock,
    testRunSocketMock,
    serverMock,
    socketMock,
    websockets;

  beforeEach(function() {
    serverMock = jasmine.createSpy();

    socketMock = jasmine.createSpy();

    socketIoMock = {
      on: jasmine.createSpy().and.callFake(function(event, fn) {
        expect(event).toEqual('connect');
        fn(socketMock);
      })
    };

    socketIoMockFactory = function(server) {
      expect(server).toEqual(serverMock);
      return socketIoMock;
    };

    filterSocketMock = jasmine.createSpy();
    testRunSocketMock = jasmine.createSpy();

    websockets = require('../../../server/websockets')(socketIoMockFactory, filterSocketMock, testRunSocketMock);
  });

  it('The websockets should be correctly initialized to listen/emit for filters and test runs', function() {
    websockets(serverMock);

    expect(filterSocketMock).toHaveBeenCalledWith(socketMock);
    expect(testRunSocketMock).toHaveBeenCalledWith(socketMock);
  });
});
