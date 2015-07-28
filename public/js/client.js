var DEBUG = false;

/**
 * Define the main application object
 */
var ProbeDockRT = window.ProbeDockRT = {
	version: "0.0.2"
};

(function() {
	/**
	 * Override the way that Marionette.Renderer works
	 *
	 * @param template The template to render
	 * @param data The data to fill in the template
	 * @returns {*} Nothing if the template is not defined, the result of the template function if template is a function
	 */
	Marionette.Renderer.render = function(template, data) {
		if (_.isUndefined(template)) {
			return;
		}
		else {
			var templateFunc = typeof template === 'function' ? template : Marionette.TemplateCache.get(template);
			return templateFunc(data);
		}
	};
}).call(this);
(function() {
	/**
	 * Define various utility functions to enrich Underscore lib
	 */
	_.mixin({
		/**
		 * Format the duration accordingly to a specific unit
		 *
		 * @param {Integer} quantity The duration quantity
		 * @param {String} unit The unit symbol to add to the quantity
		 * @returns {String} The duration formatted
		 */
		formatDurationUnit: function(quantity, unit) {
			if (quantity > 0) {
				return quantity + unit;
			}
			else {
				return "0" + unit;
			}
		},

		/**
		 * Format a duration of time into a human readable format.
		 * Ex: 6000 milliseconds will give 6s 0ms
		 *
		 * @param {Integer} duration The duration to format
		 * @param {Object} options The options to configure the formatting
		 * ```
		 * # Options allowed
		 * skipZeroValues: false # Define if the intermediate zero values must be shown
		 * units: {h: 'hours', m: 'minutes', s: 'seconds', ms: 'milliseconds'} # Different units supported by moment.js
		 * ```
		 * @returns {String} The duration formatted
		 */
		formatDuration: function(duration, options) {
			// Get the moment duration object
			var momentDuration = moment.duration(duration);

			// Ensure default options if none are provided
			options = _.defaults(
				options || {}, {
					units: {h: 'hours', m: 'minutes', s: 'seconds', ms: 'milliseconds'},
					skipZeroValues: false
				}
			);

			// Process the formatting
			var formated = _.reduce(options.units, function(memo, value, key) {
				// Check if there is already something formatted and the current unit produce a result greater than zero.
				if (memo.length > 0 && momentDuration[value]() > 0) {
					return memo + " " + _.formatDurationUnit(momentDuration[value](), key);
				}

				// Check if the current unit produce a value greater than zero. Will produce: 1h for example
				else if (momentDuration[value]() > 0) {
					return _.formatDurationUnit(momentDuration[value](), key);
				}

				// Check if there is already something formated and the current value for the unit is zero and
				// zero values must be kept. Will produce: 1h 23s 12ms for example.
				else if (memo.length > 0 && !options.skipZeroValues) {
					return memo + ' ' + _.formatDurationUnit(0, key);
				}

				// Other cases
				else {
					return memo;
				}
			}, '');

			// Check if the formatted string contains something
			if (formated.length > 0) {
				return formated;
			}

			// No formatted result, return minimum unit with 0 value
			else {
				return '0' + _.last(_.keys(options.units));
			}
		},

		/**
		 * Format the current date and time to a human format using moment.js
		 * @returns {String} Date and time humanly formatted
		 */
		now: function() {
			return moment().format('MMMM Do YYYY, h:mm:ss a');
		},

		/**
		 * Calculate a default value accordingly to the parameters
		 *
		 * @param {Object} value Value that will be returned if not null
		 * @param {Object} defaultValue Value that will be returned if not null and value is null
		 * @returns {Object|String} Undefined is returned if value and defaultValue are null
		 */
		defaultValue: function(value, defaultValue) {
			// Check if a test has a project name to override the project name from the test run
			if (_.isUndefined(value) || _.isNull(value) || '' === value) {
				if (_.isUndefined(defaultValue) || _.isNull(defaultValue) || '' === defaultValue) {
					return 'Undefined';
				}
				else {
					return defaultValue;
				}
			}
			else {
				return value;
			}
		},

		/**
		 * Titleize a project name, version and category
		 *
		 * @param name The project name
		 * @param version The project version
		 * @param category The category
		 * @returns {string} The titlized form of the parameters
		 */
		titleize: function(name, version, category) {
			return version + ' - ' + name + ' - ' + category;
		},

		/**
		 * Calculate coordinates for a project with its name, version
		 * and category.
		 *
		 * @param name The project name
		 * @param version The project version
		 * @param category The category
		 * @returns {String} The coordinates calculated from the parameters
		 */
		coordinates: function(name, version, category) {
			return _.str.slugify(_.titleize(name, version, category));
		},

		/**
		 * Calculate a CRC to create something usable in the links
		 *
		 * @param {String} str String to CRCfy
		 * @returns {number} CRC calculated
		 */
		crc: function(str) {
			var i;
			var chk = 0x12345678;

			for (i = 0; i < str.length; i++) {
				chk += (str.charCodeAt(i) * i);
			}

			return chk;
		}
	});
}).call(this);

