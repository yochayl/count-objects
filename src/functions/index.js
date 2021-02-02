const {
  delimiter,
  uniqueKey: uniqueKeyName,
  prettyDelimiter,
} = require("../constants");
const { flatten, unflatten } = require("flat");
const { v4: uuid } = require("uuid");

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
    obj[uniqueKey] = uuid();
  }
  if (obj[uniqueKey] === undefined) {
    throw new Error(`missing unique key`);
  }
  const newUnion = { ...union };
  const flat = flatten(obj, { delimiter });
  const keys = Object.keys(flat);
  for (const key of keys) {
    if (key !== uniqueKey) {
      const val = flat[key] !== undefined && valueToString(flat[key]);
      if (val) {
        if (!newUnion[key]) {
          newUnion[key] = {};
        }
        if (!newUnion[key][val]) {
          newUnion[key][val] = {};
        }
        newUnion[key][val][flat[uniqueKey]] = true;
      }
    }
  }
  return newUnion;
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
    let uniqueKeys = {};
    for (const subKey of subKeys) {
      const values = Object.keys(union[subKey]);
      for (const value of values) {
        uniqueKeys = { ...uniqueKeys, ...union[subKey][value] };
      }
    }
    return uniqueKeys;
  }
  throw new Error("illegal filter");
};

const intersectFilters = (union, filters) => {
  if (!filters.length) {
    return null;
  }
  const uniqueKeys = filters.map((filter) => {
    return getUniqueKeys(union, filter);
  });
  // intersection of all the sets from left ot right
  return uniqueKeys.reduce((acc, curr) => {
    const keys = Object.keys(acc);
    const intersection = {};
    for (const key of keys) {
      if (curr[key] !== undefined) {
        intersection[key] = true;
      }
    }
    return intersection;
  });
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
  return tableObj
    .sort((a, b) => {
      const test = a.value < b.value ? -1 : 1;
      return a.value === b.value ? 0 : test;
    })
    .sort((a, b) => {
      const test = a.key < b.key ? -1 : 1;
      return a.key === b.key ? 0 : test;
    });
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
