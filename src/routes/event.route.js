const express = require("express");
const multerConfig = require("../config/multer");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const eventValidation = require("../validations/event.validation");
const eventController = require("../controllers/event.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization("admin"),
    multerConfig.single('photo'),
    validate(eventValidation.createEvent),
    eventController.createEvent
  )
  .get(
    validate(eventValidation.getEvents), 
    eventController.getEvents
  );

router
  .route("/:uid")
  .get(
    validate(eventValidation.getEvent), 
    eventController.getEvent
  )
  .patch(
    Authentication,
    Authorization("admin"),
    multerConfig.single('photo'),
    validate(eventValidation.updateEvent),
    eventController.updateEvent
  )
  .delete(
    Authentication,
    Authorization("admin"),
    validate(eventValidation.deleteEvent),
    eventController.deleteEvent
  );

module.exports = router;
