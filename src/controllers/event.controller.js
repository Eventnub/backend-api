const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { eventService } = require("../services");

const createEvent = catchAsync(async (req, res) => {
  const event = await eventService.createEvent(req.file, req.body);
  res.status(httpStatus.CREATED).send(event);
});

const getEvents = catchAsync(async (req, res) => {
  const events = await eventService.getEvents();
  res.send(events);
});

const getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEventById(req.params.uid);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found");
  }
  res.send(event);
});

const updateEvent = catchAsync(async (req, res) => {
  const event = await eventService.updateEventById(
    req.params.uid,
    req.file,
    req.body
  );
  res.send(event);
});

const deleteEvent = catchAsync(async (req, res) => {
  await eventService.deleteEventById(req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

const likeOrUnlikeEvent = catchAsync(async (req, res) => {
  await eventService.likeOrUnlikeEventById(
    req.params.uid,
    req.user.uid,
    req.body.action
  );
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  likeOrUnlikeEvent,
};
