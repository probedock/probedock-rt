'use strict';

describe('Controller: SwitchUiController', function () {
  var SwitchUiController;
  var SwitchUiServiceFactoryMock;

  // load the controller's module
  beforeEach(module('probedock-rt.switch-ui', function($provide) {
    SwitchUiServiceFactoryMock = {
      switch: jasmine.createSpy()
    };

    $provide.value('SwitchUiService', SwitchUiServiceFactoryMock);
  }));

  beforeEach(inject(function ($controller) {
    SwitchUiController = $controller('SwitchUiController');
  }));

  it ('should delegate the UI mode to the service', function () {
    SwitchUiController.switch('test');
    expect(SwitchUiServiceFactoryMock.switch).toHaveBeenCalledWith('test');
  });
});
