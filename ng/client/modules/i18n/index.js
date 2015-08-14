angular.module('probedock-rt.i18n', [ 'pascalprecht.translate' ])
  .factory('i18n', function(amMoment, $translate) {
    var service = {
      locale: 'en',

      setLocale: function(locale) {
        if (locale) {
          service.locale = locale;
        }

        amMoment.changeLocale(service.locale);
        $translate.use(service.locale);
      }
    };

    return service;
  })
;
