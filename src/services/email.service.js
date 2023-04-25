const nodemailer = require("nodemailer");
const ejs = require("ejs");
const config = require("../config/config");
const logger = require("../config/logger");

let mainStyle =
  "margin: 1.5em 1.5em 0 1.5em; font-size: 14px; background-color: #f4f2fc; border: 0.1em #dfdaf7 solid;";
let bodyStyle = "padding: 1.5em;";
let footerStyle =
  "width: 100%; background-color: #4485fd; color: #ffffff; padding: 40px 0px; font-size: 24px; margin-top: 34px; text-align: center;";

const transport = nodemailer.createTransport(config.smtpConfig);
transport
  .verify()
  .then(() => logger.info("Connected to email server"))
  .catch(() => logger.warn("Unable to connect to email server"));

const sendEmail = async (from, to, subject, html) => {
  const msg = { from, to, subject, html };
  await transport.sendMail(msg);
};

const sendBoughtTicketEmail = async (data) => {
  const from = "Eventnub <admin@eventnub.com>";
  const to = data.userEmail;
  const subject = "Ticket Purchase";
  const html = `
    <div style="${mainStyle}">
        <div style="${bodyStyle}">
          <p>Hello <b>${data.userName}</b></p>

          <p>Thanks for your purchase.<p>

          <p>
              Here is a confirmation for your receipt for 
              <b>${data.eventName}</b> which holds on <b>${data.eventDate}</b>.
              Click <a href='${data.ticketUrl}'>here</a> to view and download your ticket.
          <p>
        </div>

        <div style="${footerStyle}">
          <h4 style="margin: auto 0px; color: #ffffff;">Eventnub</h4>
        </div>
    <div>
  `;
  await sendEmail(from, to, subject, html);
};

const sendWonTicketEmail = async (data) => {
  const from = "Eventnub <admin@eventnub.com>";
  const to = data.userEmail;
  const subject = "Ticket Won";
  const html = `
    <div style="${mainStyle}">
        <div style="${bodyStyle}">
          <p>Congratulations <b>${data.userName}!</b></p>

          <p>You are one of the winners of the <b>${data.playedGame}</b> on Eventnub platform.<p>

          <p>
              Here is a confirmation for your receipt for 
              <b>${data.eventName}</b> which holds on <b>${data.eventDate}</b>.
              Click <a href='${data.ticketUrl}'>here</a> to view and download your ticket.
          <p>

          <p>
            Congrats once again! 🎉🎉
          </p>

          <p>
            Cheers to  better bonding with your fav! 🎊🎉
          </p>
        </div>

        <div style="${footerStyle}">
          <h4 style="margin: auto 0px; color: #ffffff;">Eventnub</h4>
        </div>
    <div>
  `;
  await sendEmail(from, to, subject, html);
};

const sendEmailVerificatonCodeForReviewerSignup = async (data) => {
  const from = "Eventnub <admin@eventnub.com>";
  const to = data.userEmail;
  const subject = "Reviewer Email Verification";
  const html = `
    <div style="${mainStyle}">
        <div style="${bodyStyle}">
          <p>
            You are intending to be a reviewer (validator) on Eventnub.
            Here is your verification code and it expires in 5 minutes
          </p>

          <p style='font-size: 2em; color: #6D5D6E;'>
            ${data.code}
          <p>
        </div>

        <div style="${footerStyle}">
          <h4 style="margin: auto 0px; color: #ffffff;">Eventnub</h4>
        </div>
    <div>
  `;
  await sendEmail(from, to, subject, html);
};

const sendEmailVerificationLink = async (userEmail, verificationLink) => {
  const from = "Eventnub <admin@eventnub.com>";
  const to = userEmail;
  const subject = "Email Verification";
  const template = await ejs.renderFile("src/templates/emailVerification.ejs", {
    verificationLink,
  });

  await sendEmail(from, to, subject, template);
};

const sendPasswordResetLink = async (userEmail, resetLink) => {
  const from = "Eventnub <admin@eventnub.com>";
  const to = userEmail;
  const subject = "Password Reset";
  const template = await ejs.renderFile("src/templates/passwordReset.ejs", {
    resetLink,
  });

  await sendEmail(from, to, subject, template);
};

const sendNewEventNotificationEmail = async (creatorEmail, eventId) => {
  const from = "Eventnub <admin@eventnub.com>";
  const to = "therealofoji@gmail.com";
  const subject = "New Event";
  const template = await ejs.renderFile("src/templates/newEvent.ejs", {
    creatorEmail,
    link: `https://eventnub-admin.netlify.app/dashboard/unapproved-events/${eventId}`,
  });

  await sendEmail(from, to, subject, template);
};

module.exports = {
  transport,
  sendBoughtTicketEmail,
  sendWonTicketEmail,
  sendEmailVerificatonCodeForReviewerSignup,
  sendEmailVerificationLink,
  sendPasswordResetLink,
  sendNewEventNotificationEmail,
};
