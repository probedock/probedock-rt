angular.module('probedock-rt.switch-ui', [])
  .factory('SwitchUiService', function($state) {
    var mode = 'help';

    return {
      switch: function(newMode) {
        if (newMode != mode) {
          mode = newMode;
          $state.go(newMode);
        }
      }
    }
  })

  .controller('SwitchUiController', function(SwitchUiService) {
    this.switch = function(mode) {
      SwitchUiService.switch(mode);
    }
  })

  .directive('switchUi', function() {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<div ng-transclude />',
      controller: 'SwitchUiController',
      controllerAs: 'switchUiCtrl'
    };
  });
