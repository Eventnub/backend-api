const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const createUser = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    favoriteCelebrity: Joi.string(),
    password: Joi.string().required().custom(password),
    ageRange: Joi.string().required(),
  }),
};

const createUserFromProvider = {
  body: Joi.object().keys({
    provider: Joi.string().required(),
    credentials: Joi.object().keys({
      uid: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().required().email(),
      favoriteCelebrity: Joi.string(),
      ageRange: Joi.string().required(),
    }),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    role: Joi.string(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    firstName: Joi.string(),
    lastName: Joi.string(),
    favoriteCelebrity: Joi.string(),
    ageRange: Joi.string(),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    uid: Joi.string().required().custom(documentId),
  }),
};

const uploadUserProfilePhoto = {
  file: Joi.string().required(),
};

const saveUserSearchQuery = {
  body: Joi.object().keys({
    searchQuery: Joi.string(),
  }),
};

const changeUserToHost = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
  }),
};

module.exports = {
  createUser,
  createUserFromProvider,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadUserProfilePhoto,
  saveUserSearchQuery,
  changeUserToHost,
};
