# count-objects

Counts objects for each value

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

### count unique values

```javascript
// instead of counting unique objects, we can count unique values.
// in this example we count unique colors:

const flowers = [
  {
    color: "black",
    type: "Tulip",
  },
  {
    color: "black",
    type: "Tulip",
  },
  {
    color: "white",
    type: "Tulip",
  },
  {
    type: "Tulip",
  },
];

const uniqueColors = new CountObjects(flowers, { uniqueKey: "color" });
console.table(uniqueColors.table());
// ┌─────────┬────────┬─────────┬───────┐
// │ (index) │  key   │  value  │ count │
// ├─────────┼────────┼─────────┼───────┤
// │    0    │ 'type' │ 'Tulip' │   2   │
// └─────────┴────────┴─────────┴───────┘

// about the unique key ('uniqueKey'):
// 1. it needs to be at the base of the object (not nested)
// 2. it is omitted from the count
// 3. if it is missing, the values in the object are not counted
// 4. it can only be set once, at the constructor
```

### clone

```javascript
// creates a clone of the countObjects instance
// this can be helpful when setting a state with React
const clone = co.clone();
console.log(clone === co);
// false
```
