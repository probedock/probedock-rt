'use strict';

describe('Operation @probedock(contributor=laurent.prevost@probedock.io)', function () {
  beforeEach(function () {
    browser.get('/main');
  });

  it('the main page should show the execution filters box', function () {
    var executionFilters = element(by.css('.execution-filters'));
    expect(executionFilters.isPresent()).toBe(true);
  });
});
