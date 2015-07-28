(function() {
	/**
	 * Create an event aggregator to use in the Details views
	 */
	var detailsEventAggregator = new Backbone.Wreqr.EventAggregator();

	/**
	 * Represent a test details representation
	 */
	var TestDetailsTableRowView = Dg.RowView.extend({
		tagName: 'div',

		events: {
			'click .code-key': '_addKeyFilter',
			'click .title-name': '_addNameFilter',
			'click .badge-tag': '_addTagFilter',
			'click .badge-ticket': '_addTicketFilter',
			'click .test-details-close': '_closeDetails',
			'click .no-op': '_noOp',
			'click': '_closeDetails'
		},

		ui: {
			message: '.test-details-message'
		},

		/**
		 * Template
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {String} The template ready to rendered
		 */
		template: function(data) {
			var statusClass, statusText, titleClass;

			// Compute the class and text for the test status
			if (data.flags == 1) {
				statusClass = 'label-warning';
				statusText = 'Inactive (' + (data.passed ? 'Passed' : 'Failed') + ')';
				titleClass = 'test-details-inactive';
			}
			else {
				if (data.passed) {
					statusClass = 'label-success';
					statusText = 'Passed';
					titleClass = 'test-details-success';
				}
				else {
					statusClass = 'label-important';
					statusText = 'Failed';
					titleClass = 'test-details-failed';
				}
			}

			// Compute the tags
			var tags = '';
			_.each(data.tags, function(tag) {
				tags += '<span class="badge badge-info pull-left badge-tag">' + tag + '</span>';
			});

			// Compute the tickets
			var tickets = '';
			_.each(data.tickets, function(ticket) {
				tags += '<span class="badge badge-warning pull-left badge-ticket">' + ticket + '</span>';
			});

			// Return the template ready to be rendered
			return '' +
				'<button class="test-details-close">' +
					'<i class="icon-remove"></i>' +
				'</button>' +
				'<div class="well test-details box">' +
					'<div class="row-fluid title-first-line ' + titleClass + '">' +
						'<div class="test-details-right-container pull-right">' +
							'<code class="pull-left code-key">' + data.id + '</code>' +
							'<span class="label label-info pull-left no-op">' + _.formatDuration(data.duration) + '</span>' +
							'<span class="label pull-left no-op ' + statusClass + '">' + statusText + '</span>' +
						'</div>' +
						'<span class="title-name">' + data.name + ' </span>' +
					'</div>' +
					'<div class="row-fluid title-second-line">' +
						'<div class="test-details-right-container pull-right">' +
							'<span class="label pull-left no-op">' + data.project + '</span>' +
							'<span class="label pull-left no-op">' + data.version + '</span>' +
							'<span class="label pull-left no-op">' + data.category + '</span>' +
						'</div>' +
						'<div class="test-details-left-container pull-left">' +
							tags +
							tickets +
						'</div>' +
					'</div>' +
					'<pre class="test-details-message no-op"></pre>' +
				'</div>';
		},

		/**
		 * Constructor
		 *
		 * @param options Options
		 */
		initialize: function(options) {
			this.listenTo(this.model, "change", this.render);
		},

		/**
		 * Once the details view is rendered, fill the message
		 * through jQuery to be sure the text will be escaped
		 */
		onRender: function() {
			this.ui.message.text(this.model.get('message'));
		},

		/**
		 * Add a filter by key
		 *
		 * @param {Event} event Event to get the key filter
		 */
		_addKeyFilter: function(event) {
			this._handleAddFilterEvent(event, 'key');
		},

		/**
		 * Add a filter by name
		 *
		 * @param {Event} event Event to get the name filter
		 */
		_addNameFilter: function(event) {
			this._handleAddFilterEvent(event, 'name');
		},

		/**
		 * Add a filter by tag
		 *
		 * @param {Event} event Event to get the tag filter
		 */
		_addTagFilter: function(event) {
			this._handleAddFilterEvent(event, 'tag');
		},

		/**
		 * Add a filter by ticket
		 *
		 * @param {Event} event Event to get the ticket filter
		 */
		_addTicketFilter: function(event) {
			this._handleAddFilterEvent(event, 'ticket');
		},

		/**
		 * Close the details
		 *
		 * @param event The mouse event
		 */
		_closeDetails: function(event) {
			event.preventDefault();
			event.stopPropagation();
			detailsEventAggregator.trigger('remove:test:details', this.model);
		},

		/**
		 * Avoid click event to be propagated when it's not required
		 *
		 * @param event The click event
		 */
		_noOp: function(event) {
			event.stopPropagation();
		},

		/**
		 * Generic handler for the filters
		 *
		 * @private
		 * @param {Event} event Event to get the filter text
		 * @param {String} type The filter type
		 */
		_handleAddFilterEvent: function(event, type) {
			// Avoid closing the details
			event.stopPropagation();

			// Check if the alt key is pressed
			if (event.altKey) {
				// Trigger the event to add a filter
				detailsEventAggregator.trigger('filter', type + ':' + $(event.target).text());
			}
		}
	});

	/**
	 * Collection view of test details
	 */
	var DetailsGridLayout = Dg.createGridLayout({
		gridRegions: {
			table: {
				view: Dg.TableView.extend({
					itemViewContainer: '.detail-tests',
					itemView: TestDetailsTableRowView,
					emptyView: Marionette.ItemView.extend({

							/**
						 * Template (empty because we do not need to show any
						 * text when collection is empty)
						 *
						 * @param {Object} data The data to fill the template
						 * @returns {String} The template ready to render
						 */
						template: function(data) {
							return '';
						}
					}),
					headerView: false,

					/**
					 * Template of the grid layout
					 *
					 * @param data The data to fill the template
					 * @returns {String} The template ready to render
					 */
					template: function (data) {
						return '<div class="clearfix"><div class="detail-tests"></div></div>';
					}
				})
			},
			perPage: false,
			toolbar: false,
			pager: false,
			quickSearch: false,
			info: false
		}
	});

	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function(options) {
		// Configure a region to show details of test results
		this.addRegions({
			detailsRegion: '.details'
		});

		// Create the view with the details collection
		var view = new DetailsGridLayout({collection: this.details});

		// Refresh the view when order changed
		view.listenTo(this.details, 'sort', function() {
			view.render();
		});

		// Listen the shortcuts to add filters
		detailsEventAggregator.on('filter', function(filter) {
			this.trigger('filter:add', filter);
		}, this);

		// Listen to remove a details
		detailsEventAggregator.on('remove:test:details', function(model) {
			this.trigger('remove:test:details', model);
		}, this);

		// Listen the view mode to show the Squares
		this.on('show:details', function() {
			// Show the view
			this.detailsRegion.show(view);
		}, this);

		// Initialize the view with empty collection to allow receiving new data
		this.detailsRegion.show(view);
	});
}).call(this);