(function() {
	/**
	 * Summary model to store the data used by Backbone
	 * to render a summary row
	 */
	var SummaryModel = Backbone.Model.extend({});

	/**
	 * Project summary composite class to handle the
	 * data of the projects in a summary way. This allows
	 * consolidating the data to sum the different metrics
	 *
	 * @constructor
	 * @param name The name of the summary
	 */
	function ProjectSummary(name) {
		// Child summaries
		this.summaries = {};

		// Statistics associated to the summary
		this.stats = {};

		// Number of summary
		this.size = 0;

		// Define the name if necessary
		if (name) {
			this.name = name;
		}

		this.crcId = null;

		// Aggregated values
		this.total = {
			passed: 0,
			failed: 0,
			inactive: 0,
			all: 0,
			duration: 0
		};
	}

	_.extend(ProjectSummary.prototype, {
		/**
		 * Create a new summary for the name
		 * and add it to the summary list
		 *
		 * @param name The name of ths summary
		 */
		create: function(name) {
			if (!this.exists(name)) {
				var summary = new ProjectSummary(name);
				this.summaries[name] = summary;
				summary.parent = this;
				this.size++;
			}
		},

		/**
		 * Calculate the number of children for the current
		 * summary.
		 *
		 * @returns {number} Number of children incl. a total virtual child
		 */
		childrenSize: function() {
			var size = 0;

			// Check if there is summaries
			if (_.size(this.summaries) === 0) {
				return 1;
			}

			// Sum the size of each summary children
			else {
				_.each(this.summaries, function(summary) {
					size += summary.childrenSize();
				});
			}

			// Add the virtual total when there is at least one child
			if (_.size(this.summaries) > 1) {
				size += 1;
			}

			return size;
		},

		/**
		 * Check if the summary is already existing
		 *
		 * @param name The name of the summary
		 * @returns {boolean} True if the summary name is already registered
		 */
		exists: function(name) {
			return !_.isUndefined(this.summaries[name]);
		},

		/**
		 * Find a summary by its name
		 *
		 * @param name The name of the summary
		 * @returns {ProjectSummary} The project summary if found, undefined otherwise
		 */
		find: function(name) {
			return this.summaries[name];
		},

		/**
		 * Check if there is a CRC ID associated with the summary
		 *
		 * @returns {boolean} True if there is a CRC id
		 */
		hasCrcId: function() {
			return !_.isUndefined(this.crcId);
		},

		/**
		 * Check if the summary contains some statistics
		 * for a specific test
		 *
		 * @param testKey The test key to lookup
		 * @returns {boolean} True if at least one stat is found, false otherwise
		 */
		hasStat: function(testKey) {
			return !_.isUndefined(this.stats[testKey]);
		},

		/**
		 * Retrieve a stat for specific test key in the summary
		 *
		 * @param testKey The test key to lookup
		 * @returns {number} The stat found, undefined otherwise
		 */
		findStat: function(testKey) {
			return this.stats[testKey];
		},

		/**
		 * Add a statistic for a test in the summary
		 *
		 * @param testKey The test key for which to store the stats
		 * @param stat The statistics to store
		 */
		addStat: function(testKey, stat) {
			// Add the statistic to the summary
			this._subOrAddStat(1, stat);

			// Check if the summary has a parent
			if (this.parent) {
				// Add the stat to the parent summary
				this.parent.addStat(testKey, stat);

				// Store the stats for the test key if no children are present
				if (_.size(this.summaries) === 0) {
					this.stats[testKey] = stat;
				}
			}
		},

		/**
		 * Remove a statistic for a test in the summary
		 *
		 * @param testKey The test key for which to remove the stats
		 * @param stat The statistics to substract
		 */
		subStat: function(testKey, stat) {
			// Sub the statistic to the summary
			this._subOrAddStat(-1, stat);

			// Check if the summary has a parent
			if (this.parent) {
				// Sub the stat to the parent summary
				this.parent.subStat(testKey, stat);
			}
		},

		/**
		 * Execute a sub or add operation of the stats
		 *
		 * @private
		 * @param op The operation (1 or -1)
		 * @param stat The statistics to operate
		 */
		_subOrAddStat: function(op, stat) {
			// Check if the test is active or not
			if (stat.inactive) {
				this.total.inactive += op;
			}
			else {
				// Check if the test is passed or not
				if (stat.passed) {
					this.total.passed += op;
				}
				else {
					this.total.failed += op;
				}
			}

			// Add the duration and total counter
			this.total.all += op;
			this.total.duration += stat.duration * op;

			// If the summary contains a reference to a Backbone.Model,
			// trigger an event to update the stats
			if (this.model) {
				this.model.trigger('stats:updated');
			}
		}
	});

	/**
	 * The ProjectSummaryCollection will store the summaries in the pure
	 * form of the recursive structure that is more easy to update and maintain and
	 * converts to a flattened structure usable by the collection and the views.
	 *
	 * Once the conversion of the collection is done, the models are synced with the
	 * updates and the new additions will trigger a recreation of the whole flattened
	 * collection of models.
	 */
	ProbeDockRT.ProjectSummaryCollection = Backbone.Collection.extend({
		/**
		 * Initialize
		 *
		 * @param {Object} options The options to configure the collection
		 */
		initialize: function(options) {
			this.summary = new ProjectSummary();
		},

		/**
		 * Add or update a test result in the collection
		 *
		 * @param {TestModel} test The test model to gather the data for the summary
		 */
		addOrUpdate: function(test) {
			// Retrieve the meta data of the test
			var version = test.get('version');
			var project = test.get('project');
			var category = test.get('category');
			var key = test.get('id');

			// Keep track if a new summary model has been created
			var created = false;

			// Iterate through the summary structure and create the missing
			// summaries for the version, project and category
			var summary = this.summary;
			_.each([version, project, category], function(name) {
				// Check if the summary exist for name
				if (!summary.exists(name)) {
					created = true;
					summary.create(name);
				}

				// Replace the current summary by the new just created to continue the recursion
				summary = summary.find(name);

				// Configure the CRC ID
				summary.crcId = _.crc(_.coordinates(project, version, category));
			}, this);

			// Get the stats from the test
			var testStat = {
				passed: test.get('passed'),
				inactive: test.get('flags') == 1,
				duration: test.get('duration')
			};

			// Check if stats are already present for the test
			if (summary.hasStat(key)) {
				// Sub the old values of stats
				summary.subStat(key, summary.findStat(key));
			}

			// Add the new value of stats
			summary.addStat(key, testStat);

			// Force a refresh of the collection due to the new row(s) added
			if (created) {
				this.fetch();
			}
		},

		/**
		 * Override the reset function
		 *
		 * @param models The models to set in place of the currents
		 * @param options The options to configure the reset
		 */
		reset: function(models, options) {
			if (!models) {
				delete this.summary;
				this.summary = new ProjectSummary();
			}

			Backbone.Collection.prototype.reset.call(this, models, options);
		},

		/**
		 * Override the sync method from Backbone to use
		 * the collection client side only
		 *
		 * @param {String} method The HTTP method
		 * @param {Array<ProjectModel> | ProjectModel} model The list of models or model to manage
		 * @param {Object} options The options to configure the sync
		 */
		sync: function (method, model, options) {
			var _self = this, storedSuccess = options.success;

			/**
			 * Override the success callback
			 *
			 * @param {Object} response The simulated response from the server
			 */
			options.success = function (response) {
				storedSuccess(response);
				_self.trigger("fetched");
			};

			var self = this;
			var models = [];

			// Check if there is data in the summary
			if (this.summary.size > 0) {
				// For each version summary
				_.each(this.summary.summaries, function(summaryVersion) {
					// Get version details
					var version = summaryVersion.name;
					var versionCount = summaryVersion.childrenSize();

					// For each project summary
					_.each(summaryVersion.summaries, function(summaryProject) {
						// Get project details
						var project = summaryProject.name;
						var projectCount = summaryProject.childrenSize();

						// For each category summary
						_.each(summaryProject.summaries, function(summaryCategory) {
							// Get category details
							var category = summaryCategory.name;

							// Create the model to store the category, project and version details
							summaryCategory.model = self._createSummaryModel(models, version, versionCount, project, projectCount, category, summaryCategory.total, summaryCategory.crcId);

							// Reset counters to group the rows
							if (versionCount > 0) { versionCount = 0; }
							if (projectCount > 0) { projectCount = 0; }
						});

						if (summaryProject.size > 1) {
							// Add a total for all the category of a project
							summaryProject.model = self._createSummaryModel(models, version, 0, project, 0, 'Total', summaryProject.total);
						}
					});

					if (summaryVersion.size > 1) {
						// Add a total for all the project of a version
						summaryVersion.model = self._createSummaryModel(models, version, 0, 'Total', 1, '', summaryVersion.total);
					}
				});

				if (this.summary.size > 1) {
					// Add a total for all the versions of all data
					this.summary.model = this._createSummaryModel(models, 'Total', 1, '', 1, '', this.summary.total);
				}
			}

			// Call synchronously the success callback
			options.success(models);
		},

		/**
		 * Reset and fetch again the collection models
		 */
		refresh: function() {
			this.reset();
			this.fetch();
		},

		/**
		 * Retrieve the meta information of the collection
		 *
		 * @returns {Object} The meta information of the collection
		 */
		getInfo: function() {
			return {};
		},

		/**
		 * Update the meta information of the collection. The
		 * update could be partial or complete.
		 *
		 * @param {Object} options The meta information to update
		 */
		updateInfo: function (options) {
			this.fetch();
		},

		/**
		 * Create a summary model
		 *
		 * @private
		 * @param {Array} models The list of model to add the model created
		 * @param {String} version The version
		 * @param {number} versionCount The version count to group multiple rows
		 * @param {String} project The project
		 * @param {number} projectCount The project count to group multiple rows
		 * @param {String} category The category
		 * @param {Object} stats The statistics of the row
		 * @param {String} crcId The CRC ID to build links
		 * @returns {SummaryModel} The model created
		 */
		_createSummaryModel: function(models, version, versionCount, project, projectCount, category, stats, crcId) {
			// Create the model
			var model = new SummaryModel({
				version: version,
				versionSize: versionCount,
				project: project,
				projectSize: projectCount,
				category: category,
				stats: stats,
				crcId: crcId
			});

			// Add it to the array of models
			models.push(model);

			return model;
		}
	});

	/**
	 * Define a class to store the original tests stored in the
	 * test collections to apply filtering and so on
	 *
	 * @constructor
	 */
	function OriginalTestCollection () {
		this.items = {};
		this.size = 0;
	}

	_.extend(OriginalTestCollection.prototype, {
		/**
		 * Add a test to the collection
		 *
		 * @param {String} key The key of the test
		 * @param {Backbone.Model} item The test to add
		 */
		add: function(key, item) {
			if (item instanceof Backbone.Model) {
				// Check if the item is already present
				if (!this.exists(key)) {
					this.size++;
				}

				// Store the item
				this.items[key] = item;
			}
		},

		/**
		 * Remove a test from the collection
		 *
		 * @param {String} key The key of the test
		 */
		remove: function(key) {
			if (this.exists(key)) {
				this.items = _.omit(this.items, key);
				this.size--;
			}
		},

		/**
		 * Check if the test is already present in the collection
		 *
		 * @param {String} key The key to check
		 * @returns {boolean} True if the item is in the collection, false otherwise
		 */
		exists: function(key) {
			return !_.isUndefined(this.items[key]);
		},

		/**
		 * Retrieve the item by its key
		 *
		 * @param key The key to retrieve
		 * @returns {Backbone.Model} The object found, undefined otherwise
		 */
		find: function(key) {
			return this.items[key];
		},

		/**
		 * Remove all the elements from the collection
		 */
		empty: function() {
			delete this.items;
			this.items = {};
			this.size = 0;
		},

		/**
		 * Get the collection as an array
		 *
		 * @returns {Array} The array of the collection
		 */
		toArray: function() {
			return _.toArray(this.items);
		}
	});

	/**
	 * Represent a Project model used in the project collection
	 */
	ProbeDockRT.ProjectModel = Backbone.Model.extend();

	/**
	 * Represent a ProjectCollection used to manage the different projects
	 * with the tests results associated.
	 */
	ProbeDockRT.ProjectCollection = Backbone.Collection.extend({
		model: ProbeDockRT.ProjectModel,

		/**
		 * Initialize the collection with default state
		 *
		 * @param {Array<ProjectModel|Object>} models The list of projects
		 * @param {Object} options The options to configure the collection
		 */
		initialize: function (models, options) {
			this.meta = {
				page: 1,
				perPage: 100,
				term: "",
				sort: {}
			};
		},

		/**
		 * Comparator function to order the project by
		 * the combination of version, name and category
		 *
		 * @param {ProjectModel} model The model to get the ordering data
		 * @returns {String} The project id
		 */
		comparator: function(model) {
			return model.get('id');
		},

		/**
		 * Override the sync method from Backbone to use
		 * the collection client side only
		 *
		 * @param {String} method The HTTP method
		 * @param {Array<ProjectModel> | ProjectModel} model The list of models or model to manage
		 * @param {Object} options The options to configure the sync
		 */
		sync: function (method, model, options) {
			var _self = this, storedSuccess = options.success;

			/**
			 * Override the success callback
			 *
			 * @param {Object} response The simulated response from the server
			 */
			options.success = function (response) {
				storedSuccess(response);
				_self.trigger("fetched");
			};

			// Call synchronously the success callback
			options.success(this.models);
		},

		/**
		 * Reset and fetch again the collection models
		 */
		refresh: function() {
			this.reset();
			this.fetch();
		},

		/**
		 * Retrieve the meta information of the collection
		 *
		 * @returns {Object} The meta information of the collection
		 */
		getInfo: function() {
			return this.meta;
		},

		/**
		 * Update the meta information of the collection. The
		 * update could be partial or complete.
		 *
		 * @param {Object} options The meta information to update
		 */
		updateInfo: function (options) {
			/**
			 * Propagate the update of data information to all the sub collections
			 */
			this.each(function(project) {
				project.get('tests').updateInfo(options);
			});
		}
	});

	/**
	 * Model to represent a test result
	 */
	ProbeDockRT.TestModel = Backbone.Model.extend({
		orderableFields: ['id', 'name', 'duration', 'passed']
	});

	/**
	 * Generic collection to manage the test results
	 */
	var GenericTestCollection = Backbone.Collection.extend({
		model: ProbeDockRT.TestModel,

		/**
		 * Define if the collection could be paginated
		 */
		pagerEnabled: false,

		/**
		 * Initialize the collection
		 *
		 * @param {Array<TestModel|Object>} models The list of models
		 * @param {Object} options The options to configure the collection
		 */
		initialize: function (models, options) {
			/**
			 * Initialize the original models collection to handle the different
			 * operation of filtering, ordering and so on
			 */
			this.originalModels = new OriginalTestCollection();

			// Check if the meta are provided
			var meta = null;
			if (options && options.meta) {
				meta = options.meta;
			}

			// Configure the default meta information
			this.meta = _.defaults(meta || {}, {
				page: 1,
				perPage: 10,
				term: "",
				sort: {}
			});

			// Check if filters are given
			if (options.externalState) {
				this.externalState = options.externalState;
			}
		},

		/**
		 * Override the reset function
		 *
		 * @param models The models to set in place of the currents
		 * @param options The options to configure the reset
		 */
		reset: function(models, options) {
			if (!models) {
				delete this.originalModels;
				this.originalModels = new OriginalTestCollection();
			}

			Backbone.Collection.prototype.reset.call(this, models, options);
		},

		/**
		 * Retrieve a test from its id from the original models
		 *
		 * @param {String} id The id of the test
		 * @returns {Backbone.Model} The test found, undefined if not found
		 */
		getFromOriginals: function(id) {
			if (this.originalModels.exists(id)) {
				return this.originalModels.find(id);
			}
			else {
				return null;
			}
		},

		/**
		 * Process the filter operation
		 *
		 * @param {Array<TestModel>} models The list of models to filter
		 * @returns {Object<TestModel>} The list of models filtered
		 */
		filter: function(models) {
			// Apply the filtering
			return _.reduce(models, function(memo, model) {
				// Check if the model must be kept
				if (this._modelFilter(model)) {
					memo.push(model);
				}

				return memo;
			}, [], this);
		},

		/**
		 * Reset and fetch again the collection models
		 */
		refresh: function() {
			this.reset();
			this.fetch();
		},

		/**
		 * Retrieve the meta information of the collection
		 *
		 * @returns {Object} The meta information of the collection
		 */
		getInfo: function() {
			return this.meta;
		},

		/**
		 * Update the meta information of the collection. The
		 * update could be partial or complete.
		 *
		 * @param {Object} options The meta information to update
		 */
		updateInfo: function (options) {
			// Update the information
			if (options) {
				// Update the filters
				if (options.externalState) {
					this.externalState = options.externalState;
					options = _.omit(options, 'externalState');
				}

				this.meta = _.defaults(options, this.meta);
			}

			// Refresh the collection
			this.fetch();
		},

		/**
		 * Model filter to check if the model should be shown or not
		 *
		 * @private
		 * @param {Object} model The model to analyse
		 * @returns {boolean} True if the models is viewable, false otherwise
		 */
		_modelFilter: function(model) {
			var keep = false;

			// Filter on textual elements
			var textFilter = this.externalState.state.filters.text;
			if (textFilter === '' || (textFilter !== '' && (
					_.str.include(model.get('id'), textFilter) || // Check if the key match
					_.str.include(model.get('name'), textFilter) || // Check if the name match
					_.str.include(model.get('flatten_tags'), textFilter) || // Check if the tags match
					_.str.include(model.get('flatten_tickets'), textFilter) || // Check if the tickets match
					_.str.include(model.get('message'), textFilter) // Check if the message match
				))) {
				keep = true;
			}

			if (keep) {
				// Check if the test is inactive and inactive must be kept
				keep = this.externalState.state.filters.status.inactive && model.get('flags') == 1;

				// Check if the test is passed (or not) and passed (or not) must be kept
				if (!keep && model.get('flags') != 1 &&
					((this.externalState.state.filters.status.passed && model.get('passed')) || (this.externalState.state.filters.status.failed && !model.get('passed')))) {
					keep = true;
				}
			}

			return keep;
		}
	});

	/**
	 * The test collection used to represent the test results
	 * in Squares and Tables representations
	 */
	ProbeDockRT.TestCollection = GenericTestCollection.extend({
		/**
		 * Apply the pagination on the collection
		 *
		 * @param {Array<TestModel>} models The list of models to slice
		 * @returns {Array<TestModel>} The list of models sliced
		 */
		slice: function(models) {
			// Calculate the number of pages
			this.meta.pages = Math.ceil(models.length / this.meta.perPage);

			// Get the number of models
			this.meta.totalItems = models.length;

			// Calculate the first record for the page
			this.meta.from = (this.meta.page - 1) * this.meta.perPage;

			// Calculate the last record for the page
			this.meta.to = this.meta.from + this.meta.perPage;

			// Correct the from and to when there is not enough record
			if (this.meta.from > models.length) {
				this.meta.from = models.length - this.meta.perPage;
				this.meta.to = this.meta.from + this.meta.perPage;
				this.meta.page = Math.ceil((this.meta.from / this.meta.perPage)) + 1;

				if (this.meta.from < 0) {
					this.meta.from = 0;
					this.meta.to = this.meta.perPage;
					this.meta.page = 1;
				}
			}

			// Get only the models for the slice
			models = models.slice(this.meta.from, this.meta.to);

			// Update the record number for human readability
			this.meta.from++;

			return models;
		},

		_sort: function(models) {
			var self = this;

			return models.sort(function(left, right) {
				var result = 0;

				_.each(self.meta.sort, function(direction, fieldId) {
					var leftStr = left.get(left.orderableFields[fieldId]).toString().toLowerCase();
					var rightStr = right.get(right.orderableFields[fieldId]).toString().toLowerCase();
					var comp = leftStr.localeCompare(rightStr);
					if (comp !== 0) {
						result = comp * (direction === 'A' ? 1 : -1);
					}
				});

				return result;
			});
		},

		/**
		 * Override the original function to add a test to handle properly
		 * the filters and paging when it is required
		 *
		 * @param {Object} model The model to add to the collection
		 * @param {Object} options The options to configure the add function
		 */
		add: function(model, options) {
			// Check if the model is already a Backbone model
			if (model instanceof Backbone.Model) {
				// Add the model to the original models
				this.originalModels.add(model.get('id'), model);

				// Check if the model must be added to the models or only to the original models
				if (this._modelFilter(model) && (!this.externalState.state.paging || (this.externalState.state.paging && this.models.length < this.meta.perPage))) {
					Backbone.Collection.prototype.add.call(this, model, options);
				}

				// Lazy creation of the debounced version of the info refresh
				if (!this._debouncedInfo) {
					var self = this;
					this._debouncedInfo = _.debounce(function() {
						// Update the info (pager, ...)
						self.meta.totalItems = self.originalModels.size;
						self.meta.pages = Math.ceil(self.originalModels.size / self.meta.perPage);

						// Trigger an event to notify the view (for example) about the info updated
						self.trigger('info:updated');
					}, 100);
				}

				this._debouncedInfo();
			}
			else {
				Backbone.Collection.prototype.add.call(this, model, options);
			}
		},

		/**
		 * Override the sync method from Backbone to use
		 * the collection client side only
		 *
		 * @param {String} method The HTTP method
		 * @param {Array<TestModel> | TestModel} model The list of models or model to manage
		 * @param {Object} options The options to configure the sync
		 */
		sync: function (method, model, options) {
			var _self = this, storedSuccess = options.success;

			/**
			 * Override the success callback
			 *
			 * @param {Object} response Simulated server response
			 */
			options.success = function (response) {
				storedSuccess(response);
				_self.trigger("fetched");
			};

			// Get a new array and keep the original one untouched
			var models = this.originalModels.toArray();

			// Filter the models
			models = this.filter(models);

			// Slice the models if paging is enabled
			if (this.externalState.state.paging) {
				models = this._sort(models);
				models = this.slice(models);
			}

			// Run the success callback synchronously
			options.success(models);
		}

	//    localData = _.filter localData, (model) =>
	//      return model.match(@meta.term.toLowerCase())
	//
	//    # Filtered items
	//    @meta.items = localData.length
	//
	//    localData = localData.sort (a, b) =>
	//      for idx, direction of @meta.sort
	//        if direction
	//          left = a.getFromIndex(idx).toString().toLowerCase()
	//          right = b.getFromIndex(idx).toString().toLowerCase()
	//          comp = left.localeCompare(right)
	//          return comp * (if direction == 'A' then 1 else -1) if comp != 0
	//
	//      return 0
	//
	});

	/**
	 * The test collection used to represent the test results
	 * in the details view
	 */
	ProbeDockRT.TestDetailsCollection = GenericTestCollection.extend({
		/**
		 * Comparator to use to order the models
		 *
		 * @param {TestModel} model The model to get the right data for sorting
		 * @returns {number} The order attribute
		 */
		comparator: function(model) {
			// Negate the attribute to do a reverse order
			return - model.get('order');
		},

		/**
		 * Override the original function to add a test to handle properly
		 * the filters
		 *
		 * @param {Object} model The model to add to the collection
		 * @param {Object} options The options to configure the add function
		 */
		add: function(model, options) {
			// Check if the model is already a Backbone model
			if (model instanceof Backbone.Model) {
				// Add the model to the original models
				this.originalModels.add(model.get('id'), model);

				// Check if the model must be added to the models or only to the original models
				if (this._modelFilter(model)) {
					Backbone.Collection.prototype.add.call(this, model, options);
				}
			}
			else {
				Backbone.Collection.prototype.add.call(this, model, options);
			}
		},

		/**
		 * Override the original function to remove a test to handle properly
		 * the filters and so on
		 *
		 * @param {Object} model The model to remove from the collection
		 * @param {Object} options The options to configure the remove function
		 */
		remove: function(model, options) {
			if (model instanceof Backbone.Model) {
				this.originalModels.remove(model.get('id'));
			}
			Backbone.Collection.prototype.remove.call(this, model, options);
		},

		/**
		 * Override the sync method from Backbone to use
		 * the collection client side only
		 *
		 * @param {String} method The HTTP method
		 * @param {Array<TestModel> | TestModel} model The list of models or model to manage
		 * @param {Object} options The options to configure the sync
		 */
		sync: function (method, model, options) {
			var _self = this, storedSuccess = options.success;

			/**
			 * Override the success callback
			 *
			 * @param {Object} response Simulated server response
			 */
			options.success = function (response) {
				storedSuccess(response);
				_self.trigger("fetched");
			};

			// Get a new array and keep the original one untouched
			var models = this.originalModels.toArray();

			// Filter the models
			models = this.filter(models);

			// Call the success callback synchronously
			options.success(models);
		}
	});
}).call(this);

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
(function() {
	/**
	 * Initialize the socket protocol with the server agent
	 */
	ProbeDockRT.app.addInitializer(function() {
		var self = this;

		// Connect to ProbeDock-RT Server Agent
		this.socket = io.connect(window.location.protocol + '//' + window.location.host);

		// Define strings
		var mini = 'Probe Dock RT Agent';
		var connectionEstablished = 'Connection to ' + mini + ' established';

		// When the connection is correctly established
		this.socket.on('connect', function() {
			self.trigger('notify:message', connectionEstablished, 'success');

			self.trigger('filters:set');

			connectionEstablished = 'You have been reconnected to ' + mini;
		});

		// Any error that was not captured before
		this.socket.on('error', function(message) {
			self.trigger('notify:message', 'Unexpected error occurred: ' + message, 'error');
		});

		// Listen when the SocketIO server cut the connection
		this.socket.on('disconnect', function() {
			self.trigger('notify:message', 'You have been disconnected from the ' + mini, 'error');
		});

		// Listen when SocketIO client try to reconnect to probe dock rt agent
		this.socket.on('reconnecting', function(duration) {
			self.trigger('notify:reconnect', 'Attempt to reconnect in {countdown} to the ' + mini + ' is in progress', duration);
		});

		// Handle the payload reception
		this.socket.on('payload', function (data) {
			try {
				if (data) {
					self.trigger('payload:received', JSON.parse(data));
				}
			}
			catch (err) {
				self.trigger('notify:message', 'Unable to parse and show the data: ' + err, 'error');
			}
		});

		// Show a notification when a test run starts
		this.socket.on('run:start', function(data) {
			self.trigger('notify:run:start', data);
		});

		// Handle the test result reception and notify
		this.socket.on('run:test:result', function(data) {
			if (data) {
				self.trigger('notify:run:test:result', data);
				self.trigger('test:result:received', data);
			}
		});

		// Show a notification when a test run ends
		this.socket.on('run:end', function(data) {
			self.trigger('notify:run:end', data);
		});

		// Set the filters on the server agent
		this.on('filters:set', function(filters) {
			if (!_.isUndefined(filters) && filters.length > 0) {
				this.socket.emit('filters:set', {filters: filters});
			}
			else {
				this.socket.emit('filters:reset');
			}
		}, this);

		// For debug purposes
		if (DEBUG) {
			this.socket.emit('payload:get', function(data) {
				try {
					if (data) {
						self.trigger('payload:received', JSON.parse(data));
					}
				}
				catch (err) {
					self.trigger('notify:message', 'Unable to parse and show the data: ' + err, 'error');
				}
			});
		}
	});
}).call(this);

