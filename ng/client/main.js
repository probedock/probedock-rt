angular.module('probedock-rt', [
  // libraries
  'angularMoment',
  //'ngAnimate',
  'ui.bootstrap',
  'pascalprecht.translate',
  // common modules
  'probedock-rt.i18n',
  'probedock-rt.config',
  'probedock-rt.sockets',

  // base application modules
  'probedock-rt.routes',

  'probedock-rt.main'
]);
