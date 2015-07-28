(function() {
	/**
	 * Tooltipable view allow creating a view with automatically
	 * enabled the tooltips to be rendered
	 */
	ProbeDockRT.TooltipableView = Marionette.ItemView.extend({
		defaultTooltipable: '.btn',

		/**
		 * Retrieve all the tooltips on the different buttons
		 * and prepare the tooltips
		 */
		onRender: function() {
			this.initTooltip(this.$el.find(this._tooltipable()));
			this.delegateEvents(this.events);
		},

		/**
		 * Initialize the tooltips
		 *
		 * @param {Element} elements One or more elements to init the tooltips
		 */
		initTooltip: function(elements) {
			elements.tooltip({
				container: 'body',
				placement: 'bottom',
				delay: {show: 750},
				trigger: 'hover'
			});
		},

		/**
		 * Get the tooltipable element
		 *
		 * @private
		 * @returns {*} The tooltipable element
		 */
		_tooltipable: function() {
			if (!_.isUndefined(this.tooltipable)) {
				if (_.isFunction(this.tooltipable)) {
					return this.tooltipable();
				}
				else {
					return this.tooltipable;
				}
			}
			else {
				return this.defaultTooltipable;
			}
		}
	});
}).call(this);