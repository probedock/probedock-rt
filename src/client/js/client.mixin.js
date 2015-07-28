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