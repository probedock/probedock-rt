//= client.notifications.containerview.js
//= client.notification.view.js
//= client.notification.statisticview.js
//= client.notification.messageview.js
//= client.notification.reconnectview.js
//= client.notification.testrunview.js
//= client.notification.testview.js

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
			ProbeDockRT.app.listenTo(notification, 'show:details', function(testId) {
				this.trigger('add:test:details', testId);
			}, ProbeDockRT.app);

			// Listen to the filter to add filter
			ProbeDockRT.app.listenTo(notification, 'filter', function(type, text) {
				this.trigger('filter:add', type, text);
			}, ProbeDockRT.app);

			// Show the view
			notificationContainerView.showNotification(notification);
		});

		// Render and show the notification container
		this.notifications.attachView(notificationContainerView.render());
	});
}).call(this);