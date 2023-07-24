const express = require("express");
const statisticsController = require("../controllers/statistics.controller");

const router = express.Router();

router
  .route("/get-basic-statistics")
  .get(statisticsController.getBasicStatistics);

module.exports = router;
