const {
  delimiter,
  uniqueKey: uniqueKeyName,
  prettyDelimiter,
} = require("../constants");
const { flatten, unflatten } = require("flat");

const intersection = (obj1, obj2) => {
  const intersection = {};
  const keys = Object.keys(obj1);
  for (const key of keys) {
    if (obj2[key]) {
      intersection[key] = true;
    }
  }
  return intersection;
};

const valueToString = (value) => {
  if (value === null) {
    return "null";
  }
  return value.toString();
};

const add = (union, obj, options = {}) => {
  const { uniqueKey = uniqueKeyName } = options || {};

  if (!Object.keys(obj).length) {
    return union;
  }
  if (uniqueKey === uniqueKeyName) {
    obj[uniqueKey] = Math.random().toString();
  }
  if (obj[uniqueKey] === undefined) {
    return union;
  }
  const flat = flatten(obj, { delimiter });
  const keys = Object.keys(flat);
  for (const key of keys) {
    if (key !== uniqueKey) {
      const val = flat[key] !== undefined && valueToString(flat[key]);
      if (val) {
        if (!union[key]) {
          union[key] = {};
        }
        if (!union[key][val]) {
          union[key][val] = {};
        }
        union[key][val][flat[uniqueKey]] = true;
      }
    }
  }
  return union;
};

const flatCount = (union, options = {}) => {
  const { filter } = options;
  const keys = Object.keys(union);
  const countUnion = {};
  for (const key of keys) {
    const values = Object.keys(union[key]);
    countUnion[key] = {};
    for (const value of values) {
      const uniqueKeysObj = union[key][value];
      const intersect = filter
        ? intersection(filter, uniqueKeysObj)
        : uniqueKeysObj;
      countUnion[key][value] = Object.keys(intersect).length;
    }
  }
  return countUnion;
};

const count = (union, options = {}) => {
  return unflatten(flatCount(union, options), { delimiter, object: true });
};

const addArray = (union = {}, objArr = [{}], options = {}) => {
  if (!Array.isArray(objArr)) {
    throw new Error("objArr is not an array");
  }
  const flats = objArr.map((obj) => flatten(obj, { delimiter }));
  return flats.reduce((acc, curr) => {
    return add(acc, curr, options);
  }, union);
};

const getUniqueKeys = (union, filter) => {
  const key = filter.slice(0, -1).join(delimiter);
  const value = filter.slice(-1)[0];

  if (union[key] !== undefined && union[key][value] !== undefined) {
    return union[key][value];
  }

  // the value might be also a key in case we don't filter on a leaf.
  const keyValue = filter.length > 1 ? `${key}${delimiter}${value}` : value;

  // look at all sub keys.
  const allKeys = Object.keys(union);
  const baseKeyRegex = new RegExp(`^${keyValue}.*`);
  const subKeys = allKeys.filter((key) => {
    return key.match(baseKeyRegex);
  });
  if (subKeys.length) {
    const uniqueKeys = {};
    for (const subKey of subKeys) {
      const values = Object.keys(union[subKey]);
      for (const value of values) {
        for (const id in union[subKey][value]) {
          uniqueKeys[id] = true;
        }
      }
    }
    return uniqueKeys;
  }
  throw new Error("illegal filter");
};

const intersectFilters = (union, filters, options) => {
  if (!filters.length) {
    return { intersection: null, countIntersections: null };
  }
  const uniqueKeys = filters.map((filter) => {
    return getUniqueKeys(union, filter);
  });
  // intersection of all the sets from left ot right
  const intersectionArr = [uniqueKeys[0]];
  const intersection = uniqueKeys.reduce((acc, curr) => {
    const keys = Object.keys(acc);
    const intersect = {};
    for (const key of keys) {
      if (curr[key] !== undefined) {
        intersect[key] = true;
      }
    }
    intersectionArr.push(intersect);
    return intersect;
  });
  const countIntersections = intersectionArr.map(
    (obj) => Object.keys(obj).length
  );
  return { intersection, countIntersections };
};

const table = (union, options = {}) => {
  const { pDelimiter = prettyDelimiter } = options;
  const countResult = flatCount(union, options);
  const tableObj = [];
  const keys = Object.keys(countResult);
  for (const key of keys) {
    const prettyKey = key.split(delimiter).join(pDelimiter);
    const values = Object.keys(countResult[key]);
    for (const value of values) {
      const count = countResult[key][value];
      tableObj.push({ key: prettyKey, value: value, count });
    }
  }

  // first sort by value then by key
  return tableObj;
};

module.exports = {
  flatCount,
  add,
  getUniqueKeys,
  addArray,
  count,
  table,
  intersectFilters,
};
