'use strict';

describe('Service: ExecutionFiltersSocketService @probedock(contributor=laurent.prevost@probedock.io tag=executionFilters)', function () {
  var executionFiltersSocketService,
      socketMock;

  // load the controller's module
  beforeEach(module('probedock-rt.execution-filters', function($provide) {
    socketMock = {
      emit: jasmine.createSpy()
    };

    $provide.value('socket', socketMock);
  }));

  beforeEach(inject(function ($injector) {
    executionFiltersSocketService = $injector.get('ExecutionFiltersSocketService');
  }));

  it ('should reset the filters when passing null or empty filter object', function() {
    executionFiltersSocketService.sendFilters(null);
    expect(socketMock.emit).toHaveBeenCalledWith('filters:reset');

    executionFiltersSocketService.sendFilters(undefined);
    expect(socketMock.emit).toHaveBeenCalledWith('filters:reset');

    executionFiltersSocketService.sendFilters({});
    expect(socketMock.emit).toHaveBeenCalledWith('filters:reset');
  });

  it ('should send the filters when passing an object with filters', function() {
    executionFiltersSocketService.sendFilters({
      filter1: {
        type: 'test',
        text: 'test'
      }
    });

    expect(socketMock.emit).toHaveBeenCalledWith('filters:set', {
      filters: [{
        type: 'test',
        text: 'test'
      }]
    });
  });

  it ('should send filtery only with type and text properties', function() {
    executionFiltersSocketService.sendFilters({
      filter1: {
        type: 'test',
        text: 'test',
        otherProperty: 'test'
      }
    });

    expect(socketMock.emit).toHaveBeenCalledWith('filters:set', {
      filters: [{
        type: 'test',
        text: 'test'
      }]
    });
  })
});
