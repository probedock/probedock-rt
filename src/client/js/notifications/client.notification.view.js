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