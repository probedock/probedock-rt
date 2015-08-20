'use strict';

describe('Execution filters: @probedock(contributor=laurent.prevost@probedock.io)', function () {
  var executionFilterField = element(by.model('filter.text'));
  var addButton = element(by.css('.filter-add'));
  var clearButton = element(by.css('.filter-clear-all'));
  var filterList = element.all(by.css('.filter-element'));

  beforeEach(function () {
    browser.get('/main');
  });

  it('the main page should show the execution filters box', function () {
    var executionFilters = element(by.css('.execution-filters'));
    expect(executionFilters.isPresent()).toBe(true);
  });

  it('should be possible to add a generic filter by clicking on the add button', function() {
    executionFilterField.sendKeys('test');

    addButton.click();

    expect(filterList.count()).toEqual(1);
    expect(filterList.first().element(by.css('.filter-element-text')).getText()).toContain('test');
  });

  it('should be possible to add multiple filters by clicking on the add button', function() {
    executionFilterField.sendKeys('test1');
    addButton.click();

    executionFilterField.sendKeys('test2');
    addButton.click();

    executionFilterField.sendKeys('test3');
    addButton.click();

    expect(filterList.count()).toEqual(3);
    expect(filterList.get(0).element(by.css('.filter-element-text')).getText()).toContain('test1');
    expect(filterList.get(1).element(by.css('.filter-element-text')).getText()).toContain('test2');
    expect(filterList.get(2).element(by.css('.filter-element-text')).getText()).toContain('test3');
  });

  it('should be possible to add a filter by pressing enter key', function() {
    executionFilterField.sendKeys('test\n');

    expect(filterList.count()).toEqual(1);
    expect(filterList.first().element(by.css('.filter-element-text')).getText()).toContain('test');
  });

  it('should be possible to clear all the filters at once', function() {
    executionFilterField.sendKeys('test1');
    addButton.click();

    executionFilterField.sendKeys('test2');
    addButton.click();

    executionFilterField.sendKeys('test3');
    addButton.click();

    expect(filterList.count()).toEqual(3);

    clearButton.click();

    expect(filterList.count()).toEqual(0);
  });


});
