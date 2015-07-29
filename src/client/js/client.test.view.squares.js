(function() {
	/**
	 * Create an event aggregator to use in the Squares views
	 */
	var squaresEventAggregator = new Backbone.Wreqr.EventAggregator();

	/**
	 * Header view of the Squares representation of the test
	 * results. The header view shows the project name, version
	 * and category.
	 */
	var SquaresHeaderView = Dg.HeaderView.extend({
		parentSelector: ".clearfix",
		tagName: "div",

		/**
		 * Serialize the data to have the title and the project id available when
		 * the template is rendered
		 *
		 * @returns {Object} Data serialized
		 */
		serializeData: function() {
			return {title: this.options.title, crcId: this.options.crcId};
		},

		/**
		 * Template
		 *
		 * @param {Object} data Data to use in the template rendering
		 * @returns {string} Template ready to be rendered
		 */
		template: function(data) {
			return '<a id="' + data.crcId + '"></a><h3>' + data.title + '</h3>';
		}
	});

	/**
	 * Row view of the Squares representation of the test
	 * results. Basically, a Square has a color to show
	 * the state of the test result.
	 */
	var SquaresRowView = Dg.RowView.extend({
		tagName: "div",
		className: "square-test pull-left",

		// Handle the click events to show the details of test
		events: {
			'click': 'showDetails',
			'mouseover': 'showTitle',
			'mouseout': 'hideTitle'
		},

		/**
		 * Template that render an empty string
		 *
		 * @param {Object} data Data to render the template
		 * @returns {string} The empty string to keep Squares empty
		 */
		template: function(data) { return ''; },

		/**
		 * Constructor
		 *
		 * @param options Options
		 */
		initialize: function(options) {
			this.listenTo(this.model, "change", this.render);
		},

		/**
		 * Once a Square is rendered, correct the CSS styles to apply
		 * the correct color in regard of the test result status.
		 */
		onRender: function() {
			var colorClass;

			// Check if the test result is inactive
			if (!this.model.get('active')) {
				colorClass = "btn-warning square-test-inactive";
			}
			else {
				// Check if the test result is passed or failed
				if (this.model.get('passed')) {
					colorClass = "btn-success square-test-success";
				}
				else {
					colorClass = "btn-danger square-test-fail";
				}
			}

			// Configure the title of the square
			this.$el.popover({
				title: '<span class="square-popover-title">' + this.model.get('id').substr(0, 10) + '...</code>',
				content: '<span class="square-popover-content">' + this.model.get('name') + '</span>',
				html:true,
				container: this.$el
			});

			// Clean CSS styles and applies the correct styling
			this.$el.removeClass("btn-warning btn-success btn-error square-test-inactive square-test-success square-test-fail").addClass(colorClass);
			this.delegateEvents();
		},

		/**
		 * Handle the click event on the Square to show the
		 * test details.
		 *
		 * @param {Event} event The click event
		 */
		showDetails: function(event) {
			event.preventDefault();
			squaresEventAggregator.trigger('show:test:details', this.model);
		},

		/**
		 * Show the title when the mouse is over a Square
		 *
		 * @param event The mouse event
		 */
		showTitle: function(event) {
			event.preventDefault();
			this.$el.popover('show');
		},

		/**
		 * Hide the title when the mouse is out a Square
		 *
		 * @param event The mouse event
		 */
		hideTitle: function(event) {
			event.preventDefault();
			this.$el.popover('hide');
		}
	});

	/**
	 * Define the view of a collection of test results to
	 * show the Squares.
	 */
	var SquaresGridLayout = Dg.createGridLayout({
		gridRegions: {
			table: {
				view: Dg.TableView.extend({
					itemViewContainer: ".square-tests",
					itemView: SquaresRowView,
					headerView: SquaresHeaderView,

					/**
					 * The template of the table container view
					 *
					 * @param {Object} data The data to render the template
					 */
					template: function (data) { return '<div class="clearfix"><div class="square-tests"></div></div>'; },

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
			perPage: false,
			toolbar: false,
			pager: false,
			quickSearch: false,
			info: false
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
	 * to show the results as Squares
	 */
	var SquaresCollectionsView = Marionette.CollectionView.extend({
		itemView: SquaresGridLayout
	});

	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function(options) {
		// Create the view with the projects collection
		var view = new SquaresCollectionsView({collection: this.projects});

		// Listen the view mode to show the Squares
		this.on('show:results:squares', function() {
			// Show the view
			this.main.show(view);
		}, this);

		// Listen to show test details
		squaresEventAggregator.on('show:test:details', function(model) {
			this.trigger('add:test:details', model);
		}, this);

		// Initialize the view with empty collection to allow receiving new data
		this.main.show(view);
	});
}).call(this);