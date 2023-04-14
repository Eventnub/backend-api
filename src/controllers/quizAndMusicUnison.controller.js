const catchAsync = require("../utils/catchAsync");
const { quizAndMusicUnisonService } = require("../services");

const getEventQuizAndMusicUnisonWinners = catchAsync(async (req, res) => {
  const result =
    await quizAndMusicUnisonService.getEventQuizAndMusicUnisonWinners(
      req.params.eventId,
      req.user.role
    );
  res.send(result);
});

module.exports = {
  getEventQuizAndMusicUnisonWinners,
};
