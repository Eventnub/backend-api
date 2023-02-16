const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const userValidation = require("../validations/user.validation");
const userController = require("../controllers/user.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization("admin"),
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    Authentication,
    Authorization("admin"),
    validate(userValidation.getUsers),
    userController.getUsers
  );

router
  .route("/:uid")
  .get(
    Authentication, 
    validate(userValidation.getUser), 
    userController.getUser
  )
  .patch(
    Authentication,
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    Authentication,
    Authorization("admin"),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

  router
  .route("/save-user-search-query")
  .post(
    Authentication, 
    validate(userValidation.saveUserSearchQuery), 
    userController.saveUserSearchQuery
  )

module.exports = router;
