const express = require("express");
const multerConfig = require("../config/multer");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const userValidation = require("../validations/user.validation");
const userController = require("../controllers/user.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization(["admin"]),
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    Authentication,
    Authorization(["admin"]),
    validate(userValidation.getUsers),
    userController.getUsers
  );

router
  .route("/:uid")
  .get(Authentication, validate(userValidation.getUser), userController.getUser)
  .patch(
    Authentication,
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    Authentication,
    Authorization(["admin"]),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

router
  .route("/upload-user-profile-photo")
  .post(
    Authentication,
    multerConfig.single("photo"),
    validate(userValidation.uploadUserProfilePhoto),
    userController.uploadUserProfilePhoto
  );

router
  .route("/save-user-search-query")
  .post(
    Authentication,
    validate(userValidation.saveUserSearchQuery),
    userController.saveUserSearchQuery
  );

router
  .route("/change-user-to-host")
  .post(
    Authentication,
    validate(userValidation.changeUserToHost),
    userController.changeUserToHost
  );

module.exports = router;
