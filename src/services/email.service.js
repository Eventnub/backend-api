const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

let mainStyle = "margin: 0 20px 0 20px; font-size: 14px;";
let headerStyle =
  "display: flex; justify-content: center; width: 100%; margin-bottom: 34px";
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
        <div style="${headerStyle}">
          <img 
            style="margin: auto; height: 120px; width: 120px; border-radius: 50%;" 
            src="https://eventnub.netlify.app/static/media/bg.d306ac52.jpg" 
            loading="lazy"
            alt="eventnub"
          />
        </div>

        <p>Hello <b>${data.userName}</b></p>

        <p>Thanks for your purchase.<p>

        <p>
            Here is a confirmation for your receipt for 
            <b>${data.eventName}</b> which holds on <b>${data.eventDate}</b>.
            Click <a href='${data.ticketUrl}'>here</a> to view and download your ticket.
        <p>

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
        <div style="${headerStyle}">
          <img 
            style="margin: auto; height: 120px; width: 120px; border-radius: 50%;" 
            src="https://eventnub.netlify.app/static/media/bg.d306ac52.jpg" 
            loading="lazy"
            alt="eventnub"
          />
        </div>

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

        <div style="${footerStyle}">
          <h4 style="margin: auto 0px;">Eventnub</h4>
        </div>
    <div>
  `;
  await sendEmail(from, to, subject, html);
};

module.exports = {
  transport,
  sendBoughtTicketEmail,
  sendWonTicketEmail,
};
