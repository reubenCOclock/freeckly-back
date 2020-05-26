require("dotenv").config();

const mailgun = require("mailgun-js");

const MG_API_KEY = process.env.MAILGUN_API_KEY;
const MG_DOMAIN = process.env.MAILGUN_DOMAIN;

const mg = mailgun({ apiKey: MG_API_KEY, domain: MG_DOMAIN });
const data = {
  from: "Mailgun Sandbox <postmaster@" + MG_DOMAIN + ">",
  to: process.env.MAILGUN_MAIL_TO,
  subject: "Hello from Freeckly",
  text: "Message from Freeckly!"
};
mg.messages().send(data, function(error, body) {
  console.log(body);
});
