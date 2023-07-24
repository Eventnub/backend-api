const catchAsync = require("../utils/catchAsync");
const { statisticsService } = require("../services");

const getBasicStatistics = catchAsync(async (req, res) => {
  const result = await statisticsService.getBasicStatistics();
  res.send(result);
});

module.exports = {
  getBasicStatistics,
};
