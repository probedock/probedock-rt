angular.module('probedock-rt.execution-filters', [])
  //.factory('SwitchUiService', function($state) {
  //  var mode = 'help';
  //
  //  return {
  //    switch: function(newMode) {
  //      if (newMode != mode) {
  //        mode = newMode;
  //        $state.go(newMode);
  //      }
  //    }
  //  }
  //})
  //
  .controller('ExecutionFiltersController', function($scope, socket) {
    var icons = {
      key: {
        ico: 'qrcode',
        title: 'Key filter'
      },
      fp: {
        ico: 'hand-up',
        title: 'Fingerprint filter',
        reduce: function(str) {
          return str.length > 9 ? str.substr(0, 3) + '...' + str.substr(str.length - 3) : str;
        }
      },
      name: {
        ico: 'stats',
        title: 'Name filter',
        reduce: function(str) {
          return str.length > 10 ? str.substr(0, 9) + '...' : str;
        }
      },
      tag: {
        ico: 'tag',
        title: 'Tag filter'
      },
      ticket: {
        ico: 'list',
        title: 'Ticket filter'
      },
      '*': {
        ico: 'asterisk',
        title: 'Generic filter'
      }
    };

    $scope.filters = [];

    this.filters = function() {
      return _.reduce($scope.filters, function(memo, filter) {
        var filterUi;
        if (icons[filter.type]) {
          filterUi = _.extend(filter, {ui: icons[filter.type]});
        }
        else {
          filterUi = _.extend(filter, {ui: icons['*']});
        }

        filterUi.textSummary = filterUi.ui.reduce ? filterUi.ui.reduce(filterUi.text) : filterUi.text;

        memo.push(filterUi);

        return memo;
      }, []);
    };

    this.addFilter = function(filter) {
      if (filter && filter.text != '') {
        var transformedFilter = {
          text: s.trim(filter.text),
          type: '*'
        };

        _.each(icons, function(icon, iconKey) {
          if (s.startsWith(filter.text, iconKey + ':')) {
            transformedFilter.text = filter.text.replace(iconKey + ':', '');
            transformedFilter.type = iconKey;
          }
        });

        $scope.filters.push(transformedFilter);
        $scope.filter = {text: ''};

        if (!_.isUndefined($scope.filters) && $scope.filters.length > 0) {
          socket.emit('filters:set', {filters: $scope.filters});
        }
        else {
          socket.emit('filters:reset');
        }
      }
    };

    this.addFilterFromKeyboard = function(event, filter) {
      if (event.keyCode == 13) {
        this.addFilter(filter);
      }
    };

    this.clearFilter = function(filter) {
      console.log(filter);
    };

    this.clearFilters = function() {
      $scope.filters = [];
      socket.emit('filters:reset');
    }
  })

  .directive('executionFilters', function() {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: 'modules/execution-filters/template.html',
      controller: 'ExecutionFiltersController',
      controllerAs: 'execFiltersCtrl'
    };
  });
