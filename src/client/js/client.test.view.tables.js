(function() {
	/**
	 * Create an event aggregator to use in the Tables views
	 */
	var tablesEventAggregator = new Backbone.Wreqr.EventAggregator();

	/**
	 * Pager view to override the styles
	 */
	var PagerView = Dg.PagerView.extend({
		css: {
			disabled: 'disabled page-disabled'
		}
	});

	/**
	 * Header view of the Tables representation of the test
	 * results. The header view shows the project name, version
	 * and category.
	 */
	var TableHeaderView = Dg.HeaderView.extend({
		css: {
			sortable: 'sorting',
			asc: 'icon-sort-up',
			desc: 'icon-sort-down',
			none: 'icon-sort'
		},

		/**
		 * Template
		 *
		 * @param {Object} data Data to use in the template rendering
		 * @returns {string} Template ready to be rendered
		 */
		template: function(data) {
			return '<th class="s center">Key</th>' +
				'<th>Name</th>' +
				'<th class="s center">Duration</th>' +
				'<th class="s center">Status</th>';
		}
	});

	/**
	 * Row view of the Tables representation of the test
	 * results.
	 */
	var TableRowView = Dg.RowView.extend({
		// Events definition
		events: {
			'click .key': '_addKeyFilter',
			'click .name': '_addNameFilter'
		},

		/**
		 * Template that render table row
		 *
		 * @param {Object} data Data to render the template
		 * @returns {string} The Table row ready to render
		 */
		template: function(data) {
			var colorClass;

			if (!data.active) {
				colorClass = "badge-warning";
			}
			else {
				if (data.passed) {
					colorClass = "badge-success";
				}
				else {
					colorClass = "badge-important";
				}
			}

			return '<td class="center"><code class="key">' + data.id + '</code></td>' +
				'<td><span class="name">' + data.name + '</span></td>' +
				'<td class="right">' + _.formatDuration(data.duration) + '</td>' +
				'<td class="center"><span class="badge ' + colorClass + '">' + (data.passed ? 'passed' : 'failed') + '</span></td>';
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
				tablesEventAggregator.trigger('filter', type + ':' + $(event.target).text());
			}
		}

// TODO: Keep this code until be sure that updating a record will update also his style
//		/**
//		 * Once a Table is rendered, correct the CSS styles to apply
//		 * the correct color in regard of the test result status.
//		 */
//		onRender: function() {
//			var colorClass;
//
//			if (this.model.get('flags') == 1) {
//				colorClass = "badge-warning";
//			}
//			else {
//				if (this.model.get('passed')) {
//					colorClass = "badge-success";
//				}
//				else {
//					colorClass = "badge-important";
//				}
//			}
//
//			this.$el.find(".badge").removeClass("badge-warning badge-success badge-important").addClass(colorClass);
//		}
	});

	/**
	 * Define the view of a collection of test results to
	 * show the Tables.
	 */
	var TestTablesGridLayout = Dg.createGridLayout({
		gridRegions: {
			table: {
				view: Dg.TableView.extend({
					className: 'test-table',
					itemView: TableRowView,
					headerView: TableHeaderView,

					/**
					 * Template
					 *
					 * @param {Object} data The data to fill the template
					 * @return {String} Template ready to render
					 */
					template: function(data) {
						return '' +
							'<a id="' + data.crcId + '"></a><h3>' + data.title + '</h3>' +
							Dg.getTemplate('table')(data);
					},

					/**
					 * Initialize the view with expending the options with
					 * the project title and id
					 *
					 * @param {Object} options Options to get data
					 */
					initialize: function(options) {
						options = _.extend(options, {
							title: this.model.get('title'),
							crcId: this.model.get('crcId')
						});
					}
				})
			},
			toolbar: false,
			quickSearch: false,
			info: false,
			perPage: false,
			pager: {
				view: PagerView
			}
		}
	}).extend({
		className: 'box test-report',

		/**
		 * Initialize the view to get the tests as the collection
		 *
		 * @param {Object} options Options to configure the view
		 */
		initialize: function(options) {
			this.collection = options.model.get('tests');
		}
	});

	/**
	 * Collection view to render multiple collection of test results
	 * to show the results as Tables
	 */
	var TablesCollectionsView = Marionette.CollectionView.extend({
		itemView: TestTablesGridLayout
	});

	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function(options) {
		var self = this;

		// Listen the shortcuts to add filters
		tablesEventAggregator.on('filter', function(filter) {
			this.trigger('filter:add', filter);
		}, this);

		// Listen the view mode to show the Tables
		this.on('show:results:tables', function() {
			// Show the view
			this.main.show(new TablesCollectionsView({collection: self.projects}));
		}, this);
	});
}).call(this);