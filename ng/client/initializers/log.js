angular.module('probedock-rt').config(function(env, $logProvider) {
  $logProvider.debugEnabled(env != 'production');
});
