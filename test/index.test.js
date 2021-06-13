const { expect } = require("chai");

const {
  flatCount,
  add,
  count,
  getUniqueKeys,
  addArray,
  table,
  intersectFilters,
  safeGetValue,
} = require("../src/functions/index");
const { delimiter, prettyDelimiter } = require("../src/constants");
const { CountObjects } = require("../src");
const flatten = require("flat");

describe("add", () => {
  it("returns union for empty object", (done) => {
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
  it("returns union for missing unique key", (done) => {
    const id = "dummy";
    const union = add({}, { [id]: "1", a: "b" }, { uniqueKey: id });
    const union2 = add(union, { a: "b" }, { uniqueKey: id });
    expect(union).to.be.equals(union2);
    return done();
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

describe("safeGetValue", () => {
  it("finds the correct value", (done) => {
    const obj = { a: { b: { c: { d: "e" } } } };
    const keyArr = ["a", "b", "c", "d"];
    const value = safeGetValue(obj, keyArr);
    expect(value).to.be.equals("e");
    return done();
  });
  it("returns undefined for missing value", (done) => {
    const obj = { a: { b: { c: { d: "e" } } } };
    const keyArr = ["a", "b", "e", "d"];
    const value = safeGetValue(obj, keyArr);
    expect(value).to.be.undefined;
    return done();
  });
  it("returns undefined if the value is an object", (done) => {
    const obj = { a: { b: { c: { d: "e" } } } };
    const keyArr = ["a", "b", "c"];
    const value = safeGetValue(obj, keyArr);
    expect(value).to.be.undefined;
    return done();
  });

  it("returns a string", (done) => {
    const obj = { a: { b: { c: { d: 0 } } } };
    const keyArr = ["a", "b", "c", "d"];
    const value = safeGetValue(obj, keyArr);
    expect(value).to.be.equals("0");
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
    // const expectedResult = {
    //   k1: { v1: 1, v2: 1 },
    //   [`kt${delimiter}k3`]: { false: 1, true: 1 },
    //   [`kt${delimiter}k4`]: { 0: 2 },
    //   [`kt${delimiter}k5${delimiter}0`]: { a: 1 },
    //   [`kt${delimiter}k5${delimiter}1`]: { b: 1 },
    //   [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: 1 },
    //   [`kt${delimiter}k6`]: { twoIds: 2 },
    //   [`a.b${delimiter}.c.d`]: { ".": 1 },
    // };

    const expectedResult = flatten(
      {
        k1: { v1: 1, v2: 1 },
        [`kt${delimiter}k3`]: { false: 1, true: 1 },
        [`kt${delimiter}k4`]: { 0: 2 },
        [`kt${delimiter}k5${delimiter}0`]: { a: 1 },
        [`kt${delimiter}k5${delimiter}1`]: { b: 1 },
        [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: 1 },
        [`kt${delimiter}k6`]: { twoIds: 2 },
        [`a.b${delimiter}.c.d`]: { ".": 1 },
      },
      { delimiter }
    );

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
    const expectedResult = flatten(
      {
        k1: { v1: 0, v2: 1 },
        [`kt${delimiter}k3`]: { false: 0, true: 1 },
        [`kt${delimiter}k4`]: { 0: 1 },
        [`kt${delimiter}k5${delimiter}0`]: { a: 0 },
        [`kt${delimiter}k5${delimiter}1`]: { b: 0 },
        [`kt${delimiter}k5${delimiter}2${delimiter}k6`]: { d: 0 },
        [`kt${delimiter}k6`]: { twoIds: 1 },
        [`a.b${delimiter}.c.d`]: { ".": 1 },
      },
      { delimiter }
    );
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
  it("creates table", (done) => {
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
    const flatUnion = flatCount(union);
    const result = table([flatUnion])
      .sort((a, b) => {
        const test = a.value < b.value ? -1 : 1;
        return a.value === b.value ? 0 : test;
      })
      .sort((a, b) => {
        const test = a.key < b.key ? -1 : 1;
        return a.key === b.key ? 0 : test;
      });

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
    const { intersection, countIntersections } = intersectFilters(union, []);
    expect(intersection).to.be.null;
    expect(countIntersections).to.be.null;
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

    const { intersection, countIntersections } = intersectFilters(
      union,
      filters
    );
    expect(intersection).to.be.eql(expectedResult);
    expect(countIntersections).to.be.eql([3]);

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

    const { intersection, countIntersections } = intersectFilters(
      union,
      filters
    );
    expect(intersection).to.be.eql(expectedResult);
    expect(countIntersections).to.be.eql([5, 3]);

    return done();
  });

  it("intersects multiple filters", (done) => {
    const objects = [
      { index: 0, a: 1 },
      { index: 1, a: 1, b: 2 },
      { index: 2, a: 1, b: 2, c: 3 },
      { index: 3, a: 1, b: 2, c: 3, d: 4 },
      { index: 4, a: 1, b: 2, c: 3, d: 4, e: 5 },
    ];
    const union = addArray({}, objects, { uniqueKey: "index" });
    const filters = [
      ["a", "1"],
      ["b", "2"],
      ["c", "3"],
      ["d", "4"],
      ["e", "5"],
    ];

    const { intersection, countIntersections } = intersectFilters(
      union,
      filters
    );

    expect(intersection).to.be.eql({ 4: true });
    expect(countIntersections).to.be.eql([5, 4, 3, 2, 1]);
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

    it("generates a table with counting unique keys", (done) => {
      const flowers = [
        {
          flowers: {
            color: "black",
            type: "Tulip",
            height: 12,
          },
        },
        {
          flowers: {
            color: "black",
            type: "Tulip",
            height: 10,
          },
        },
        {
          flowers: {
            color: "white",
            type: "Tulip",
            height: 10,
          },
        },
        {
          flowers: {
            type: "Tulip",
            height: 13,
          },
        },
      ];

      const co = new CountObjects(flowers, {
        uniqueKeys: [
          ["flowers", "color"],
          ["flowers", "height"],
        ],
      });

      const table = co.table();
      const expectedResult = [
        {
          key: "flowers.color",
          value: "black",
          count: 2,
          "unique-key-1": 1,
          "unique-key-2": 2,
        },
        {
          key: "flowers.color",
          value: "white",
          count: 1,
          "unique-key-1": 1,
          "unique-key-2": 1,
        },
        {
          key: "flowers.type",
          value: "Tulip",
          count: 4,
          "unique-key-1": 2,
          "unique-key-2": 3,
        },
        {
          key: "flowers.height",
          value: "10",
          count: 2,
          "unique-key-1": 2,
          "unique-key-2": 1,
        },
        {
          key: "flowers.height",
          value: "12",
          count: 1,
          "unique-key-1": 1,
          "unique-key-2": 1,
        },
        {
          key: "flowers.height",
          value: "13",
          count: 1,
          "unique-key-1": 0,
          "unique-key-2": 1,
        },
      ];
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
      const table = co
        .table()
        .sort((a, b) => {
          const test = a.value < b.value ? -1 : 1;
          return a.value === b.value ? 0 : test;
        })
        .sort((a, b) => {
          const test = a.key < b.key ? -1 : 1;
          return a.key === b.key ? 0 : test;
        });
      expect(table).to.be.eql(expectedTable);
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

  describe("clearFilters", () => {
    it("clears the filters", () => {
      const co = new CountObjects();
      const filter = ["a", "b", true];
      co.addFilter(filter);
      co.clearFilters();
      expect(co.filters).to.be.eql([]);
    });
  });

  describe("removeFilter", () => {
    it("removes a filter if exists", () => {
      const co = new CountObjects();
      const filter1 = ["a", "b", true];
      const filter2 = ["c", "d", false];
      const filter3 = ["f", "f", true];
      co.addFilter(filter1);
      co.addFilter(filter2);
      co.addFilter(filter3);
      co.removeFilter(filter2);
      expect(co.filters).to.be.eql([filter1, filter3]);
    });
  });
});
