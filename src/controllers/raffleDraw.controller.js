const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { raffleDrawService } = require("../services");

const createRaffleDraw = catchAsync(async (req, res) => {
  const raffleDraw = await raffleDrawService.createRaffleDraw(
    req.user,
    req.body
  );
  res.status(httpStatus.CREATED).send(raffleDraw);
});

const getRaffleDraw = catchAsync(async (req, res) => {
  const raffleDraw = await raffleDrawService.getRaffleDrawById(
    req.params.uid,
    req.user.role
  );
  if (!raffleDraw) {
    throw new ApiError(httpStatus.NOT_FOUND, "Raffle draw not found");
  }
  res.send(raffleDraw);
});

const updateRaffleDraw = catchAsync(async (req, res) => {
  const raffleDraw = await raffleDrawService.updateRaffleDrawById(
    req.user,
    req.params.uid,
    req.body
  );
  res.send(raffleDraw);
});

const deleteRaffleDraw = catchAsync(async (req, res) => {
  await raffleDrawService.deleteRaffleDrawById(req.user, req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

const getEventRaffleDraw = catchAsync(async (req, res) => {
  const raffleDraw = await raffleDrawService.getEventRaffleDrawByEventId(
    req.params.eventId,
    req.user.role
  );
  res.send(raffleDraw);
});

const submitEventRaffleDrawChoice = catchAsync(async (req, res) => {
  const result = await raffleDrawService.submitEventRaffleDrawChoiceByEventId(
    req.user.uid,
    req.params.eventId,
    req.body
  );
  res.send(result);
});

const getEventRaffleDrawWinners = catchAsync(async (req, res) => {
  const result = await raffleDrawService.getRaffleDrawWinnersByEventId(
    req.params.eventId
  );
  res.send(result);
});

const getEventRaffleDrawResults = catchAsync(async (req, res) => {
  const results = await raffleDrawService.getEventRaffleDrawResults(
    req.params.eventId
  );
  res.send(results);
});

module.exports = {
  createRaffleDraw,
  getRaffleDraw,
  updateRaffleDraw,
  deleteRaffleDraw,
  getEventRaffleDraw,
  submitEventRaffleDrawChoice,
  getEventRaffleDrawWinners,
  getEventRaffleDrawResults,
};
