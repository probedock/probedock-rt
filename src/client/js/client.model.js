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