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
