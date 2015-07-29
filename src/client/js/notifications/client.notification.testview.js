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
      var label;

      if (data.k) {
        label = '<code class="code-key" data-fp="' + data.f + '">' + data.k + '</code>'
      }
      else {
        label = '<code class="code-fingerprint" data-fp="' + data.f + '">' + data.f + '</code>'
      }

			var title = '<span class="test-notification {testNotificationClass}"><i class="{icon}"></i>&nbsp;Test ' + label + ' {statusText}</span>';

			title = title.replace('{statusText}', data.p ? 'passed' : 'failed').replace('{icon}', data.p ? 'icon-thumbs-up' : 'icon-thumbs-down');
			if (!data.e) {
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
				this.trigger('filter', 'fp', this.ui.key.data('fp'));
			}
			else {
        this.trigger('show:details', this.ui.key.data('fp'));
			}
		}
	});
}).call(this);