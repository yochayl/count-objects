const { delimiter, uniqueKey, allObjects } = require("./constants");
const {
  add,
  addArray,
  count,
  table,
  intersectFilters,
} = require("./functions");

class CountObjects {
  constructor(objectArr, options) {
    this.union = addArray({}, objectArr, { ...options });
    this.options = { ...options };
    this.filters = [];
  }

  clone() {
    const clone = new CountObjects([]);
    clone.union = { ...this.union };
    clone.options = { ...this.options };
    clone.filters = [...this.filters];
    return clone;
  }

  add(objectArr) {
    this.union = Array.isArray(objectArr)
      ? addArray(this.union, objectArr, this.options)
      : add(this.union, objectArr, this.options);
    return this;
  }

  count() {
    return count(this.union, {
      filter: intersectFilters(this.union, this.filters).intersection,
    });
  }

  table() {
    return table(this.union, {
      filter: intersectFilters(this.union, this.filters).intersection,
    });
  }

  addFilter(filter) {
    this.filters = [...this.filters, filter];
    return this;
  }

  getFilters() {
    return JSON.parse(JSON.stringify(this.filters));
  }

  clearFilters() {
    this.filters = [];
    return this;
  }

  removeFilter(filterToRemove) {
    const filterToRemoveStr = JSON.stringify(filterToRemove);
    this.filters = this.filters.filter((filter) => {
      return JSON.stringify(filter) !== filterToRemoveStr;
    });
    return this;
  }

  filtersCount() {
    return intersectFilters(this.union, this.filters).countIntersections;
  }
}
module.exports = {
  CountObjects,
};
