const randomString = require("randomstring");

const generateCode = (len = 4) => {
  return randomString.generate({
    length: len,
    charset: "numeric",
  });
};

module.exports = {
  generateCode,
};
