(function() {
	/**
	 * Override the way that Marionette.Renderer works
	 *
	 * @param template The template to render
	 * @param data The data to fill in the template
	 * @returns {*} Nothing if the template is not defined, the result of the template function if template is a function
	 */
	Marionette.Renderer.render = function(template, data) {
		if (_.isUndefined(template)) {
			return;
		}
		else {
			var templateFunc = typeof template === 'function' ? template : Marionette.TemplateCache.get(template);
			return templateFunc(data);
		}
	};
}).call(this);