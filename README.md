# count-objects

Counts objects for each value

## demo

[Earthquakes API](https://yochayl.github.io/count-objects-demo/)

## install

```console
npm install count-objects
```

## usage

### constructor

```javascript
const { CountObjects } = require("count-objects");

const objects = [
  {
    fruit: {
      olive: "Arbequina",
      apple: "Lady Alice",
      orange: "Valencia",
    },
  },
  {
    fruit: {
      olive: "Kalamata",
      apple: "Lady Alice",
    },
  },
];

const co = new CountObjects(objects);
```

### count

```javascript
//  the count result in an object format:
const countObject = co.count();
console.log((countObject);
// {
//   fruit: {
//     olive: { Arbequina: 1, Kalamata: 1 },
//     apple: { 'Lady Alice': 2 },
//     orange: { Valencia: 1 }
//   }
// }
```

### table

```javascript
// the same data can be presented as a table:
const countTable = co.table();
console.table(countTable);
// ┌─────────┬────────────────┬──────────────┬───────┐
// │ (index) │      key       │    value     │ count │
// ├─────────┼────────────────┼──────────────┼───────┤
// │    0    │ 'fruit.apple'  │ 'Lady Alice' │   2   │
// │    1    │ 'fruit.olive'  │ 'Arbequina'  │   1   │
// │    2    │ 'fruit.olive'  │  'Kalamata'  │   1   │
// │    3    │ 'fruit.orange' │  'Valencia'  │   1   │
// └─────────┴────────────────┴──────────────┴───────┘
```

### add

```javascript
// add more values:
co.add([
  {
    fruit: {
      orange: "Valencia",
      apple: "Lady Alice",
    },
  },
]);
console.table(co.table());
// ┌─────────┬────────────────┬──────────────┬───────┐
// │ (index) │      key       │    value     │ count │
// ├─────────┼────────────────┼──────────────┼───────┤
// │    0    │ 'fruit.apple'  │ 'Lady Alice' │   3   │
// │    1    │ 'fruit.olive'  │ 'Arbequina'  │   1   │
// │    2    │ 'fruit.olive'  │  'Kalamata'  │   1   │
// │    3    │ 'fruit.orange' │  'Valencia'  │   2   │
// └─────────┴────────────────┴──────────────┴───────┘
```

### addFilter

```javascript
// add a filter to count only objects with specific value
// the filter format is an array, like in this example:

// count only objects that have
// key:   'fruit.orange'
// value: 'Valencia'
const valenciaFilter = ["fruit", "orange", "Valencia"];
co.addFilter(valenciaFilter);
console.table(co.table());
// ┌─────────┬────────────────┬──────────────┬───────┐
// │ (index) │      key       │    value     │ count │
// ├─────────┼────────────────┼──────────────┼───────┤
// │    0    │ 'fruit.apple'  │ 'Lady Alice' │   2   │
// │    1    │ 'fruit.olive'  │ 'Arbequina'  │   1   │
// │    2    │ 'fruit.olive'  │  'Kalamata'  │   0   │
// │    3    │ 'fruit.orange' │  'Valencia'  │   2   │
// └─────────┴────────────────┴──────────────┴───────┘

// add another filter, now for "Arbequina" olive:
co.addFilter(["fruit", "olive", "Arbequina"]);
console.table(co.table());
// ┌─────────┬────────────────┬──────────────┬───────┐
// │ (index) │      key       │    value     │ count │
// ├─────────┼────────────────┼──────────────┼───────┤
// │    0    │ 'fruit.apple'  │ 'Lady Alice' │   1   │
// │    1    │ 'fruit.olive'  │ 'Arbequina'  │   1   │
// │    2    │ 'fruit.olive'  │  'Kalamata'  │   0   │
// │    3    │ 'fruit.orange' │  'Valencia'  │   1   │
// └─────────┴────────────────┴──────────────┴───────┘
```

### getFilters

```javascript
// see the current filters:
console.log(co.getFilters());
// [
//   [ 'fruit', 'orange', 'Valencia' ],
//   [ 'fruit', 'olive', 'Arbequina' ]
// ]
```

### clearFilters

```javascript
// removes all filters
co.clearFilters();
console.log(co.getFilters());
// []
```

### removeFilter

```javascript
// removes a specific filter if it exists:
co.addFilter(["a", 1]);
co.addFilter(["b", 2]);
co.addFilter(["c", 3]);
console.log(co.getFilters());
// [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]
co.removeFilter(["b", 2]);
console.log(co.getFilters());
// [ [ 'a', 1 ], [ 'c', 3 ] ]
```

### filtersCount

```javascript
// returns how many objects were counted after implementing each filter:
const objects = [
  { a: 1, b: 2 },
  { a: 1, b: 2, c: 3 },
  { a: 1, b: 2, c: 3, d: 4 },
  { a: 1, b: 2, c: 3, d: 4, e: 5 },
  { a: 1 },
];
const co = new CountObjects(objects);
co.addFilter(["a", "1"]); // 5 objects
co.addFilter(["b", "2"]); // 4 objects
co.addFilter(["c", "3"]); // 3 objects
co.addFilter(["d", "4"]); // 2 objects
co.addFilter(["e", "5"]); // 1 object
console.log(co.filtersCount());
// [ 5, 4, 3, 2, 1 ]

co.clearFilters();
co.addFilter(["b", "2"]); // 4 objects
co.addFilter(["d", "4"]); // 2 objects
co.addFilter(["c", "3"]); // 2 objects
co.addFilter(["e", "5"]); // 1 object
co.addFilter(["a", "1"]); // 1 object
console.log(co.filtersCount());
/// [ 4, 2, 2, 1, 1 ]
```

### count unique values

```javascript
// in this example we count also unique color (unique-key-1)
// and unique height (unique-key-2):

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

const countUniqueValues = new CountObjects(flowers, {
  uniqueKeys: [
    ["flowers", "color"], // the key to the unique value is given in an array format
    ["flowers", "height"],
  ],
});

console.table(countUniqueValues.table());
// ┌─────────┬──────────────────┬─────────┬───────┬──────────────┬──────────────┐
// │ (index) │       key        │  value  │ count │ unique-key-1 │ unique-key-2 │
// ├─────────┼──────────────────┼─────────┼───────┼──────────────┼──────────────┤
// │    0    │ 'flowers.color'  │ 'black' │   2   │      1       │      2       │
// │    1    │ 'flowers.color'  │ 'white' │   1   │      1       │      1       │
// │    2    │ 'flowers.type'   │ 'Tulip' │   4   │      2       │      3       │
// │    3    │ 'flowers.height' │  '10'   │   2   │      2       │      1       │
// │    4    │ 'flowers.height' │  '12'   │   1   │      1       │      1       │
// │    5    │ 'flowers.height' │  '13'   │   1   │      0       │      1       │
// └─────────┴──────────────────┴─────────┴───────┴──────────────┴──────────────┘
```

### clone

```javascript
// creates a clone of the countObjects instance
// this can be helpful when setting a state with React
const clone = co.clone();
console.log(clone === co);
// false
```
