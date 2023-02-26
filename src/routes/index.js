const express = require("express");
const authRoute = require("./auth.route");
const adminRoute = require("./admin.route");
const userRoute = require("./user.route");
const eventRoute = require("./event.route");
const questionRoute = require("./question.route");
const inviteRoute = require("./invite.route");

const router = express.Router();

const routes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/admin",
    route: adminRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/events",
    route: eventRoute,
  },
  {
    path: "/questions",
    route: questionRoute,
  },
  {
    path: "/invites",
    route: inviteRoute,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
