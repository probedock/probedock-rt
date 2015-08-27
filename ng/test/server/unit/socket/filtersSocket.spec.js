'use strict';

describe('Socket: FiltersSocket @probedock(contributor=laurent.prevost@probedock.io tag=server tag=socket)', function () {
  var
    filtersSocket,
    filtersSocketFactory,
    filtersServiceMock,
    socketMock;

  beforeEach(function() {
    filtersServiceMock = {
      setFilters: jasmine.createSpy(),
      getFilters: jasmine.createSpy().and.returnValue({}),
      reset: jasmine.createSpy()
    };

    socketMock = {
      on: jasmine.createSpy(),
      broadcast: {
        emit: jasmine.createSpy()
      }
    };

    filtersSocketFactory = require('../../../../server/socket/filtersSocket')(filtersServiceMock);
  });

  it('listeners should be configured for set, get and reset events', function() {
    filtersSocketFactory(socketMock);

    expect(socketMock.on).toHaveBeenCalledWith('filters:set', jasmine.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('filters:get', jasmine.any(Function));
    expect(socketMock.on).toHaveBeenCalledWith('filters:reset', jasmine.any(Function));
  });

  it('the set event listener should call the setFilters on filtersService', function() {
    var setHandler;

    socketMock.on = function(event, fn) {
      if (event === 'filters:set') {
        setHandler = fn;
      }
    };

    filtersSocketFactory(socketMock);

    setHandler({
      filters: [{
        type: '*',
        text: 'a'
      }]
    });

    expect(filtersServiceMock.setFilters).toHaveBeenCalledWith([{
      type: '*',
      text: 'a'
    }]);
  });

  it('the get event listener should call the getFilters on filtersService', function() {
    var getHandler;

    socketMock.on = function(event, fn) {
      if (event === 'filters:get') {
        getHandler = fn;
      }
    };

    filtersSocketFactory(socketMock);

    getHandler(function(data) {
      expect(data).toEqual({});
    });

    expect(filtersServiceMock.getFilters).toHaveBeenCalled();
  });

  it('the reset event listener should call the reset on filtersService', function() {
    var resetHandler;

    socketMock.on = function(event, fn) {
      if (event === 'filters:reset') {
        resetHandler = fn;
      }
    };

    filtersSocketFactory(socketMock);

    resetHandler();

    expect(filtersServiceMock.reset).toHaveBeenCalled();
  });

  it('set filters should call a broadcast of what was received in test mode', function() {
    process.env.SOCKETIO_TEST = null;

    var setHandler;

    socketMock.on = function(event, fn) {
      if (event === 'filters:set') {
        setHandler = fn;
      }
    };

    filtersSocketFactory(socketMock);

    setHandler({
      filters: [{
        type: '*',
        text: 'a'
      }]
    });

    expect(socketMock.broadcast.emit).not.toHaveBeenCalled();

    process.env.SOCKETIO_TEST = 'test';

    setHandler({
      filters: [{
        type: '*',
        text: 'a'
      }]
    });

    expect(socketMock.broadcast.emit).toHaveBeenCalledWith('test:filters:set', {
      filters: [{
        type: '*',
        text: 'a'
      }]
    });
  });

  it('reset filters should call a broadcast of what was received in test mode', function() {
    process.env.SOCKETIO_TEST = null;

    var resetHandler;

    socketMock.on = function(event, fn) {
      if (event === 'filters:reset') {
        resetHandler = fn;
      }
    };

    filtersSocketFactory(socketMock);

    resetHandler();

    expect(socketMock.broadcast.emit).not.toHaveBeenCalled();

    process.env.SOCKETIO_TEST = 'test';

    resetHandler();

    expect(socketMock.broadcast.emit).toHaveBeenCalledWith('test:filters:reset');
  });
});
