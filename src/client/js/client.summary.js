(function() {
	/**
	 * Summary header view
	 */
	var SummaryTableHeaderView = Dg.HeaderView.extend({
		/**
		 * Template
		 *
		 * @param {Object} data The
		 * @returns {string}
		 */
		template: function (data) {
			return '<tr>' +
				'<th class="th-version">Version</th>' +
				'<th class="th-project">Project</th>' +
				'<th class="th-category">Category</th>' +
				'<th class="center">Passed</th>' +
				'<th class="center">Failed</th>' +
				'<th class="center">Inactive</th>' +
				'<th class="center">All</th>' +
				'<th class="center">Duration</th>' +
				'</tr>';
		}
	});

	/**
	 * Summary row view
	 */
	var SummaryTableRowView = Dg.RowView.extend({
		/**
		 * Bindings to the statistic elements
		 */
		ui: {
			passed: '.passed',
			failed: '.failed',
			inactive: '.inactive',
			all: '.all',
			duration: '.duration'
		},

		/**
		 * Initialize the view to listen the model when there is
		 * specific updates on the statistics.
		 *
		 * @param {Object} options The options to configure the view
		 */
		initialize: function(options) {
			this.listenTo(this.model, 'stats:updated', function() {
				var stats = this.model.get('stats');

				this.ui.passed.text(stats.passed);
				this.ui.failed.text(stats.failed);
				this.ui.inactive.text(stats.inactive);
				this.ui.all.text(stats.all);
				this.ui.duration.text(_.formatDuration(stats.duration));
			}, this);
		},

		/**
		 * Template
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {String} The template ready to be rendered
		 */
		template: function(data) {
			// Prepare the version cell
			var version = '';
			if (data.versionSize > 0) {
				version = '<td class="cell-header" rowspan="' + data.versionSize + '">' + data.version + '</td>';
			}

			// Prepare the project cell
			var project = '';
			if (data.projectSize > 0) {
				project = '<td class="cell-header" rowspan="' + data.projectSize + '">' + data.project + '</td>';
			}

			// Prepare the category cell
			var category = '&nbsp;';
			if (data.category !== '' && data.category !== 'Total') {
				category = '<a href="#' + data.crcId + '">' + data.category + '</a>';
			}
			else if (data.category === 'Total') {
				category = data.category;
			}

			// Template consolidated
			return version + project +
				'<td>' + category + '</td>' +
				'<td class="center"><span class="badge badge-success passed">' + data.stats.passed + "</span></td>" +
				'<td class="center"><span class="badge badge-important failed">' + data.stats.failed + '</span></td>' +
				'<td class="center"><span class="badge badge-warning inactive">' + data.stats.inactive + '</span></td>' +
				'<td class="center"><span class="badge badge-info all">' + data.stats.all + '</span></td>' +
				'<td class="right"><span class="duration">' + _.formatDuration(data.stats.duration) + '</span></td>';
		}
	});

	/**
	 * Empty view to render when there is no data in the collection
	 */
	var SummaryEmptyView = Dg.EmptyView.extend({
		/**
		 * Template
		 * @param {Object} data The data to fill the template
		 * @returns {String} The template ready to be rendered
		 */
		template: function(data) {
			return '<td><h4 class="text-error text-center">Run some test to see the results</h4></td>';
		}
	});

	/**
	 * The grid layout to present the summary information about the test
	 * results received
	 */
	var SummaryTableGridLayout = Dg.createGridLayout({
		gridRegions: {
			table: {
				view: Dg.TableView.extend({
					itemView: SummaryTableRowView,
					headerView: SummaryTableHeaderView,
					emptyView: SummaryEmptyView,

					/**
					 * Template
					 *
					 * @param {Object} data Data to fill the template
					 * @returns {String} Template ready to be rendered
					 */
					template: function (data) {
						return '<table class="table table-condensed"><tbody/></table>';
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
		// Configure a region to show summary results
		this.addRegions({
			summaryRegion: ".summary"
		});

		// Show an empty view before rendering the real results
		this.summaryRegion.show(new SummaryTableGridLayout({collection: ProbeDockRT.app.summary}));
	});
}).call(this);