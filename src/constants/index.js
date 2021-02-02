const uniqueKey = Math.random().toString(36).split(".")[1];
const delimiter = Math.random().toString(36).split(".")[1];

module.exports = {
  delimiter,
  uniqueKey,
  prettyDelimiter: ".",
};
