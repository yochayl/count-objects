const { expect } = require("chai");
const { users } = require("./data");
const { flatten, unflatten } = require("flat");

const {
  flatCount,
  add,
  count,
  getUniqueKeys,
  addArray,
  table,
  intersectFilters,
} = require("../src/functions/index");
const { delimiter, prettyDelimiter } = require("../src/constants");
const { CountObjects } = require("../src");

describe("add", () => {
  it("returns union for empty obj", (done) => {
    const union = { key: "value" };
    const result = add(union, {});
    expect(result).to.be.equals(union);
    return done();
  });
  it("generates union from an object", (done) => {
    const obj = { id: "id1", key: "value", key2: { key3: "val3" } };
    const expectedUnion = {
      key: { value: { id1: true } },
      [`key2${delimiter}key3`]: { val3: { id1: true } },
    };
    const result = add({}, obj, { uniqueKey: "id" });
    expect(result).to.be.eql(expectedUnion);
    return done();
  });
  it("raises an error for missing id", (done) => {
    const id = "dummy";
    try {
      add({}, { a: "b" }, { uniqueKey: "id" });
      throw new Error("no error");
    } catch (error) {
      expect(error.message).to.be.equals(`missing unique key`);
      return done();
    }
  });

  it("adds values with unique keys", (done) => {
    const key = "key";
    const value = "value";
    const obj1 = { [key]: value, id: 0 };
    const obj2 = { [key]: value, id: 1 };
    const union = [obj1, obj2].reduce((acc, curr) => {
      return add(acc, curr, { uniqueKey: "id" });
    }, {});
    expect(Object.keys(union[key][value]).length).to.be.equals(2);
    return done();
  });
  it("adds values without unique keys", (done) => {
    const key = "key";
    const value = "value";
    const obj1 = { [key]: value, id: 0 };
    const obj2 = { [key]: value, id: 1 };
    const union = [obj1, obj2].reduce((acc, curr) => {
      return add(acc, curr);
    }, {});
    expect(Object.keys(union[key][value]).length).to.be.equals(2);
    return done();
  });

  it("doesn't count twice unique key", (done) => {
    const key = "key";
    const value = "value";
    const obj1 = { [key]: value, id: "not_unique" };
    const obj2 = { [key]: value, id: "not_unique" };
    const union = [obj1, obj2].reduce((acc, curr) => {
      return add(acc, curr, { uniqueKey: "id" });
    }, {});
    expect(Object.keys(union[key][value]).length).to.be.equals(1);
    return done();
  });

  it("adds 2 objects correctly", (done) => {
    const obj0 = {
      id: 0,
      k1: "v1",
      kt: {
        k3: false,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
        k6: "twoIds",
      },
    };
    const obj1 = {
      id: 1,
      k1: "v2",
      kt: {
        k3: true,
        k4: 0,
        k6: "twoIds",
      },
      "a.b": { ".c.d": "." },
    };
    const expectedUnion = {
      k1: { v1: { 0: true }, v2: { 1: true } },
      [`kt${delimiter}k3`]: { false: { 0: true }, true: { 1: true } },
      [`kt${delimiter}k4`]: { 0: { 0: true, 1: true } },
      [`kt${delimiter}k5${delimiter}0`]: { a: { 0: true } },
      [`kt${delimiter}k5${delimiter}1`]: { b: { 0: true } },
      [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: { 0: true } },
      [`kt${delimiter}k6`]: { twoIds: { 0: true, 1: true } },
      [`a.b${delimiter}.c.d`]: { ".": { 1: true } },
    };

    const union0 = {};
    const union1 = add(union0, obj0, { uniqueKey: "id" });
    const union = add(union1, obj1, { uniqueKey: "id" });
    expect(union).to.be.eql(expectedUnion);

    return done();
  });
});

