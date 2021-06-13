const { delimiter, uniqueKey, allObjects } = require("./constants");
const {
  add,
  addArray,
  count,
  table,
  intersectFilters,
  flatCount,
} = require("./functions");

class CountObjects {
  constructor(objectArr, options) {
    this.unions = [];
    const { uniqueKeys } = options || { uniqueKeys: [] };
    if (!Array.isArray(uniqueKeys)) {
      throw new Error("uniqueKeys is not an array");
    }
    this.uniqueKeys = [undefined, ...uniqueKeys];
    for (const uniqueKeyArr of this.uniqueKeys) {
      this.unions.push(addArray({}, objectArr, { uniqueKeyArr }));
    }
    this.options = { ...options };
    this.filters = [];
  }

  clone() {
    const clone = new CountObjects([]);
    clone.unions = [...this.unions];
    clone.options = { ...this.options };
    clone.filters = [...this.filters];
    clone.uniqueKeys = [...this.uniqueKeys];
    return clone;
  }

  add(objectArr) {
    for (const idx in this.unions) {
      this.unions[idx] = Array.isArray(objectArr)
        ? addArray(this.unions[idx], objectArr, this.uniqueKeys[idx])
        : add(this.unions[idx], objectArr, this.options[idx]);
    }
    return this;
  }

  count() {
    const counts = this.unions.map((union) => {
      return count(union, {
        ...this.options,
        filter: intersectFilters(union, this.filters).intersection,
      });
    });
    if (counts.length === 1) {
      return counts[0];
    } else {
      return counts;
    }
  }

  table() {
    const flatCountArr = this.unions.map((union) => {
      return flatCount(union, {
        ...this.options,
        filter: intersectFilters(union, this.filters).intersection,
      });
    });

    return table(flatCountArr, this.options);
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
    const filterCount = this.unions.map((union) => {
      return intersectFilters(union, this.filters).countIntersections;
    });
    if (filterCount.length === 1) {
      return filterCount[0];
    } else {
      return filterCount;
    }
  }
}
module.exports = {
  CountObjects,
};
