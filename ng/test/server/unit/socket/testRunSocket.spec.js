'use strict';

describe('Socket: TestRunSocket @probedock(contributor=laurent.prevost@probedock.io tag=server tag=socket)', function () {
  var
    testRunSocket,
    testRunSocketFactory,
    socketMock;

  beforeEach(function() {
    socketMock = {
      on: jasmine.createSpy(),
      broadcast: {
        emit: jasmine.createSpy()
      }
    };

    testRunSocketFactory = require('../../../../server/socket/testRunSocket')();
  });

  it('listeners should be configured for run start, end and test result events', function() {
    testRunSocketFactory(socketMock);

    expect(socketMock.on).toHaveBeenCalledWith('run:start', jasmine.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('run:test:result', jasmine.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('run:end', jasmine.any(Function));
  });

  it('run start event should broadcast what was received', function() {
    var runStartHandler;

    socketMock.on = function(event, fn) {
      if (event === 'run:start') {
        runStartHandler = fn;
      }
    };

    testRunSocketFactory(socketMock);

    runStartHandler({
      project: {
        apiId: 'abcdefg',
        version: '1.2.3'
      },
      category: 'unit'
    });

    expect(socketMock.broadcast.emit).toHaveBeenCalledWith('run:start', {
      project: {
        apiId: 'abcdefg',
        version: '1.2.3'
      },
      category: 'unit'
    });
  });

  it('run test result event should broadcast what was received', function() {
    var runTestResultHandler;

    socketMock.on = function(event, fn) {
      if (event === 'run:test:result') {
        runTestResultHandler = fn;
      }
    };

    testRunSocketFactory(socketMock);

    runTestResultHandler({
      key: 'abcdefghij',
      fingerprint: 'sha-1',
      name: 'human name',
      project: {
        apiId: 'abcdefg',
        version: '1.2.3'
      },
      active: true,
      passed: false,
      duration: 12,
      message: 'description of what was wrong or correct',
      category: 'unit',
      tags: [
        'a',
        'b',
        'c'
      ],
      tickets: [
        't1',
        't2'
      ],
      data: {
        a: 'b',
        c: 'd'
      }
    });

    expect(socketMock.broadcast.emit).toHaveBeenCalledWith('run:test:result', {
      key: 'abcdefghij',
      fingerprint: 'sha-1',
      name: 'human name',
      project: {
        apiId: 'abcdefg',
        version: '1.2.3'
      },
      active: true,
      passed: false,
      duration: 12,
      message: 'description of what was wrong or correct',
      category: 'unit',
      tags: [
        'a',
        'b',
        'c'
      ],
      tickets: [
        't1',
        't2'
      ],
      data: {
        a: 'b',
        c: 'd'
      }
    });
  });

  it('run end event should broadcast what was received', function() {
    var runEndHandler;

    socketMock.on = function(event, fn) {
      if (event === 'run:end') {
        runEndHandler = fn;
      }
    };

    testRunSocketFactory(socketMock);

    runEndHandler({
      project: {
        apiId: 'abcdefg',
        version: '1.2.3'
      },
      category: 'unit',
      duration: 123
    });

    expect(socketMock.broadcast.emit).toHaveBeenCalledWith('run:end', {
      project: {
        apiId: 'abcdefg',
        version: '1.2.3'
      },
      category: 'unit',
      duration: 123
    });
  });
});
