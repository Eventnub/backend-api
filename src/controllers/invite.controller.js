const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { inviteService } = require("../services");

const createInvite = catchAsync(async (req, res) => {
  const invite = await inviteService.createInvite(req.user.uid, req.body);
  res.status(httpStatus.CREATED).send(invite);
});

const getInvites = catchAsync(async (req, res) => {
  const result = await inviteService.getInvites();
  res.send(result);
});

const getInvite = catchAsync(async (req, res) => {
  const invite = await inviteService.getInviteById(req.params.uid);
  if (!invite) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invite not found");
  }
  res.send(invite);
});

const deleteInvite = catchAsync(async (req, res) => {
  await inviteService.deleteInviteById(req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createInvite,
  getInvites,
  getInvite,
  deleteInvite,
};