describe("flatCount", () => {
  it("counts every value", (done) => {
    const union = {
      k1: { v1: { 0: true }, v2: { 1: true } },
      [`kt${delimiter}k3`]: { false: { 0: true }, true: { 1: true } },
      [`kt${delimiter}k4`]: { 0: { 0: true, 1: true } },
      [`kt${delimiter}k5${delimiter}0`]: { a: { 0: true } },
      [`kt${delimiter}k5${delimiter}1`]: { b: { 0: true } },
      [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: { 0: true } },
      [`kt${delimiter}k6`]: { twoIds: { 0: true, 1: true } },
      [`a.b${delimiter}.c.d`]: { ".": { 1: true } },
    };
    const expectedResult = {
      k1: { v1: 1, v2: 1 },
      [`kt${delimiter}k3`]: { false: 1, true: 1 },
      [`kt${delimiter}k4`]: { 0: 2 },
      [`kt${delimiter}k5${delimiter}0`]: { a: 1 },
      [`kt${delimiter}k5${delimiter}1`]: { b: 1 },
      [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: 1 },
      [`kt${delimiter}k6`]: { twoIds: 2 },
      [`a.b${delimiter}.c.d`]: { ".": 1 },
    };

    const result = flatCount(union);
    expect(result).to.be.eql(expectedResult);
    return done();
  });
  it("counts with filter", (done) => {
    const union = {
      k1: { v1: { 0: true }, v2: { 1: true } },
      [`kt${delimiter}k3`]: { false: { 0: true }, true: { 1: true } },
      [`kt${delimiter}k4`]: { 0: { 0: true, 1: true } },
      [`kt${delimiter}k5${delimiter}0`]: { a: { 0: true } },
      [`kt${delimiter}k5${delimiter}1`]: { b: { 0: true } },
      [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: { 0: true } },
      [`kt${delimiter}k6`]: { twoIds: { 0: true, 1: true } },
      [`a.b${delimiter}.c.d`]: { ".": { 1: true } },
    };
    const filter = { 1: true };
    const expectedResult = {
      k1: { v1: 0, v2: 1 },
      [`kt${delimiter}k3`]: { false: 0, true: 1 },
      [`kt${delimiter}k4`]: { 0: 1 },
      [`kt${delimiter}k5${delimiter}0`]: { a: 0 },
      [`kt${delimiter}k5${delimiter}1`]: { b: 0 },
      [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: 0 },
      [`kt${delimiter}k6`]: { twoIds: 1 },
      [`a.b${delimiter}.c.d`]: { ".": 1 },
    };
    const result = flatCount(union, { filter });
    expect(result).to.be.eql(expectedResult);

    return done();
  });
});

describe("count", () => {
  it("counts objects per value", (done) => {
    const obj0 = {
      k1: "v1",
      k2: {
        k3: false,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
      },
    };
    const obj1 = {
      k1: "v1",
      k2: {
        k3: true,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
        k6: 12,
      },
    };
    const expectedResult = {
      k1: { v1: 2 },
      k2: {
        k3: { false: 1, true: 1 },
        k4: { 0: 2 },
        k5: { 0: { a: 2 }, 1: { b: 2 }, 2: { k6: { d: 2 } } },
        k6: { 12: 1 },
      },
    };
    const union = addArray({}, [obj0, obj1]);
    const result = count(union);
    expect(result).to.be.eql(expectedResult);
    return done();
  });

  it("counts unique key per value", (done) => {
    const obj0 = {
      uniqueKey: "key1",
      k1: "v1",
      k2: {
        k3: false,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
      },
    };
    const obj1 = {
      uniqueKey: "key2",
      k1: "v1",
      k2: {
        k3: true,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
        k6: 12,
      },
    };
    const expectedResult = {
      k1: { v1: 2 },
      k2: {
        k3: { false: 1, true: 1 },
        k4: { 0: 2 },
        k5: { 0: { a: 2 }, 1: { b: 2 }, 2: { k6: { d: 2 } } },
        k6: { 12: 1 },
      },
    };
    const union = addArray({}, [obj0, obj1], { uniqueKey: "uniqueKey" });
    const result = count(union);
    expect(result).to.be.eql(expectedResult);
    return done();
  });

  it("counts with filter", (done) => {
    const obj0 = {
      uniqueKey: "key1",
      k1: "v1",
      k2: {
        k3: false,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
      },
    };
    const obj1 = {
      uniqueKey: "key2",
      k1: "v1",
      k2: {
        k3: true,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
        k6: 12,
      },
    };
    const expectedResult = {
      k1: { v1: 1 },
      k2: {
        k3: { false: 1, true: 0 },
        k4: { 0: 1 },
        k5: { 0: { a: 1 }, 1: { b: 1 }, 2: { k6: { d: 1 } } },
        k6: { 12: 0 },
      },
    };
    const filter = { key1: true };
    const union = addArray({}, [obj0, obj1], { uniqueKey: "uniqueKey" });
    const result = count(union, { filter });
    expect(result).to.be.eql(expectedResult);
    return done();
  });

  it("does not counts none-unique keys twice", (done) => {
    const obj0 = {
      uniqueKey: "key1",
      k1: "v1",
      k2: {
        k3: false,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
      },
    };
    const obj1 = {
      uniqueKey: "key1",
      k1: "v1",
      k2: {
        k3: true,
        k4: 0,
        k5: ["a", "b", { k6: "d" }],
        k6: 12,
      },
    };
    const expectedResult = {
      k1: { v1: 1 },
      k2: {
        k3: { false: 1, true: 1 },
        k4: { 0: 1 },
        k5: { 0: { a: 1 }, 1: { b: 1 }, 2: { k6: { d: 1 } } },
        k6: { 12: 1 },
      },
    };
    const union = addArray({}, [obj0, obj1], { uniqueKey: "uniqueKey" });
    const result = count(union);
    expect(result).to.be.eql(expectedResult);
    return done();
  });
});

