const randomString = require("randomstring");

const generateCode = (len = 4) => {
  return randomString.generate({
    length: len,
    charset: "numeric",
  });
};

const genNValuesInRange = (n, start, end) => {
  const values = [];
  for (let i = 0; i < n; i++) {
    const floatRandom = Math.random();
    const difference = end - start;
    const random = Math.round(difference * floatRandom);
    const randomWithinRange = random + start;
    values.push(randomWithinRange);
  }
  return values;
};

module.exports = {
  generateCode,
  genNValuesInRange,
};
