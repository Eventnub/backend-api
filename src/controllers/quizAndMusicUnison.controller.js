const catchAsync = require("../utils/catchAsync");
const { quizAndMusicUnisonService } = require("../services");

const getEventQuizAndMusicUnisonWinners = catchAsync(async (req, res) => {
  const result =
    await quizAndMusicUnisonService.getQuizAndMusicUnisonWinnersByEventId(
      req.params.eventId
    );
  res.send(result);
});

module.exports = {
  getEventQuizAndMusicUnisonWinners,
};