describe("getUniqueKeys", () => {
  it("finds results by key and value", (done) => {
    const union = {
      [`k1${delimiter}k2`]: {
        false: { key1: true },
        true: { key2: true, key3: true },
      },
    };
    const filter = ["k1", "k2", true];
    const result = getUniqueKeys(union, filter);

    const resultSet = new Set(Object.keys(result));
    expect(resultSet.size).to.be.equals(2);
    expect(resultSet.has("key2")).to.be.true;
    expect(resultSet.has("key3")).to.be.true;

    return done();
  });
  it("finds results by key", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
        true: { u2: true, u3: true },
      },
      [`k1${delimiter}k2${delimiter}k4`]: {
        false: { u4: true },
        true: { u5: true, u6: true },
      },
    };
    const filter = ["k1", "k2", "k3"];
    const result = getUniqueKeys(union, filter);

    const resultSet = new Set(Object.keys(result));
    expect(resultSet.size).to.be.equals(3);
    expect(resultSet.has("u1")).to.be.true;
    expect(resultSet.has("u2")).to.be.true;
    expect(resultSet.has("u3")).to.be.true;

    return done();
  });

  it("finds results by key with sub keys", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
        true: { u2: true, u3: true },
      },
      [`k1${delimiter}k2${delimiter}k4`]: {
        false: { u4: true },
        true: { u5: true, u6: true },
      },
    };
    const filter = ["k1", "k2"];
    const result = getUniqueKeys(union, filter);
    const resultK1 = getUniqueKeys(union, ["k1"]);

    const resultSet = new Set(Object.keys(result));
    expect(resultSet.size).to.be.equals(6);
    expect(resultSet.has("u1")).to.be.true;
    expect(resultSet.has("u2")).to.be.true;
    expect(resultSet.has("u3")).to.be.true;
    expect(resultSet.has("u4")).to.be.true;
    expect(resultSet.has("u5")).to.be.true;
    expect(resultSet.has("u6")).to.be.true;
    expect(result).to.be.eql(resultK1);
    return done();
  });

  it("throws an error for not existing key", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
        true: { u2: true, u3: true },
      },
      [`k1${delimiter}k2${delimiter}k4`]: {
        false: { u4: true },
        true: { u5: true, u6: true },
      },
    };
    const filter = ["k1", "k4"];
    try {
      const result = getUniqueKeys(union, filter);
      throw new Error("this error should not be thrown");
    } catch (error) {
      expect(error.message).to.be.equal("illegal filter");
      return done();
    }
  });

  it("throws an error for not existing value", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
        true: { u2: true, u3: true },
      },
      [`k1${delimiter}k2${delimiter}k4`]: {
        false: { u4: true },
        true: { u5: true, u6: true },
      },
    };
    const filter = ["k3"];
    try {
      const result = getUniqueKeys(union, filter);
      throw new Error("this error should not be thrown");
    } catch (error) {
      expect(error.message).to.be.equal("illegal filter");
      return done();
    }
  });
});

describe("table", () => {
  it("create table ordered by key", (done) => {
    const obj1 = {
      key: { A: 1 },
    };
    const obj2 = {
      key: { B: 2 },
    };
    const union = addArray({}, [obj2, obj1]);

    const expectedTable = [
      { key: `key${prettyDelimiter}A`, value: "1", count: 1 },
      { key: `key${prettyDelimiter}B`, value: "2", count: 1 },
    ];
    const result = table(union);
    expect(result).to.be.eql(expectedTable);
    return done();
  });

  it("create table ordered by value", (done) => {
    const obj1 = {
      key: { A: 2 },
    };
    const obj2 = {
      key: { A: 1 },
    };

    const union = addArray({}, [obj1, obj2]);
    const count = flatCount(union);
    const expectedTable = [
      { key: `key${prettyDelimiter}A`, value: "1", count: 1 },
      { key: `key${prettyDelimiter}A`, value: "2", count: 1 },
    ];
    const result = table(union);
    expect(result).to.be.eql(expectedTable);
    return done();
  });

  it("create table ordered by kay and value", (done) => {
    const obj1 = {
      key: { A: 2 },
    };
    const obj2 = {
      key: { A: 2 },
    };
    const obj3 = {
      key: { B: 1 },
    };
    const union = addArray({}, [obj3, obj1, obj2]);
    const expectedTable = [
      { key: `key${prettyDelimiter}A`, value: "2", count: 2 },
      { key: `key${prettyDelimiter}B`, value: "1", count: 1 },
    ];
    const result = table(union);
    expect(result).to.be.eql(expectedTable);
    return done();
  });
});

