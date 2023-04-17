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
    Authorization(["admin", "host"]),
    multerConfig.single("photo"),
    validate(eventValidation.createEvent),
    eventController.createEvent
  )
  .get(validate(eventValidation.getEvents), eventController.getEvents);

router
  .route("/:uid")
  .get(validate(eventValidation.getEvent), eventController.getEvent)
  .patch(
    Authentication,
    Authorization(["admin", "host"]),
    multerConfig.single("photo"),
    validate(eventValidation.updateEvent),
    eventController.updateEvent
  )
  .delete(
    Authentication,
    Authorization(["admin", "host"]),
    validate(eventValidation.deleteEvent),
    eventController.deleteEvent
  );

router
  .route("/like-or-unlike-event/:uid")
  .post(
    Authentication,
    validate(eventValidation.likeOrUnlikeEvent),
    eventController.likeOrUnlikeEvent
  );

router
  .route("/approve-event/:eventId")
  .patch(
    Authentication,
    Authorization(["admin"]),
    validate(eventValidation.approveEvent),
    eventController.approveEvent
  );

router
  .route("/get-creator-events/:creatorId")
  .get(
    Authentication,
    validate(eventValidation.getCreatorEvents),
    eventController.getCreatorEvents
  );

router
  .route("/unapproved-events/get-all")
  .get(
    Authentication,
    Authorization(["admin"]),
    eventController.getUnapprovedEvents
  );

module.exports = router;
