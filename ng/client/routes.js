angular.module('probedock-rt.routes', ['ui.router'])

  .config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        controller: 'MainCtrl',
        templateUrl: '/modules/main/template.html'
      })

      .state('help', {
        url: '/help',
        controller: 'HelpCtrl',
        templateUrl: '/modules/help/template.html'
      })
    ;

    $urlRouterProvider.otherwise(function($injector) {
      $injector.get('$state').go('home');
    });
  })
;