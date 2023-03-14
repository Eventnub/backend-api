const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const inviteValidation = require("../validations/invite.validation");
const inviteController = require("../controllers/invite.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization(["admin"]),
    validate(inviteValidation.createInvite),
    inviteController.createInvite
  )
  .get(Authentication, Authorization(["admin"]), inviteController.getInvites);

router
  .route("/:uid")
  .get(
    Authentication,
    Authorization(["admin"]),
    validate(inviteValidation.getInvite),
    inviteController.getInvite
  )
  .delete(
    Authentication,
    Authorization(["admin"]),
    validate(inviteValidation.deleteInvite),
    inviteController.deleteInvite
  );

module.exports = router;
