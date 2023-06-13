const nodemailer = require("nodemailer");
const ejs = require("ejs");
const config = require("../config/config");
const logger = require("../config/logger");

const transport = nodemailer.createTransport(config.smtpConfig);
transport
  .verify()
  .then(() => logger.info("Connected to email server"))
  .catch(() => logger.warn("Unable to connect to email server"));

const sendEmail = async (from, to, subject, html) => {
  const msg = { from, to, subject, html };
  await transport.sendMail(msg);
};

const sendEmailVerificationLink = async (userEmail, verificationLink) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = userEmail;
  const subject = "Email Verification";
  const template = await ejs.renderFile("src/templates/emailVerification.ejs", {
    verificationLink,
  });

  await sendEmail(from, to, subject, template);
};

const sendPasswordResetLink = async (userEmail, resetLink) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = userEmail;
  const subject = "Password Reset";
  const template = await ejs.renderFile("src/templates/passwordReset.ejs", {
    resetLink,
  });

  await sendEmail(from, to, subject, template);
};

const sendBoughtTicketEmail = async (data) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = data.userEmail;
  const subject = "Ticket Purchase";
  const template = await ejs.renderFile("src/templates/boughtTicketEmail.ejs", {
    userName: data.userName,
    eventName: data.eventName,
    eventDate: data.eventDate,
    ticketUrl: data.ticketUrl,
  });

  await sendEmail(from, to, subject, template);
};

const sendWonTicketEmail = async (data) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = data.userEmail;
  const subject = "Ticket Won";
  const template = await ejs.renderFile("src/templates/wonTicketEmail.ejs", {
    userName: data.userName,
    playedGame: data.playedGame,
    eventName: data.eventName,
    eventDate: data.eventDate,
    ticketUrl: data.ticketUrl,
  });

  await sendEmail(from, to, subject, template);
};

const sendReviewerVerificationCode = async (data) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = data.userEmail;
  const subject = "Reviewer Email Verification";
  const template = await ejs.renderFile(
    "src/templates/reviewerVerificationEmail.ejs",
    {
      userName: data.userName || "there",
      code: data.code,
    }
  );

  await sendEmail(from, to, subject, template);
};

const sendNewEventNotificationEmail = async (creatorEmail, eventId) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = "therealofoji@gmail.com";
  const subject = "New Event";
  const template = await ejs.renderFile("src/templates/newEvent.ejs", {
    creatorEmail,
    eventId: eventId,
  });

  await sendEmail(from, to, subject, template);
};

const sendContactUsEmail = async (name, email, message) => {
  const from = "Globeventnub <admin@globeventnub.com>";
  const to = "therealofoji@gmail.com";
  const subject = "Contact Us";
  const template = await ejs.renderFile("src/templates/contactUs.ejs", {
    name,
    email,
    message,
  });

  await sendEmail(from, to, subject, template);
};

module.exports = {
  transport,
  sendBoughtTicketEmail,
  sendWonTicketEmail,
  sendReviewerVerificationCode,
  sendEmailVerificationLink,
  sendPasswordResetLink,
  sendNewEventNotificationEmail,
  sendContactUsEmail,
};
