'use strict';

describe('Controller: ExecutionFiltersController @probedock(contributor=laurent.prevost@probedock.io tag=executionFilters)', function () {
  var executionFiltersController,
      executionFiltersServiceMock,
      scopeMock;

  // load the controller's module
  beforeEach(module('probedock-rt.execution-filters', function($provide) {
    executionFiltersServiceMock = {};

    $provide.value('ExecutionFiltersService', executionFiltersServiceMock);
  }));

  beforeEach(inject(function ($controller) {
    scopeMock = {};

    executionFiltersController = $controller('ExecutionFiltersController', { $scope: scopeMock });
  }));

  it ('retrieving the filters is delegated to the service', function () {
    executionFiltersServiceMock.filters = jasmine.createSpy();

    executionFiltersController.filters();

    expect(executionFiltersServiceMock.filters).toHaveBeenCalled();
  });

  it ('the filter text input should be filled to let the possibility to add the filter', function() {
    executionFiltersServiceMock.addFilter = jasmine.createSpy().and.returnValue(true);

    executionFiltersController.addFilter();
    expect(executionFiltersServiceMock.addFilter).not.toHaveBeenCalled();
    expect(scopeMock.filterText).toBeUndefined();

    executionFiltersController.addFilter('');
    expect(executionFiltersServiceMock.addFilter).not.toHaveBeenCalled();
    expect(scopeMock.filterText).toBeUndefined();

    executionFiltersController.addFilter(null);
    expect(executionFiltersServiceMock.addFilter).not.toHaveBeenCalled();
    expect(scopeMock.filterText).toBeUndefined();

    executionFiltersController.addFilter(undefined);
    expect(executionFiltersServiceMock.addFilter).not.toHaveBeenCalled();
    expect(scopeMock.filterText).toBeUndefined();

    executionFiltersController.addFilter('test');
    expect(executionFiltersServiceMock.addFilter).toHaveBeenCalledWith('test');
    expect(scopeMock.filterText).toEqual('');
  });

  it ('remove a filter should remove from the service and validate the input field again', function() {
    executionFiltersServiceMock.removeFilter = jasmine.createSpy();

    scopeMock.executionFiltersForm = {
      executionFiltersInput: {
        $validate: jasmine.createSpy()
      }
    };

    executionFiltersController.removeFilter({ key: '*:test' });

    expect(executionFiltersServiceMock.removeFilter).toHaveBeenCalledWith('*:test');
    expect(scopeMock.executionFiltersForm.executionFiltersInput.$validate).toHaveBeenCalled();
  });

  it ('remove all the filters should remove them from the service and validate the input field again', function() {
    executionFiltersServiceMock.removeAll = jasmine.createSpy();

    scopeMock.executionFiltersForm = {
      executionFiltersInput: {
        $validate: jasmine.createSpy()
      }
    };

    executionFiltersController.removeAllFilters();

    expect(executionFiltersServiceMock.removeAll).toHaveBeenCalled();
    expect(scopeMock.executionFiltersForm.executionFiltersInput.$validate).toHaveBeenCalled();
  });

  it ('should be possible to get a css class corresponding to the filter type', function() {
    expect(executionFiltersController.filterClass({ type: '*' })).toEqual('');
    expect(executionFiltersController.filterClass({ type: 'key' })).toEqual('execution-filters-element-key');
  });

  it ('should be possible to know if it is not possible to remove the filters', function() {
    executionFiltersServiceMock.hasFilters = jasmine.createSpy().and.returnValue(true);
    expect(executionFiltersController.isRemoveAllFiltersDisabled()).toBeFalsy();

    executionFiltersServiceMock.hasFilters = jasmine.createSpy().and.returnValue(false);
    expect(executionFiltersController.isRemoveAllFiltersDisabled()).toBeTruthy();
  });
});
