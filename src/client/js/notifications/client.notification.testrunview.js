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
				'<span>Project: ' + data.project.apiId + '</span><br />' +
				'<span>Version: ' + data.project.version + '</span><br />' +
				'<span>Category: ' + data.category + '</span>' +
				(!data.start ? '<br /><span>Duration: ' + _.formatDuration(data.duration) + '</span>' : '') +
				'</p>';
		}
	});
}).call(this);