(function() {
	/**
	 * Filter view to handle the execution filters
	 */
	var FilterView = ProbeDockRT.TooltipableView.extend({
		filters: [],

		ui: {
			filter: '#filterField',
			filterElements: '.filter-elements'
		},

		/**
		 * Define the list of icons for GUI improvement when filters are defined
		 */
		icons: {
			key: {
				ico: 'key',
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
				ico: 'reorder',
				title: 'Name filter',
        reduce: function(str) {
          return str.length > 10 ? str.substr(0, 9) + '...' : str;
        }
			},
			tag: {
				ico: 'tag',
				title: 'Tag filter'
			},
			project: {
				ico: 'book',
				title: 'Project filter'
			},
			ticket: {
				ico: 'list-alt',
				title: 'Ticket filter'
			},
      '*': {
        ico: 'asterisk',
        title: 'Generic filter'
      }
		},

		/**
		 * Icon pattern to recognize which type of filter is used
		 */
		iconRegex: /(.*):(.*)/,

		events: {
			'click .filter-add': 'addFilterEvent',
			'keyup #filterField': 'addFilterFromKeyboard',
			'click .filter-element-close': 'removeFilter',
			'click .filter-element-text': 'removeFilter',
			'click .filter-clearall': 'clearAll',
			'mouseover .filter-icon': 'helpOn',
			'mouseout .filter-icon': 'helpOff'
		},

		/**
		 * Add a filter from the key board when enter
		 * is pressed in the filter field
		 *
		 * @param {Event} event The key board event
		 */
		addFilterFromKeyboard: function(event) {
			if (event.keyCode == 13) {
				this.addFilterEvent(event);
			}
		},

		/**
		 * Add a filter from the button clicked
		 *
		 * @param {Event} event The click event
		 */
		addFilterEvent: function(event) {
			event.preventDefault();

      var text = _.str.trim(this.ui.filter.val()), type = null;

      _.each(this.icons, function(icon, iconKey) {
        if (_.str.startsWith(text, iconKey + ':')) {
          text = text.replace(iconKey + ':', '');
          type = iconKey;
        }
      });

			this.addFilter(type, text);
		},

		/**
		 * Add a filter and trigger to the user interface and
		 * notify once it is done
		 *
		 * @param {String} filterType The filter to add
     * @param {String} filterText The filter text
		 */
		addFilter: function(filterType, filterText) {
			// Correct the filter (remove spaces for specific filters) and trimed the filter type
      filterText = _.str.trim(filterText);

      // Fix filter type if required
      if (!filterType) {
        filterType = '*';
      }

			// Check if the filter is already present
			if (!_.find(this.filters, function(filter) { return filter.type == filterType && filter.text == filterText; })) {
				// Add the filter
				this.filters.push({ type: filterType, text: filterText });

				// Working variables
				var iconTag = '';
				var icon;

				// Check if the pattern match a known type
				if (this.icons[filterType]) {
					icon =  this.icons[filterType];
					iconTag = '<i class="icon-' + icon.ico + ' filter-icon" title="' + icon.title + '"></i>';
				}

        var viewableFilterText;
        if (!_.isUndefined(this.icons[filterType].reduce)) {
          viewableFilterText = this.icons[filterType].reduce(filterText);
        }
        else {
          viewableFilterText = filterText;
        }

				// Create the filter element
				var filterElement = $('<span class="filter-element-text">' + iconTag + viewableFilterText + '</span><button class="filter-element-close"><i class="icon-remove-sign"></i></button>');

				// Initialize the tooltip
				this.initTooltip(filterElement.find('i'));

				// Create the filter element for the GUI
				var filterDiv = $('<div class="filter-element"></div>').append(filterElement).data('filter', filterText);

				// Add the filter element
				this.ui.filterElements.append(filterDiv);

				// Reset the filter field
				this.ui.filter.val('');

				// Notify that the filter is added
				this.trigger('filters:set', this.filters);
			}
		},

		/**
		 * Remove a filter element and notify once it's done
		 *
		 * @param {Event} event The click event
		 */
		removeFilter: function(event) {
			// Find the filter element
			var filterElement = $(event.target).closest('.filter-element');

			// Check the filter element is found
			if (filterElement.length > 0) {
				// Get the filter text
				var filterText = filterElement.data('filter');

				// Remove the filter from the collection
				this.filters = _.reject(this.filters, function(value) {
					return value.text === filterText;
				});

				// Remove the tooltip
				filterElement.find('i').tooltip('hide');

				// Remove the element
				filterElement.remove();

				// Notify that the filter is removed
				this.trigger('filters:set', this.filters);
			}
		},

		/**
		 * Clear all the filters and notify once it's done
		 *
		 * @param {Event} event The click event
		 */
		clearAll: function(event) {
			// Check there is at least one filter
			if (this.ui.filterElements.children().length > 0) {
				// Reset the filters
				this.filters = [];

				// Remove tooltips
				this.ui.filterElements.tooltip('hide');

				// Remove the filter elements
				this.ui.filterElements.empty();

				// Notify that the filters are cleaned
				this.trigger('filters:set', this.filters);
			}
		}
	});

	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function(options) {
		// Define the region to show the filters
		this.addRegions({
			filtersRegion: '.filters'
		});

		// Create the filter view
		var view = new FilterView(_.extend({el: '.filters-container'}, options));

		// Listen to add filters from another component
		view.listenTo(this, 'filter:add', view.addFilter);

		// Propagate the filter update
		this.listenTo(view, 'filters:set', function(filters) {
			this.trigger('filters:set', filters);
		});

		// Render and attach the view to the app controller
		this.filtersRegion.attachView(view.render());
	});
}).call(this);