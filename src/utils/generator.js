const randomString = require("randomstring");

const generateCode = (len = 4) => {
  return randomString.generate({
    length: len,
    charset: "numeric",
  });
};

const genNValuesInRange = (n, start, end) => {
  const values = [];
  while (values.length < n) {
    const floatRandom = Math.random();
    const difference = end - start;
    const random = Math.round(difference * floatRandom);
    const randomWithinRange = random + start;
    if (!values.includes(randomWithinRange)) {
      values.push(randomWithinRange);
    }
  }
  return values;
};

module.exports = {
  generateCode,
  genNValuesInRange,
};
