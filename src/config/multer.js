const multer = require("multer");

const multerConfig = multer({
  storage: multer.memoryStorage(),
});

module.exports = multerConfig;
