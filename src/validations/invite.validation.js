const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const createInvite = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    role: Joi.string().valid("admin").required(),
  }),
};

const getInvite = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
};

const deleteInvite = {
  params: Joi.object().keys({
    uid: Joi.string().required().custom(documentId),
  }),
};

module.exports = {
  createInvite,
  getInvite,
  deleteInvite,
};
