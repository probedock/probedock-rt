(function() {
	/**
	 * Debounced function to filter data
	 */
	var delayedFiltering = _.debounce(function(object, filters) {
		object.trigger('filters', filters);
	}, 300);

	/**
	 * Toolbar to handle the different action and filtering on the test
	 * results across the application
	 */
	var ToolbarView = ProbeDockRT.TooltipableView.extend({
		/**
		 * Define the default values to manage the filtering of the
		 * test results collections
		 */
		filters: {
			text: '',
			status: {
				passed: true,
				failed: true,
				inactive: true
			}
		},

		events: {
			'mouseover .btn': 'helpOn',
			'mouseout .btn': 'helpOff',
			'click .toolbar-status > .btn': 'statusFiltering',
			'click .toolbar-view > .btn': 'switchView',
			'click .toolbar-reset > .btn': 'reset',
			'click .toolbar-clear > .btn': 'clear',
			'keyup .text-filter > input': 'textFiltering',
			'keypress .text-filter > input': 'avoidSubmit'
		},

		ui: {
			passedBtn: '.toolbar-status > .btn-success',
			failedBtn: '.toolbar-status > .btn-danger',
			inactiveBtn: '.toolbar-status > .btn-warning',
			squaresBtn: '.toolbar-view > [data-mode="squares"]',
			textFilter: '.text-filter > input'
		},

		/**
		 * Manage the filtering by the test result status
		 *
		 * @param {Event} event The click event
		 */
		statusFiltering: function(event) {
			event.preventDefault();
			event.stopPropagation();

			// Manage the state of the button
			$(event.target).button('toggle');

			// Refresh the filter state
			_.each(_.keys(this.filters.status), function(value) {
				this.filters.status[value] = this.ui[value + 'Btn'].hasClass('active');
			}, this);

			// Notify that the filters have been updated
			delayedFiltering(this, this.filters);
		},

		/**
		 * Manage the filtering by text
		 *
		 * @param {Event} event The keyup event
		 */
		textFiltering: function(event) {
			event.preventDefault();
			event.stopPropagation();

			this.filters.text = this.ui.textFilter.val();

			// Notify that the filters have been updated
			delayedFiltering(this, this.filters);
		},

		/**
		 * Prevent submiting the form when enter is pressed
		 *
		 * @param {Event} event Event to prevent
		 */
		avoidSubmit: function(event) {
			if (event.keyCode == 13) {
				event.preventDefault();
				event.stopPropagation();
			}
		},

		/**
		 * Manage the switch of the view between the Squares and
		 * Tables representations of the test results
		 *
		 * @param {Event} event The click event
		 */
		switchView: function(event) {
			event.preventDefault();

			// Check if the button has been updated to notify the view mode change
			if (!$(event.target).hasClass('active')) {
				this.trigger('view:switch', $(event.target).data('mode'));
			}
		},

		/**
		 * Reset the toolbars and notify for an update of the application
		 *
		 * @param {Event} event The click event
		 */
		reset: function(event) {
			// Reset the status filters to their original values and update the view accordingly
			_.each(_.keys(this.filters.status), function(value) {
				if (!this.ui[value + 'Btn'].hasClass('active')) {
					this.ui[value + 'Btn'].button('toggle');
				}
				this.filters.status[value] = true;
			}, this);

			// Reset the view mode button
			this.ui.squaresBtn.button('toggle');

			// Empty the input text filter
			this.ui.textFilter.val('');

			// Notify for a reset
			this.trigger('reset');
		},

		/**
		 * Clear all the data in the user interface
		 *
		 * @param {Event} event The click event
		 */
		clear: function(event) {
			event.preventDefault();
			this.trigger('clear');
		}
	});

	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function (options) {
		// Configure
		this.addRegions({
			toolbarRegion: '.toolbar'
		});

		// Create the view
		var toolbar = new ToolbarView(_.extend({el: $('.toolbar-container')}, options));

		// Listen to filter event of the view
		toolbar.on('filters', function(filters) {
			this.trigger('filters:update', filters);
		}, this);

		// Listen to view switch of the view
		toolbar.on('view:switch', function(mode) {
			this.trigger('change:view', mode);
		}, this);

		// Listen to the reset event of the view
		toolbar.on('reset', function() {
			this.trigger('reset');
		}, this);

		// Listen to the clear event of the view
		toolbar.on('clear', function() {
			this.trigger('clear');
		}, this);

		// Render and show the view
		this.toolbarRegion.attachView(toolbar.render());
	});
}).call(this);