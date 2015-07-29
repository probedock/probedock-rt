(function() {
	/**
	 * Initialize the socket protocol with the server agent
	 */
	ProbeDockRT.app.addInitializer(function() {
		var self = this;

		// Connect to ProbeDock-RT Server Agent
		this.socket = io.connect(window.location.protocol + '//' + window.location.host);

		// Define strings
		var rt = 'Probe Dock RT Agent';
		var connectionEstablished = 'Connection to ' + rt + ' established';

		// When the connection is correctly established
		this.socket.on('connect', function() {
			self.trigger('notify:message', connectionEstablished, 'success');

			self.trigger('filters:set');

			connectionEstablished = 'You have been reconnected to ' + rt;
		});

		// Any error that was not captured before
		this.socket.on('error', function(message) {
			self.trigger('notify:message', 'Unexpected error occurred: ' + message, 'error');
		});

		// Listen when the SocketIO server cut the connection
		this.socket.on('disconnect', function() {
			self.trigger('notify:message', 'You have been disconnected from the ' + rt, 'error');
		});

		// Listen when SocketIO client try to reconnect to probe dock rt agent
		this.socket.on('reconnecting', function(duration) {
			self.trigger('notify:reconnect', 'Attempt to reconnect in {countdown} to the ' + rt + ' is in progress', duration);
		});

		// Handle the payload reception
		this.socket.on('payload', function (data) {
			try {
				if (data) {
					self.trigger('payload:received', JSON.parse(data));
				}
			}
			catch (err) {
				self.trigger('notify:message', 'Unable to parse and show the data: ' + err, 'error');
			}
		});

		// Show a notification when a test run starts
		this.socket.on('run:start', function(data) {
			self.trigger('notify:run:start', data);
		});

		// Handle the test result reception and notify
		this.socket.on('run:test:result', function(data) {
			if (data) {
				self.trigger('notify:run:test:result', data);
				self.trigger('test:result:received', data);
			}
		});

		// Show a notification when a test run ends
		this.socket.on('run:end', function(data) {
			self.trigger('notify:run:end', data);
		});

		// Set the filters on the server agent
		this.on('filters:set', function(filters) {
			if (!_.isUndefined(filters) && filters.length > 0) {
				this.socket.emit('filters:set', {filters: filters});
			}
			else {
				this.socket.emit('filters:reset');
			}
		}, this);

		// For debug purposes
		if (DEBUG) {
			this.socket.emit('payload:get', function(data) {
				try {
					if (data) {
						self.trigger('payload:received', JSON.parse(data));
					}
				}
				catch (err) {
					self.trigger('notify:message', 'Unable to parse and show the data: ' + err, 'error');
				}
			});
		}
	});
}).call(this);