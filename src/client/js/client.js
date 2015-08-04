var DEBUG = false;

/**
 * Define the main application object
 */
var ProbeDockRT = window.ProbeDockRT = {
	version: "0.0.2"
};

//= client.marionette.render.js
//= client.mixin.js

//= client.model.js

//= client.appcontroller.js
//= client.socket.js

//= client.commons.js
//= client.toolbar.js
//= client.filter.js

//= notifications/client.notification.js

//= client.summary.js
//= client.test.view.squares.js
//= client.test.view.tables.js
//= client.test.view.details.js

//= client.viewmanager.js

/**
 * Start the application when the page is loaded
 */
$(document).ready(function() {
	ProbeDockRT.app.start();
});
