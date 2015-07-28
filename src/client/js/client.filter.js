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
			name: {
				ico: 'reorder',
				title: 'Name filter'
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
			unknown: {
				ico: 'question-sign',
				title: 'Unknown filter: {type}'
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
			this.addFilter(this.ui.filter.val());
		},

		/**
		 * Add a filter and trigger to the user interface and
		 * notify once it is done
		 *
		 * @param {String} filter The filter to add
		 */
		addFilter: function(filter) {
			// Try to find the filter type pattern
			var iconMatch = this.iconRegex.exec(filter);

			// Correct the filter (remove spaces for specific filters) and trimed the filter type
			var trimedName = null;
			if (iconMatch) {
				filter = _.str.trim(iconMatch[1]) + ':' + _.str.trim(iconMatch[2]);
				trimedName = _.str.trim(iconMatch[1]);
			}

			// Check if the filter is already present
			if (filter !== '' && !_.contains(this.filters, filter)) {
				// Add the filter
				this.filters.push(filter);

				// Working variables
				var transformedFilter = '';
				var icon;

				// Check if the pattern match a known type
				if (trimedName && this.icons[trimedName]) {
					icon =  this.icons[trimedName];
					transformedFilter = filter.replace(trimedName + ':', '<i class="icon-' + icon.ico + ' filter-icon" title="' + icon.title + '"></i>');
				}

				// Check if the pattern is recognized but no known type is found
				else if (trimedName) {
					icon =  this.icons.unknown;
					transformedFilter = filter.replace(trimedName + ':', '<i class="icon-' + icon.ico + ' filter-icon" title="' + icon.title.replace('{type}', trimedName) + '"></i>');
				}

				// Otherwise put a generic icon for the filter
				else {
					transformedFilter = '<i class="icon-asterisk filter-icon" title="Generic filter"></i>' + filter;
				}

				// Create the filter element
				var filterElement = $('<span class="filter-element-text">' + transformedFilter + '</span><button class="filter-element-close"><i class="icon-remove-sign"></i></button>');

				// Initialize the tooltip
				this.initTooltip(filterElement.find('i'));

				// Create the filter element for the GUI
				var filterDiv = $('<div class="filter-element"></div>').append(filterElement).data('filter', filter);

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
					return value === filterText;
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