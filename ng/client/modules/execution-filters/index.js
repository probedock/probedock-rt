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

angular.module('probedock-rt.execution-filters', [])
  .factory('ExecutionFiltersService', function(socket) {
    var filters = {};

    function enrichKey(filter) {
      filter.key = filter.type + ':' + filter.text;
    }

    function buildFilter(filterText) {
      var createdFilter = {
        text: s.trim(filterText),
        type: '*'
      };

      _.each(icons, function(icon, iconKey) {
        if (s.startsWith(filterText, iconKey + ':')) {
          createdFilter.text = filterText.replace(iconKey + ':', '');
          createdFilter.type = iconKey;
        }
      });

      enrichKey(createdFilter);

      return createdFilter;
    }

    return {
      filters: function() {
        return _.clone(filters);
      },

      addFilter: function(filterText) {
        var transformedFilter = buildFilter(filterText);

        if (_.isUndefined(filters[transformedFilter.key])) {
          filters[transformedFilter.key] = transformedFilter;

          if (_.size(filters.length) > 0) {
            socket.emit('filters:set', { filters: filters });
          }
          else {
            socket.emit('filters:reset');
          }

          return true;
        }
        else {
          return false;
        }
      },

      removeFilter: function(filterKey) {
        if (!_.isUndefined(filters[filterKey])) {
          delete filters[filterKey];
        }
      },

      removeAll: function() {
        filters = {};
        socket.emit('filters:reset');
      },

      hasFilters: function() {
        return !_.isEmpty(filters);
      },

      hasFilterByText: function(filterText) {
        var filter = buildFilter(filterText);
        return !_.isUndefined(filters[filter.key]);
      }
    }
  })

  .controller('ExecutionFiltersController', function($scope, ExecutionFiltersService) {
    this.filters = function() {
      var filters = _.reduce(ExecutionFiltersService.filters(), function(memo, filter) {
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

      return filters;
    };

    this.addFilter = function(filter) {
      console.log(filter);
      if (filter && !_.isUndefined(filter.text) && filter.text != '') {
        var result = ExecutionFiltersService.addFilter(filter.text);
        if (result) {
          $scope.filter = { text: '' };
        }
      }
    };

    this.clearFilter = function(filter) {
      ExecutionFiltersService.removeFilter(filter.key);
    };

    this.clearFilters = function() {
      ExecutionFiltersService.removeAll();

      //$scope.filter.text = '';
      //$scope.executionFiltersForm.$setPristine();
      //$scope.executionFiltersForm.$setDirty();
    };

    this.filterClass = function(filter) {
      return filter.type == '*' ? '' : 'execution-filters-element-' + filter.type;
    };

    this.isAddFilterDisabled = function() {
      return !$scope.filter || _.isUndefined($scope.filter.text) || $scope.filter.text == '';
    };

    this.isClearDisabled = function() {
      return !ExecutionFiltersService.hasFilters();
    };

    this.isValid = function(filter) {
      return true;
    };
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
  })

  .directive('executionFilterExists', function(ExecutionFiltersService) {
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$validators.executionFilterExists = function(modelValue, viewValue) {
          if (ctrl.$isEmpty(modelValue)) {
            return true;
          }
          else {
            return !ExecutionFiltersService.hasFilterByText(modelValue);
          }
        }
      }
    };
  });
