(function() {
	var defaultExternalState = {
		filters: {
			text: '',
			status: {
				passed: true,
				failed: true,
				inactive: true
			}
		},
		paging: false
	};

	/**
	 * Application controller that handle the various elements to
	 * handle in the apps such collecting the data
	 */
	window.ProbeDockRT.app = new (Marionette.Application.extend({
		/**
		 * General filters to manage the defaults and currents filters of a
		 * collection and also the paging mode
		 */
		externalState: {
			state: _.clone(defaultExternalState)
		},

		// Define the default view mode used to render the test results
		defaultMode: 'squares',

		detailsCounter: 0,

		projects: new ProbeDockRT.ProjectCollection(),
		summary: new ProbeDockRT.ProjectSummaryCollection(),

		updateFilters: function(filters) {
			this.externalState.state.filters = filters;
			this.trigger('filter', {externalState: this.externalState});
		},

		switchView: function(mode) {
			this.viewMode = mode;
			this.externalState.state.paging = mode !== 'squares';
			this.trigger('show:results:' + mode);
		},

		/**
		 * For a refresh of the user interface at the default values
		 */
		refreshAll: function() {
			this.trigger('show:results:' + this.defaultMode);
			this.trigger('show:details');
		},

		reset: function() {
			this.externalState.state = _.clone(defaultExternalState);
			this.refreshAll();
		},

		/**
		 * Clear the test results and refresh the views
		 */
		clear: function() {
			// Reset the state
			this.externalState.state = _.clone(defaultExternalState);

			// Reset the collections
			this.details.reset();
			this.projects.reset();
			this.summary.reset();

			// Reset the test counter
			this.detailsCounter = 0;

			// Refresh the view of test results
			this.trigger('show:results:' + this.viewMode);
		},

		processPayload: function(payload) {
			// Initialize the statistics for the payload received
			var stats = {failed: 0, passed: 0, inactive: 0, total: 0, duration: 0};

			var self = this;
			_.each(payload.r, function (run) {
				_.each(run.t, function (test) {
					self.processTestResult(test, run.j, run.v);

					stats.total++;
					stats.passed += test.p && test.f != 1 ? 1 : 0;
					stats.failed += !test.p && test.f != 1 ? 1 : 0;
					stats.inactive += test.f == 1 ? 1 : 0;
					stats.duration += test.d;
				});
			});

			this.trigger('notify:stats', stats);
		},

		processTestResult: function(testResult, parentProjectName, parentProjectVersion) {
			// Retrieve tests project data and category
			var projectName = _.defaultValue(testResult.j, parentProjectName);
			var projectVersion = _.defaultValue(testResult.v, parentProjectVersion);
			var category = _.defaultValue(testResult.c, null);

			// Build the coordinates for the test
			var coordinates = _.coordinates(projectName, projectVersion, category);

			// Register the project for the current test
			this.addProjectFromTestResult(coordinates, projectName, projectVersion, category, testResult.k);

			// Retrieve the attributes from
			var attributes = {
				name: testResult.n, passed: testResult.p, duration: testResult.d, flags: testResult.f, message: testResult.m,
				flatten_tags: testResult.g.join(','), flatten_tickets: testResult.t.join(','),
				tags: testResult.g, tickets: testResult.t, data: testResult.a, project: projectName, version: projectVersion,
				category: category
			};

			// Add or update the test result
			this.addOrUpdateTest(testResult.k, coordinates, attributes);
		},

		addOrUpdateTest: function(key, coordinates, testAttributes) {
			var testModel;
			if (_.isUndefined(this.projects.get(coordinates).get('tests').get(key))) {
				testModel = new ProbeDockRT.TestModel(_.extend(testAttributes, {id: key}));
				this.projects.get(coordinates).get('tests').add(testModel);
			}
			else {
				testModel = this.projects.get(coordinates).get('tests').get(key);

				testModel.set(testAttributes);

				if (!testModel.get('passed') && testModel.get('flag') != 1) {
					testModel.set('order', this.detailsCounter++);
					this.updateDetailResult(testModel);
				}
			}

			this.summary.addOrUpdate(testModel);
		},

		addProjectFromTestResult: function(coordinates, name, version, category, testKey) {
			// Create the project collection if it does not exist
			if (_.isUndefined(this.projects.get(coordinates))) {
				// Create the test collection
				var testCollection = new ProbeDockRT.TestCollection({}, {externalState: this.externalState});

				// Add a listener to update the collection when filters are specified
				testCollection.listenTo(this, 'filter', testCollection.updateInfo);

				// Add the project model with the collection
				this.projects.add(new ProbeDockRT.ProjectModel({
					id: coordinates,
					crcId: _.crc(coordinates),
					name: name, originalName: name,
					version: version, originalVersion: version,
					category: category, originalCategory: category,
					title: _.titleize(name, version, category),
					tests: testCollection
				}));
			}
		},

		updateDetailResult: function(test) {
			if (_.isUndefined(this.details.get(test.get('id')))) {
				this.details.add(test);
			}
		},

		addTestDetails: function(test) {
			if (test) {
				var model = test;
				if (_.isString(model)) {
					this.projects.each(function(project) {
						if (_.isString(model) && project.get('tests').getFromOriginals(model)) {
							model = project.get('tests').getFromOriginals(model);
						}
					});
				}

				model.set('order', this.detailsCounter++);

				if (!this.details.getFromOriginals(model.get('id'))) {
					this.details.add(model);
				}
				else {
					this.details.sort();
				}
			}
		},

		removeTestDetails: function(test) {
			if (test) {
				this.details.remove(test);
			}
		}
	}))();

	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function(options) {
		this.addRegions({
			main: '.main'
		});

		this.details = new ProbeDockRT.TestDetailsCollection({}, {externalState: this.externalState});

		// Ensure the details collection is listening for filter event
		this.details.listenTo(this, 'filter', this.details.updateInfo);

		this.on('change:view', function(mode) {
			this.switchView(mode);
		}, this);

		this.on('payload:received', function(payload) {
			this.processPayload(payload);
		}, this);

		this.on('test:result:received', function(testResult) {
			this.processTestResult(testResult, null, null);
		});

		this.on('add:test:details', function(model) {
			this.addTestDetails(model);
		}, this);

		this.on('remove:test:details', function(model) {
			this.removeTestDetails(model);
		}, this);

		// Reset the whole interface
		this.on('reset', function() {
			this.reset();
		}, this);

		// Clear the test result data
		this.on('clear', function() {
			this.clear();
		}, this);

		this.on('filters:update', function(filters) {
			this.updateFilters(filters);
		});
	});
}).call(this);