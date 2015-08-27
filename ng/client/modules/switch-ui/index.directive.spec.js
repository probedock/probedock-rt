'use strict';

describe('Directive: SwitchUi @probedock(contributor=laurent.prevost@probedock.io tag=switchUi)', function () {
  var $compile,
      $rootScope,
      switchUiControllerMock;

  // load the controller's module
  beforeEach(module('probedock-rt.switch-ui', function($controllerProvider) {
    switchUiControllerMock = {
      switch: jasmine.createSpy()
    };

    $controllerProvider.register('SwitchUiController', function() { return switchUiControllerMock; });
  }));

  beforeEach(inject(function (_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it ('Replaces the element with the appropriate content', function() {
    var element = $compile("<switch-ui><p>Some internal content</p></switch-ui>")($rootScope);

    $rootScope.$digest();

    expect(element.html()).toContain("Some internal content");
  });

  it ('Click on the element should call the switch on the controller', function() {
    var element = $compile("<switch-ui ng-click=\"switchUiCtrl.switch(\'test\')\"><p>Some internal content</p></switch-ui>")($rootScope);

    $rootScope.$digest();

    element.eq(0).click();

    expect(switchUiControllerMock.switch).toHaveBeenCalledWith('test');
  });
});
