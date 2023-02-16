const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { userService } = require("../services");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const result = await userService.getUsers();
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.uid);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.uid, req.body);
  res.send(user);
});

const uploadUserProfilePhoto = catchAsync(async (req, res) => {
  const updatedBody = await userService.uploadUserProfilePhoto(req.user.uid, req.file);
  res.send(updatedBody);
});

const saveUserSearchQuery = catchAsync(async (req, res) => {
  await userService.saveUserSearchQuery(req.user.uid, req.body.searchQuery);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  uploadUserProfilePhoto,
  saveUserSearchQuery,
  deleteUser,
};
