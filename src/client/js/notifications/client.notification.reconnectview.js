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
