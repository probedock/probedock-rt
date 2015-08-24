module.exports = {
  toHaveClass: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected) {
        if (expected === undefined) {
          expected = '';
        }

        var result = {};

        if (actual === undefined || actual === null || actual.getAttribute === undefined) {
          result.message = "The actual webelement is not present and no class can be found";
          result.pass = false;

          return result;
        }

        else {
          return actual.getAttribute('class').then(function (classes) {
            result.pass = classes.split(' ').indexOf(cls) !== -1;

            if (result.pass) {
              result.message = 'The expected ' + expected + 'is present in actual webelement with ' + classes + ' classes.';
            }
            else {
              result.message = 'The expected ' + expected + 'is not present in actual webelement with ' + classes + ' classes.';
            }
          });
        }
      }
    }
  }
};
