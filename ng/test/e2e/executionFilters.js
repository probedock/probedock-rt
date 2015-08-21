'use strict';

describe('Execution filters: @probedock(contributor=laurent.prevost@probedock.io)', function () {
  var executionFilterField = element(by.model('filter.text'));
  var addButton = element(by.css('.execution-filters-add'));
  var clearButton = element(by.css('.execution-filters-clear-all'));
  var filterList = element.all(by.css('.execution-filters-element'));

  beforeEach(function () {
    browser.get('/main');
  });

  it('the main page should show the execution filters box in a default state', function () {
    var executionFilters = element(by.css('.execution-filters'));
    expect(executionFilters.isPresent()).toBe(true);
    expect(executionFilters.getAttribute('value')).toBeNull();

    expect(addButton.isEnabled()).toBeFalsy();
    expect(clearButton.isEnabled()).toBeFalsy();
  });

  it('the add button should be enabled when at least one character is entered', function() {
    executionFilterField.sendKeys('a');
    expect(addButton.isEnabled()).toBeTruthy();
  });

  it('the clear button should be enabled when at least one execution filtered is defined', function() {
    executionFilterField.sendKeys('a\n');
    expect(clearButton.isEnabled()).toBeTruthy();
  });

  it('should be possible to add a generic filter by clicking on the add button', function() {
    executionFilterField.sendKeys('test');

    addButton.click();

    expect(filterList.count()).toEqual(1);
    expect(filterList.first().element(by.css('.execution-filters-element-text')).getText()).toContain('test');
  });

  it('should be possible to add multiple filters by clicking on the add button', function() {
    executionFilterField.sendKeys('test1');
    addButton.click();

    executionFilterField.sendKeys('test2');
    addButton.click();

    executionFilterField.sendKeys('test3');
    addButton.click();

    expect(filterList.count()).toEqual(3);
    expect(filterList.get(0).element(by.css('.execution-filters-element-text')).getText()).toContain('test1');
    expect(filterList.get(1).element(by.css('.execution-filters-element-text')).getText()).toContain('test2');
    expect(filterList.get(2).element(by.css('.execution-filters-element-text')).getText()).toContain('test3');
  });

  it('should be possible to add a filter by pressing enter key', function() {
    executionFilterField.sendKeys('test\n');

    expect(filterList.count()).toEqual(1);
    expect(filterList.first().element(by.css('.execution-filters-element-text')).getText()).toContain('test');
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
