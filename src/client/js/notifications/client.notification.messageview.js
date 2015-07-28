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
