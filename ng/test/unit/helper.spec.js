createKeyEvent = function(type, keyCode) {
  var e = $.Event(type);
  e.keyCode = keyCode;
  return e;
}
