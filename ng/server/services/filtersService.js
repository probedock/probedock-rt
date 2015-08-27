var stateFilters = [];

module.exports = {
  setFilters: function(filters) {
    stateFilters = filters;
  },

  getFilters: function() {
    return stateFilters;
  },

  reset: function() {
    stateFilters = [];
  }
};
