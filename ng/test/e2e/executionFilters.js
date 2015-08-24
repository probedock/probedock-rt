'use strict';

var
  _ = require('underscore'),
  socketIO = require('socket.io-client'),
  config = require('../../config.js');

describe('Execution filters: @probedock(contributor=laurent.prevost@probedock.io tag=executionFilters)', function () {
  var executionFilterField = element(by.model('filterText'));
  var addButton = element(by.css('.execution-filters-add'));
  var clearButton = element(by.css('.execution-filters-clear-all'));
  var filterList = element.all(by.css('.execution-filters-element'));

  beforeEach(function () {
    browser.get('/main');
  });

  it('the execution filters component should have a default state where buttons are deactivated', function () {
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

  it('should not be possible to add a filter already present', function() {
    executionFilterField.sendKeys('test\n');
    expect(filterList.count()).toEqual(1);
    expect(element(by.css('.execution-filters-error')).isDisplayed()).toBeFalsy();

    executionFilterField.sendKeys('test\n');
    expect(filterList.count()).toEqual(1);
    expect(addButton.isEnabled()).toBeFalsy();
    expect(element(by.css('.execution-filters-error')).isDisplayed()).toBeTruthy();
  });

  it('the different filter types are represented with different colors and icons', function() {
    executionFilterField.sendKeys('test\n');
    expect(filterList.last()).toHaveClass('execution-filters-element');

    _.each([ 'key', 'fp', 'name', 'ticket', 'tag'], function(type) {
      executionFilterField.sendKeys(type + ':test\n');
      expect(filterList.last()).toHaveClass('execution-filters-element');
      expect(filterList.last()).toHaveClass('execution-filters-element-' + type);
    });

    executionFilterField.sendKeys('*:test\n');
    expect(filterList.last()).toHaveClass('execution-filters-element');
  });

  it('should be possible to remove a filter from itself', function() {
    executionFilterField.sendKeys('test\n');
    expect(clearButton.isEnabled()).toBeTruthy();

    var filter = filterList.last();

    filter.element(by.css('.execution-filters-element-close')).click();

    expect(filterList.count()).toEqual(0);
    expect(clearButton.isEnabled()).toBeFalsy();
  });

  it('the input field remains filled even if the clear button is clicked', function() {
    executionFilterField.sendKeys('test\n');
    executionFilterField.sendKeys('test2');
    clearButton.click();

    expect(executionFilterField.getAttribute('value')).toEqual('test2');
  });

  it('should be possible to add a duplicated filter once the filter present in the list was removed', function() {
    executionFilterField.sendKeys('test\n');
    executionFilterField.sendKeys('test');

    expect(addButton.isEnabled()).toBeFalsy();
    expect(element(by.css('.execution-filters-error')).isDisplayed()).toBeTruthy();

    clearButton.click();

    expect(addButton.isEnabled()).toBeTruthy();
    expect(element(by.css('.execution-filters-error')).isDisplayed()).toBeFalsy();

    addButton.click();
    executionFilterField.sendKeys('test');

    expect(addButton.isEnabled()).toBeFalsy();
    expect(element(by.css('.execution-filters-error')).isDisplayed()).toBeTruthy();

    filterList.first().element(by.css('.execution-filters-element-close')).click();

    expect(addButton.isEnabled()).toBeTruthy();
    expect(element(by.css('.execution-filters-error')).isDisplayed()).toBeFalsy();
  });

  it('configuring filters should send them through socket.io', function(done) {
    console.log('http://' + config.host + ':' + config.port);

    var socket = socketIO('http://' + config.host + ':' + config.port);

    socket.once('test:filters:set', function (data) {
      expect(data).toEqual({
        filters: [{
          type: '*',
          text: 'test'
        }]
      });

      socket.once('test:filters:set', function(data) {
        expect(data).toEqual({
          filters: [{
            type: '*',
            text: 'test'
          }, {
            type: '*',
            text: 'test2'
          }]
        });

        done();
      });

      executionFilterField.sendKeys('test2\n');
    });

    executionFilterField.sendKeys('test\n');
  });

  it('removing filters should reset them through socket.io', function(done) {
    socketIO('http://' + config.host + ':' + config.port).once('test:filters:reset', function() {
      done();
    });

    executionFilterField.sendKeys('test\n');
    clearButton.click();
  });
});
