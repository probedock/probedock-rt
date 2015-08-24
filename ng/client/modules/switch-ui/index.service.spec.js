'use strict';

describe('Service: SwitchUiService @probedock(contributor=laurent.prevost@probedock.io tag=switchUi', function () {
  var switchUiService,
      $stateMock;

  // load the controller's module
  beforeEach(module('probedock-rt.switch-ui', function($provide) {
    $stateMock = {
      go: jasmine.createSpy()
    };

    $provide.value('$state', $stateMock);
  }));

  beforeEach(inject(function ($injector) {
    switchUiService = $injector.get('SwitchUiService');
  }));

  it ('should not change the state when already in the state', function() {
    switchUiService.switch('help');
    expect($stateMock.go).not.toHaveBeenCalled();
  });

  it ('should change the state when the new state is different', function() {
    switchUiService.switch('test');
    expect($stateMock.go).toHaveBeenCalledWith('test');
  })
});