(function() {
	/**
	 * Tooltipable view allow creating a view with automatically
	 * enabled the tooltips to be rendered
	 */
	ProbeDockRT.TooltipableView = Marionette.ItemView.extend({
		defaultTooltipable: '.btn',

		/**
		 * Retrieve all the tooltips on the different buttons
		 * and prepare the tooltips
		 */
		onRender: function() {
			this.initTooltip(this.$el.find(this._tooltipable()));
			this.delegateEvents(this.events);
		},

		/**
		 * Initialize the tooltips
		 *
		 * @param {Element} elements One or more elements to init the tooltips
		 */
		initTooltip: function(elements) {
			elements.tooltip({
				container: 'body',
				placement: 'bottom',
				delay: {show: 750},
				trigger: 'hover'
			});
		},

		/**
		 * Get the tooltipable element
		 *
		 * @private
		 * @returns {*} The tooltipable element
		 */
		_tooltipable: function() {
			if (!_.isUndefined(this.tooltipable)) {
				if (_.isFunction(this.tooltipable)) {
					return this.tooltipable();
				}
				else {
					return this.tooltipable;
				}
			}
			else {
				return this.defaultTooltipable;
			}
		}
	});
}).call(this);
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

(function() {
	/**
	 * Notification container. In this view, the different notifications
	 * are displayed and managed.
	 */
	ProbeDockRT.NotificationContainerView = ProbeDockRT.TooltipableView.extend({
		tooltipable: '.notifications-ack',

		// Define the UI elements used to render the notifications
		ui: {
			nonotification: '.no-notification',
			notifications: '.notifications'
		},

		// Define the events to react
		events: {
			'click .notifications-ack': 'ackNotifications'
		},

		/**
		 * Show a notification in the container and handle when there are no
		 * more notifications displayed.
		 *
		 * @param {NotificationView} notificationView The notification to show
		 */
		showNotification: function(notificationView) {
			// Check if there is no notifcation already shown
			if (this.ui.notifications.children().length === 0) {
				this.ui.nonotification.hide();
				this.ui.nonotification.text("No more notifications");
				this.ui.notifications.show();
			}

			// Listen to the notification view for the closed event
			this.listenTo(notificationView, 'closed', function() {
				if (this.ui.notifications.children().length === 0) {
					this.ui.nonotification.show();
					this.ui.notifications.hide();
				}
			}, this);

			// Render the view
			notificationView.render();

			// Add the result of the rendering to the notification container
			this.ui.notifications.prepend(notificationView.$el);
		},

		/**
		 * Acknowledge all the notifications
		 *
		 * @param {Event} event The click event
		 */
		ackNotifications: function(event) {
			event.preventDefault();
			this.ui.notifications.find('notification').alert('close');
			this.ui.nonotification.show();
			this.ui.notifications.hide();
			this.ui.notifications.empty();
		}
	});
}).call(this);
(function() {
	/**
	 * Notification view is the main view used to show notification
	 * in the notification panel.
	 */
	ProbeDockRT.NotificationView = Marionette.ItemView.extend({
		// Default class to set on the element managed by the view
		defaultClassName: 'alert notification',

		// Configure the events to close the notifications
		events: {
			'click .notification-close': 'closeNotification'
		},

		/**
		 * Define the template helpers
		 *
		 * @returns {Object} The template helpers functions
		 */
		templateHelpers: function() {
			// Be sure there is a contentTemplate function helper
			return {
				titleHelper: this.title ? this.title : function(data) { return '<h4>' + data.title + '</h4>'; },
				contentHelper: this.contentTemplate ? this.contentTemplate : function(data) { return ''; }
			};
		},

		/**
		 * Template function which calls the `contentTemplate` will
		 * be called when `template` is run. An empty function is
		 * automatically created when none is provided.
		 *
		 * @param {object} data Data used to fill the template
		 * @returns {string} The template string ready to be rendered
		 */
		template: function(data) {
			return '' +
				'<div class="text-left" />' +
				'<button class="notification-close" data-dismiss="alert">' +
					'<i class="icon-remove"></i>' +
				'</button>' +
				data.titleHelper(data) +
				'<span><i class="icon-time"></i>&nbsp;' + _.now() + '</span><hr />' +
				data.contentHelper(data) +
				'</div>';
		},

		/**
		 * Class name to enrich on the current element. If additional
		 * class names are present under `additionalClassName`, the `className`
		 * will be extended by it.
		 *
		 * @returns {string} The complete class name
		 */
		className: function () {
			if (this.additionalClassName) {
				if (_.isFunction(this.additionalClassName)) {
					return this.defaultClassName + ' ' + this.additionalClassName();
				}
				else {
					return this.defaultClassName + ' ' + this.additionalClassName;
				}
			}
			else {
				return this.defaultClassName;
			}
		},

		/**
		 * Override the serialize data from `Marionette.ItemView` by extending
		 * the data with the title given in options
		 *
		 * @returns {Object} The data ready to be given to the `template` function
		 */
		serializeData: function() {
			return _.extend(Marionette.ItemView.prototype.serializeData.apply(this), {title: this.options.title});
		},

		/**
		 * Once the view is rendered, a jQuery event is bind
		 * on the `$el` to allow clicking on the notification to
		 * close it.
		 */
		onRender: function() {
			var self = this;
			this.$el.click(function(event) {
				self.closeNotification(event);
			});
		},

		/**
		 * Handle the close notification event
		 *
		 * @param {Event} event Event triggered by the user interface to close the notification
		 */
		closeNotification: function(event) {
			this.$el.alert('close');
			this.remove();
			this.trigger('closed');
		}
	});
}).call(this);
(function() {
	/**
	 * Statistic notification to show information about the test
	 * run finished
	 */
	ProbeDockRT.StatisticsNotificationView = ProbeDockRT.NotificationView.extend({
		// Additional class
		additionalClassName: 'alert-success',

		/**
		 * Build the notification content
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {string} The template ready to be rendered
		 */
		contentTemplate: function(data) {
			return '' +
				'<span>' +
				'Tests: ' + data.total + ', ' +
				'Passed: ' + data.passed + ', ' +
				'Failed: ' + data.failed + ', ' +
				'Inactive: ' + data.inactive + ', ' +
				'Duration: ' + _.formatDuration(data.duration) +
				'</span>';
		}
	});
}).call(this);
(function() {
	/**
	 * Error notification to show any unexpected error that
	 * has occurred.
	 */
	ProbeDockRT.MessageNotificationView = ProbeDockRT.NotificationView.extend({
		// Additional class
		additionalClassName: function() {
			return 'alert-' + this.options.type;
		},

		/**
		 * Build the notification title
		 *
		 * @param data The data to fill the template
		 * @returns {string} The template ready to render
		 */
		title: function(data) {
			var title = '';
			var titleIcon = '';

			switch (data.type) {
				case 'success':
					title = 'Success';
					titleIcon = 'ok-sign';
					break;
				case 'warning':
					title = 'Warning';
					titleIcon = 'warning-sign';
					break;
				case 'error':
					title = 'Error';
					titleIcon = 'exclamation-sign';
					break;
				default:
					title = 'Info';
					titleIcon = 'question-sign';
			}

			return '<h4><i class="icon-' + titleIcon + '"></i>&nbsp;' + title + '</h4>';
		},

		/**
		 * Build the notification content
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {string} The template ready to render
		 */
		contentTemplate: function(data) {
			return '<p>' + data.message + '</p>';
		},

		/**
		 * Override the serialize data from `NotificationView` by extending
		 * the data with the type given
		 *
		 * @returns {Object} The data ready to be given to the `template` function
		 */
		serializeData: function() {
			return _.extend(ProbeDockRT.NotificationView.prototype.serializeData.apply(this), {type: this.options.type});
		}
	});
}).call(this);
(function() {
	/**
	 * Allows to
	 */
	ProbeDockRT.ReconnectNotificationView = ProbeDockRT.MessageNotificationView.extend({
		// Define
		ui: {
			countdown: '.countdown'
		},

		onRender: function() {
			this.ui.countdown.text(_.formatDuration(this.model.get('duration'), {units: {m: 'minutes', s: 'seconds'}, skipZeroValues: true}));

			var self = this;
			var timerId = setInterval(function() {
				self.model.set('duration', self.model.get('duration') - 1000);

				self.ui.countdown.text(_.formatDuration(self.model.get('duration'), {units: {m: 'minutes', s: 'seconds'}, skipZeroValues: true}));

				if (self.model.get('duration') == 0) {
					clearInterval(timerId);
				}
			}, 1000);
		},

		/**
		 * Build the notification content
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {string} The template ready to render
		 */
		contentTemplate: function(data) {
			return '<p>' + data.message.replace('{countdown}', '<span class="countdown" />') + '</p>';
		}
	});
}).call(this);
(function() {
	/**
	 * Error notification to show any unexpected error that
	 * has occurred.
	 */
	ProbeDockRT.TestRunNotificationView = ProbeDockRT.NotificationView.extend({
		// Additional class
		additionalClassName: 'alert-info',

		/**
		 * Build the notification content
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {string} The template ready to be rendered
		 */
		contentTemplate: function(data) {
			return '' +
				'<p>' +
				'<span>Project: ' + data.project.name + '</span><br />' +
				'<span>Version: ' + data.project.version + '</span><br />' +
				'<span>Category: ' + data.category + '</span>' +
				(!data.start ? '<br /><span>Duration: ' + _.formatDuration(data.duration) + '</span>' : '') +
				'</p>';
		}
	});
}).call(this);
(function() {
	/**
	 * Error notification to show any unexpected error that
	 * has occurred.
	 */
	ProbeDockRT.TestNotificationView = ProbeDockRT.NotificationView.extend({
		// Additional class
		additionalClassName: 'alert-info',

		events: {
			'click .test-notification': 'showTestDetails'
		},

		ui: {
			key: 'code'
		},

		/**
		 * Build the notification title
		 *
		 * @param data The data to fill the template
		 * @returns {string} The template ready to render
		 */
		title: function(data) {
			var title = '<span class="test-notification {testNotificationClass}"><i class="{icon}"></i>&nbsp;Test <code>' + data.k + '</code> {statusText}</span>';

			title = title.replace('{statusText}', data.p ? 'passed' : 'failed').replace('{icon}', data.p ? 'icon-thumbs-up' : 'icon-thumbs-down');
			if (data.f == 1) {
				title = title.replace('{testNotificationClass}', 'test-notification-inactive');
			}
			else {
				title = title.replace('{testNotificationClass}', data.p ? 'test-notification-passed' : 'test-notification-failed');
			}
			return '<h4>' + title + '</h4>';
		},

		/**
		 * Build the notification content
		 *
		 * @param {Object} data The data to fill the template
		 * @returns {string} The template ready to render
		 */
		contentTemplate: function(data) {
			return '<p>' + data.n + '</p>';
		},

		/**
		 * Handle the event to add the test details to the details list
		 *
		 * @param {Event} event The click event
		 */
		showTestDetails: function(event) {
			event.preventDefault();
			event.stopPropagation();

			// Differentiate the action to add a key filter or to show the test details
			if (event.altKey) {
				this.trigger('filter', 'key:' + this.ui.key.text());
			}
			else {
				this.trigger('show:details', this.ui.key.text());
			}
		}
	});
}).call(this);

