'use strict';

describe('Service: ExecutionFiltersService', function () {
  var executionFiltersService,
    executionFiltersSocketServiceMock;

  // load the controller's module
  beforeEach(module('probedock-rt.execution-filters', function ($provide) {
    executionFiltersSocketServiceMock = {
      sendFilters: jasmine.createSpy()
    };

    $provide.value('ExecutionFiltersSocketService', executionFiltersSocketServiceMock);
  }));

  beforeEach(inject(function ($injector) {
    executionFiltersService = $injector.get('ExecutionFiltersService');
  }));

  it ('should be possible to retrieve the filters', function() {
    expect(executionFiltersService.addFilter('test')).toBeTruthy();

    var result = {
      '*:test':{
        type: '*',
        text: 'test',
        textSummary: 'test',
        key: '*:test',
        ui: jasmine.any(Object)
      }
    };

    expect(executionFiltersSocketServiceMock.sendFilters).toHaveBeenCalledWith(result);
    expect(executionFiltersService.filters()).toEqual(result);
  });

  it ('should be possible to define each of the six type of filters', function() {
    var result = {};

    _.each(['key', 'fp', 'name', 'tag', 'ticket', '*'], function(type) {
      expect(executionFiltersService.addFilter(type + ':test')).toBeTruthy();

      result[type + ':test'] = {
        type: type,
        text: 'test',
        textSummary: 'test',
        key: type + ':test',
        ui: jasmine.any(Object)
      };

      expect(executionFiltersService.filters()).toEqual(result);
    });
  });

  it ('defining a filter without a specific type will fallback to the generic filter', function() {
    var result = {
      '*:test': {
        type: '*',
        text: 'test',
        textSummary: 'test',
        key: '*:test',
        ui: jasmine.any(Object)
      }
    };

    expect(executionFiltersService.addFilter('test')).toBeTruthy();
    expect(executionFiltersService.filters()).toEqual(result);
  });

  it ('should not be possible to define a duplicated filter', function() {
    expect(executionFiltersService.addFilter('test')).toBeTruthy();
    expect(executionFiltersService.addFilter('test')).toBeFalsy();
  });

  it ('a filter removed by its key should not be there anymore', function() {
    expect(executionFiltersService.addFilter('test')).toBeTruthy();

    executionFiltersService.removeFilter('*:test');

    expect(executionFiltersService.filters()).toEqual({});
    expect(executionFiltersSocketServiceMock.sendFilters).toHaveBeenCalledWith({});
  });

  it ('should be possible to know if filters are present', function() {
    expect(executionFiltersService.hasFilters()).toBeFalsy();

    executionFiltersService.addFilter('test');

    expect(executionFiltersService.hasFilters()).toBeTruthy();
  });

  it ('should be possible to know if a specific filter is present', function() {
    expect(executionFiltersService.hasFilterByText('test')).toBeFalsy();

    executionFiltersService.addFilter('test');

    expect(executionFiltersService.hasFilterByText('test')).toBeTruthy();
  });
});
