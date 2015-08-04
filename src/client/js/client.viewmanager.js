(function () {
  /**
   * Toolbar to handle the different action and filtering on the test
   * results across the application
   */
  var ViewManagerView = ProbeDockRT.TooltipableView.extend({
    uiState: 'help',

    defaultTooltipable: '.main-action',

    events: {
      'mouseover .main-action': 'helpOn',
      'mouseout .main-action': 'helpOff',
      'click .help-open': 'switchHelp',
      'click .help-close': 'switchMain'
    },

    /**
     * Switch to the help page
     *
     * @param event
     */
    switchHelp: function (event) {
      event.preventDefault();

      this.switchUi('help');
    },

    /**
     * Switch to the main page
     *
     * @param event
     */
    switchMain: function (event) {
      event.preventDefault();

      this.switchUi('main');
    },

    /**
     * Switch the ui state
     *
     * @param toState The state to go
     */
    switchUi: function(toState) {
      if (toState == this.uiState) {
        return;
      }

      var mainUi = $('#main-ui');
      var helpUi = $('#help-ui');

      this.uiState = toState;

      switch (toState) {
        case 'help':
          mainUi.hide();
          helpUi.show();
          break;
        case 'main':
          mainUi.show();
          helpUi.hide();
          break;
      }
    }
  });

  /**
   * Initialize the view in the ProbeDockRT application controller
   */
  ProbeDockRT.app.addInitializer(function (options) {
    // Create the view
    var viewManager = new ViewManagerView(_.extend({el: $('body')}, options));

    this.on('notify:run:start', function () {
      viewManager.switchUi('main');
    });

    this.on('notify:run:test:result', function () {
      viewManager.switchUi('main');
    });
  });
}).call(this);