'use strict';

describe('Service: FiltersService @probedock(contributor=laurent.prevost@probedock.io tag=server tag=service)', function () {
  var filtersService = require('../../../../server/services/filtersService');

  it ('should be possible to set, retrieve and then reset the filters', function() {
    filtersService.setFilters([{
      type: '*',
      text: 'a'
    }, {
      type: '*',
      text: 'b'
    }]);

    expect(filtersService.getFilters()).toEqual([{
      type: '*',
      text: 'a'
    }, {
      type: '*',
      text: 'b'
    }]);

    filtersService.reset();

    expect(filtersService.getFilters()).toEqual([]);
  });
});
