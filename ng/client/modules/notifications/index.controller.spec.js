'use strict';

describe('Controller: NotiificationsController @probedock(contributor=laurent.prevost@probedock.io tag=notifications)', function () {
  var notificationsController,
      scopeMock;

  beforeEach(module('probedock-rt.notifications', function($provide) {
  }));

  beforeEach(inject(function ($controller) {
    scopeMock = {
      $on: jasmine.createSpy()
    };
    notificationsController = $controller('NotificationsController', { $scope: scopeMock });
  }));

  it ('The controller should be correctly configured to listen the three notification events', function () {
    expect(scopeMock.$on.calls.count()).toEqual(3);
    expect(scopeMock.$on).toHaveBeenCalledWith('socket:run:start', jasmine.any(Function));
    expect(scopeMock.$on).toHaveBeenCalledWith('socket:run:test:result', jasmine.any(Function));
    expect(scopeMock.$on).toHaveBeenCalledWith('socket:run:end', jasmine.any(Function));
  });
});
