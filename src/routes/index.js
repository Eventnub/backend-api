const express = require("express");
const authRoute = require("./auth.route");
const adminRoute = require("./admin.route");
const userRoute = require("./user.route");
const eventRoute = require("./event.route");
const questionRoute = require("./question.route");
const raffleDrawRoute = require("./raffleDraw.route");
const inviteRoute = require("./invite.route");
const paymentRoute = require("./payment.route");
const ticketRoute = require("./ticket.route");
const musicUnisonRoute = require("./musicUnison.route");
const quizAndMusicUnisonRoute = require("./quizAndMusicUnison.route");
const reviewerRoute = require("./reviewer.route");
const contactUsRoute = require("./contactUs.route");
const seatGeekRoute = require("./seatGeek.route");
const marketingRoute = require("./marketing.route");

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
    path: "/raffle-draws",
    route: raffleDrawRoute,
  },
  {
    path: "/invites",
    route: inviteRoute,
  },
  {
    path: "/payments",
    route: paymentRoute,
  },
  {
    path: "/tickets",
    route: ticketRoute,
  },
  {
    path: "/music-unison",
    route: musicUnisonRoute,
  },
  {
    path: "/quiz-and-music-unison",
    route: quizAndMusicUnisonRoute,
  },
  {
    path: "/reviewers",
    route: reviewerRoute,
  },
  {
    path: "/contact-us",
    route: contactUsRoute,
  },
  {
    path: "/seat-geek",
    route: seatGeekRoute,
  },
  {
    path: "/marketing",
    route: marketingRoute,
  },
];

routes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