(function() {
	/**
	 * Initialize the view in the ProbeDockRT application controller
	 */
	ProbeDockRT.app.addInitializer(function (options) {
		// Configure the region
		this.addRegions({
			notifications: '.notifications-outer-container'
		});

		// Create the container notification
		var notificationContainerView = new ProbeDockRT.NotificationContainerView(_.extend({el: $('.notifications-inner-container')}, options));

		// Show statistic notification
		notificationContainerView.listenTo(this, 'notify:stats', function(stats) {
			notificationContainerView.showNotification(new ProbeDockRT.StatisticsNotificationView({model: new Backbone.Model(stats), title: 'Test results received'}));
		});

		// Show message
		notificationContainerView.listenTo(this, 'notify:message', function(message, type) {
			notificationContainerView.showNotification(new ProbeDockRT.MessageNotificationView({model: new Backbone.Model({message: message}), type: type}));
		});

		// Show reconnect notification
		notificationContainerView.listenTo(this, 'notify:reconnect', function(message, duration) {
			notificationContainerView.showNotification(new ProbeDockRT.ReconnectNotificationView({model: new Backbone.Model({message: message, duration: duration}), type: 'info'}));
		});

		// Show a notification when a test run starts
		notificationContainerView.listenTo(this, 'notify:run:start', function(data) {
			notificationContainerView.showNotification(new ProbeDockRT.TestRunNotificationView({model: new Backbone.Model(_.extend(data, {start: true})), title: 'Test run started'}));
		});

		// Show a notification when a test run ends
		notificationContainerView.listenTo(this, 'notify:run:end', function(data) {
			notificationContainerView.showNotification(new ProbeDockRT.TestRunNotificationView({model: new Backbone.Model(_.extend(data, {start: false})), title: 'Test run ended'}));
		});

		// Show a notification when a test is received
		notificationContainerView.listenTo(this, 'notify:run:test:result', function(data) {
			var notification = new ProbeDockRT.TestNotificationView({model: new Backbone.Model(data)});

			// Listen to the show details event to show a test in the details view
			ProbeDockRT.app.listenTo(notification, 'show:details', function(testKey) {
				this.trigger('add:test:details', testKey);
			}, ProbeDockRT.app);

			// Listen to the filter to add filter by key in the filters view
			ProbeDockRT.app.listenTo(notification, 'filter', function(filter) {
				this.trigger('filter:add', filter);
			}, ProbeDockRT.app);

			// Show the view
			notificationContainerView.showNotification(notification);
		});

		// Render and show the notification container
		this.notifications.attachView(notificationContainerView.render());
	});
}).call(this);

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
			if (this.model.get('flags') == 1) {
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
				title: '<span class="square-popover-title">' + this.model.get('id') + '</code>',
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
			return '<th class="s center">Key<span class="sorting-wrapper"><i class="sorting icon-sort"></i></span></th>' +
				'<th>Name<span class="sorting-wrapper"><i class="sorting icon-sort"></i></span></th>' +
				'<th class="s center">Duration<span class="sorting-wrapper"><i class="sorting icon-sort"></i></span></th>' +
				'<th class="s center">Status<span class="sorting-wrapper"><i class="sorting icon-sort"></i></span></th>';
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

			if (data.flags == 1) {
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
				'<td class="center"><span class="badge ' + colorClass + '">' + data.passed + '</span></td>';
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
		// Create the view with the projects collection
		var view = new TablesCollectionsView({collection: this.projects});

		// Listen the shortcuts to add filters
		tablesEventAggregator.on('filter', function(filter) {
			this.trigger('filter:add', filter);
		}, this);

		// Listen the view mode to show the Tables
		this.on('show:results:tables', function() {
			// Show the view
			this.main.show(view);
		}, this);
	});
}).call(this);
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

/**
 * Start the application when the page is loaded
 */
$(document).ready(function() {
	ProbeDockRT.app.start();
});