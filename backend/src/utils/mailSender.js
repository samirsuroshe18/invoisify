// utils/mailSender.js
import { createTransport } from 'nodemailer';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { take } from './dailyLimit.js';

const TOKEN_LIFETIME_MS = 1000 * 60 * 10;
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
// a mail server that cannot be reached must fail fast instead of holding the request open
const SEND_TIMEOUT_MS = 10000;

const senderAddress = () => process.env.MAIL_FROM || process.env.MAIL_USER;

const createMailTransport = () => {
  // tests must never send real email
  if (process.env.NODE_ENV === 'test') {
    return createTransport({ jsonTransport: true });
  }

  return createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  });
};

// Sends through Brevo's HTTPS API. Some hosts block the SMTP ports, and HTTPS always gets out.
const sendWithBrevo = async ({ to, subject, html }) => {
  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Invoisify', email: senderAddress() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Mail service answered ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

const sendWithSmtp = ({ to, subject, html }) =>
  createMailTransport().sendMail({ from: `Invoisify <${senderAddress()}>`, to, subject, html });

const MAIL_KEY = 'mail';
// the mail service allows a number of mails a day; the site stops a little before it
const mailsAllowed = () => Number(process.env.DAILY_MAIL_LIMIT) || 250;

// The HTTPS API is used whenever a key is configured; otherwise plain SMTP. Every mail
// counts against the day's allowance of the whole site, so no single form can use up
// what the mail service allows.
const deliver = async (message) => {
  if (await take(MAIL_KEY, mailsAllowed()) === null) {
    throw new Error("Today's allowance of mail is used up");
  }

  return process.env.BREVO_API_KEY ? sendWithBrevo(message) : sendWithSmtp(message);
};

// emailType is "VERIFY" or "RESET"
async function mailSender(email, userId, emailType) {
  try {
    // hex keeps the token safe to put in a URL
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + TOKEN_LIFETIME_MS;

    if (emailType === "VERIFY") {
      await User.findByIdAndUpdate(userId, { verifyToken: token, verifyTokenExpiry: expiry });
    } else if (emailType === "RESET") {
      await User.findByIdAndUpdate(userId, { forgotPasswordToken: token, forgotPasswordTokenExpiry: expiry });
    }

    const isVerify = emailType === "VERIFY";
    const link = `${process.env.FRONTEND_URL}/${isVerify ? "verify-email" : "reset-password"}?token=${token}`;
    const action = isVerify ? "verify your email" : "reset your password";

    const mailResponse = await deliver({
      to: email,
      subject: isVerify ? "Verify your email" : "Reset your password",
      html: `<p>Hello,</p>
<p>Click <a href="${link}">here</a> to ${action}. The link is valid for 10 minutes.</p>
<p>If you did not ask for this, you can ignore this email.</p>
<p>Invoisify</p>`
    });

    return mailResponse;
  } catch (error) {
    console.log(error.message);
  }
};

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// A plain message about a decision. The text can contain what users typed, so it is
// escaped. Returns whether it was sent; a failure never stops the request that caused it.
async function sendMail(to, subject, text) {
  try {
    await deliver({
      to,
      subject,
      html: `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>\n<p>Invoisify</p>`,
    });
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
}

export { sendMail };
export default mailSender;
