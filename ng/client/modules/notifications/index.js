angular.module('probedock-rt.notifications', [])
  .controller('NotificationsController', function($scope) {
    this.notifications = 0;

    this.receivedNotification = function() {
      this.notifications++;
    };

    this.removedNotification = function() {
      this.notifications--;

      if (this.notifications == 0) {
        $scope.$digest();
      }
    };

    this.clearNotifications = function() {
      this.notifications = 0;
    };
  })

  //.directive('notificationRunStart', function() {
  //  return {
  //    replace: true,
  //    transclude: true,
  //    templateUrl: 'modules/notifications/template.html',
  //    controller: function($scope, $element) {
  //      this.remove = function() {
  //
  //      }
  //    },
  //    controllerAs: 'notificationRunStartCtrl'
  //
  //  }
  //})

  .directive('notifications', function() {
    function notificationHandling($scope, ctrl, el, data) {
      ctrl.receivedNotification();

      //console.log($scope.notifications);

      var not = angular.element(
        '<div>Type: ' + data.type + ', date: ' + data.timestamp + ', data: ' + JSON.stringify(data.properties) + '</div>'
      );

      not.bind('click', function(event) {
        ctrl.removedNotification();
        not.remove();
      });

      el.find('.notifications').prepend(not);
    }

    return {
      replace: true,
      transclude: true,
      templateUrl: 'modules/notifications/template.html',
      controller: 'NotificationsController',
      controllerAs: 'notificationsCtrl',
      link: function($scope, el, attr, notificationsController) {
        console.log('there');
        $scope.$on('socket:run:start', function(ev, data) {
          notificationHandling($scope, notificationsController, el, {
            type: 'runStart',
            timestamp: new Date(),
            properties: data
          });
        });

        $scope.$on('socket:run:end', function(ev, data) {
          notificationHandling($scope, notificationsController, el, {
            type: 'runEnd',
            timestamp: new Date(),
            properties: data
          });
        });

        $scope.$on('socket:run:test:result', function(ev, data) {
          notificationHandling($scope, notificationsController, el, {
            type: 'testResult',
            timestamp: new Date(),
            properties: data
          });
        });
      }
    };
  });
