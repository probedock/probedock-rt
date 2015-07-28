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