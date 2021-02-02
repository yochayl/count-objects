const { delimiter, uniqueKey, allObjects } = require("./constants");
const {
  flatCount,
  add,
  getUniqueKeys,
  addArray,
  count,
  table,
  intersectFilters,
} = require("./functions");

const getFilter = (filters) => {};

class ObjectsCounter {
  constructor(objectArr, options) {
    this.union = addArray({}, objectArr, {});
    this.options = { ...options };
    this.filters = [];
  }

  add(objectArr) {
    this.union = Array.isArray(objectArr)
      ? addArray(this.union, objectArr, this.options)
      : add(this.union, objectArr, this.options);
    return this;
  }

  count() {
    return count(this.union, {
      filter: intersectFilters(this.union, this.filters),
    });
  }

  table() {
    return table(this.union, {
      filter: intersectFilters(this.union, this.filters),
    });
  }

  addFilter(filter) {
    this.filters = [...this.filters, filter];
    return this;
  }
}
module.exports = {
  ObjectsCounter,
};
