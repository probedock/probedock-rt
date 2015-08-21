angular.module('probedock-rt.execution-filters', [])
  /**
   * Take care to send filters through socket.io
   */
  .factory('ExecutionFiltersSocketService', function(socket) {
    return {
      /**
       * Send the filters
       *
       * @param filters The filters to send. Only sent if not null and not empty, otherwise a reset is sent
       */
      sendFilters: function(filters) {
        if (filters && _.size(filters) > 0) {
          var reducedFilters = _.reduce(filters, function(memo, filter) {
            memo.push(_.pick(filter, 'type', 'text'));
            return memo;
          }, []);

          socket.emit('filters:set', { filters: reducedFilters });
        }
        else {
          socket.emit('filters:reset');
        }
      }
    };
  })

  /**
   * Manage the filters for the UI
   */
  .factory('ExecutionFiltersService', function(ExecutionFiltersSocketService) {
    var filters = {};

    /**
     * Define the different filter types and how they will be presented in the UI
     */
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

    /**
     * Build the filter from a text
     *
     * @param filterText The text
     * @returns {Object} The filter created
     */
    function buildFilter(filterText) {
      var createdFilter = {
        text: s.trim(filterText),
        type: '*'
      };

      // Check if the filter type is known
      _.each(icons, function(icon, iconKey) {
        if (s.startsWith(filterText, iconKey + ':')) {
          createdFilter.text = filterText.replace(iconKey + ':', '');
          createdFilter.type = iconKey;
        }
      });

      if (icons[createdFilter.type]) {
        createdFilter = _.extend(createdFilter, { ui: icons[createdFilter.type] });
      }
      else {
        createdFilter = _.extend(filter, { ui: icons['*'] });
      }

      createdFilter.textSummary = createdFilter.ui.reduce ? createdFilter.ui.reduce(createdFilter.text) : createdFilter.text;

      createdFilter.key = createdFilter.type + ':' + createdFilter.text;

      return createdFilter;
    }

    return {
      /**
       * @returns {Object} Filters
       */
      filters: function() {
        return filters;
      },

      /**
       * Add a new filter in the filters
       *
       * @param filterText The filter text used to build the real filter
       * @returns {boolean} True if the filter has been added
       */
      addFilter: function(filterText) {
        var transformedFilter = buildFilter(filterText);

        // Add the filter if not present and send the filters
        if (_.isUndefined(filters[transformedFilter.key])) {
          filters[transformedFilter.key] = transformedFilter;
          ExecutionFiltersSocketService.sendFilters(filters);
          return true;
        }
        else {
          return false;
        }
      },

      /**
       * Remove a filter by its key
       *
       * @param filterKey The filter key
       */
      removeFilter: function(filterKey) {
        // Remove the filter if exists and send the filters
        if (!_.isUndefined(filters[filterKey])) {
          delete filters[filterKey];
          ExecutionFiltersSocketService.sendFilters(filters);
        }
      },

      /**
       * Remove all the filters
       */
      removeAll: function() {
        filters = {};
        ExecutionFiltersSocketService.sendFilters(filters);
      },

      /**
       * @returns {boolean} True if at least one filter is defined
       */
      hasFilters: function() {
        return !_.isEmpty(filters);
      },

      /**
       * Check if a filter is defined by checking from a free text
       *
       * @param filterText The filter text
       * @returns {boolean} True if present
       */
      hasFilterByText: function(filterText) {
        var filter = buildFilter(filterText);
        return !_.isUndefined(filters[filter.key]);
      }
    }
  })

  /**
   * Controller to manage the execution filters component. The main operations
   * are delegated to the corresponding service
   */
  .controller('ExecutionFiltersController', function($scope, ExecutionFiltersService) {
    /**
     * @returns {Object} The filters
     */
    this.filters = function() {
      return ExecutionFiltersService.filters()
    };

    /**
     * Add a filter from input text
     *
     * @param filterText The filter text to add
     */
    this.addFilter = function(filterText) {
      // Enforce the validity of not null nor empty text
      if (filterText && !_.isUndefined(filterText) && filterText != '') {
        var result = ExecutionFiltersService.addFilter(filterText);

        // Reset the field if the filter correctly added
        if (result) {
          $scope.filterText = '';
        }
      }
    };

    /**
     * Remove specific filter
     *
     * @param filter The filter to remove
     */
    this.removeFilter = function(filter) {
      // Remove the filter and make sure the input field is re-validated
      ExecutionFiltersService.removeFilter(filter.key);
      $scope.executionFiltersForm.executionFiltersInput.$validate();
    };

    /**
     * Remove all the filters previously configured
     */
    this.removeAllFilters = function() {
      // Remove all filters and make sure the input field is re-validated
      ExecutionFiltersService.removeAll();
      $scope.executionFiltersForm.executionFiltersInput.$validate();
    };

    /**
     * Build the filter class. It will take care of the filter type.
     *
     * @param filter The filter
     * @returns {string} The class based on the filter type
     */
    this.filterClass = function(filter) {
      return filter.type == '*' ? '' : 'execution-filters-element-' + filter.type;
    };

    /**
     * @returns {boolean} True if at least one filter is present
     */
    this.isRemoveAllFiltersDisabled = function() {
      return !ExecutionFiltersService.hasFilters();
    };
  })

  /**
   * Directive for the execution filters component
   */
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

  /**
   * Custom validator to validate each filter is unique in the list
   */
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