describe("intersectFilters", () => {
  it("returns null if there are no filters", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
      },
    };
    const uniqueKeys = intersectFilters(union, []);
    expect(uniqueKeys).to.be.null;
    return done();
  });

  it("intersects one filter", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
        true: { u2: true, u3: true },
      },
      [`k1${delimiter}k2${delimiter}k4`]: {
        false: { u3: true },
        true: { u4: true, u5: true },
      },
    };
    const filters = [["k1", "k2", "k3"]];
    const expectedResult = {
      u1: true,
      u2: true,
      u3: true,
    };

    const uniqueKeys = intersectFilters(union, filters);
    expect(uniqueKeys).to.be.eql(expectedResult);

    return done();
  });

  it("intersects two filters", (done) => {
    const union = {
      [`k1${delimiter}k2${delimiter}k3`]: {
        false: { u1: true },
        true: { u2: true, u3: true },
      },
      [`k1${delimiter}k2${delimiter}k4`]: {
        false: { u3: true },
        true: { u4: true, u5: true },
      },
    };
    const filters = [
      ["k1", "k2"],
      ["k1", "k2", "k4"],
    ];
    const expectedResult = {
      u3: true,
      u4: true,
      u5: true,
    };

    const uniqueKeys = intersectFilters(union, filters);
    expect(uniqueKeys).to.be.eql(expectedResult);

    return done();
  });
});
describe("CountObjects", () => {
  describe("add", () => {
    it("adds a single object", (done) => {
      const co = new CountObjects();
      co.add({ key1: "value1" });
      const expectedResult = { key1: { value1: 1 } };
      const result = co.count();
      expect(result).to.be.eql(expectedResult);
      return done();
    });
    it("adds an array of objects", (done) => {
      const co = new CountObjects();
      co.add([{ key1: "value1" }, { key1: "value1" }]);
      const expectedResult = { key1: { value1: 2 } };
      const result = co.count();
      expect(result).to.be.eql(expectedResult);
      return done();
    });
  });
  describe("table", () => {
    it("generates a table", (done) => {
      const co = new CountObjects([
        { key1: "value1" },
        { key1: "value1" },
        { key1: "value2" },
      ]);
      const expectedResult = [
        { key: "key1", value: "value1", count: 2 },
        { key: "key1", value: "value2", count: 1 },
      ];
      const table = co.table();
      expect(table).to.be.eql(expectedResult);
      return done();
    });
  });

  describe("addFilter", () => {
    it("adds one value filter", (done) => {
      const objects = [
        {
          color: "blue",
          age: 100,
          size: {
            length: 10,
            width: 100,
          },
        },
        {
          color: "green",
          age: 100,
          size: {
            length: 10,
            width: 400,
          },
        },
        {
          color: "red",
          age: 100,
          size: {
            length: 20,
            width: 200,
          },
        },
      ];
      const co = new CountObjects(objects);
      const filter = ["size", "length", "10"];
      co.addFilter(filter);
      const expectedTable = [
        { key: "age", value: "100", count: 2 },
        { key: "color", value: "blue", count: 1 },
        { key: "color", value: "green", count: 1 },
        { key: "color", value: "red", count: 0 },
        { key: "size.length", value: "10", count: 2 },
        { key: "size.length", value: "20", count: 0 },
        { key: "size.width", value: "100", count: 1 },
        { key: "size.width", value: "200", count: 0 },
        { key: "size.width", value: "400", count: 1 },
      ];
      const expectedCount = {
        color: { blue: 1, green: 1, red: 0 },
        age: { 100: 2 },
        size: {
          length: { 10: 2, 20: 0 },
          width: { 100: 1, 200: 0, 400: 1 },
        },
      };
      expect(co.table()).to.be.eql(expectedTable);
      expect(co.count()).to.be.eql(expectedCount);
      return done();
    });
  });

  describe("getFilters", () => {
    const co = new CountObjects();
    it("returns an empty array when there is no filter", (done) => {
      expect(co.getFilters()).to.be.eql([]);
      expect(co.getFilters()).not.to.be.equals(co.filters);
      return done();
    });

    it("returns the current filters array", (done) => {
      co.add([{ a: { b: true } }, { a: { b: false } }]);
      const filter = ["a", "b", true];
      co.addFilter(filter);
      expect(co.getFilters()).to.be.eql([filter]);
      expect(co.getFilters()).not.to.be.equals(co.filters);
      return done();
    });
  });
});