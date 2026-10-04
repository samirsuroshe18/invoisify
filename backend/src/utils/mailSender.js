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
const sendWithBrevo = async ({ to, subject, html, senderName = 'Invoisify', replyTo }) => {
  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderAddress() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Mail service answered ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

const sendWithSmtp = ({ to, subject, html, senderName = 'Invoisify', replyTo }) =>
  createMailTransport().sendMail({ from: { name: senderName, address: senderAddress() }, to, subject, html, replyTo });

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-03-15" as "15 Mar 2026"
const dayLabel = (day) => {
  const [year, month, date] = day.split('-').map(Number);
  return `${date} ${MONTHS[month - 1]} ${year}`;
};

// a name on one line, without the characters that mean something in a mail header
const headerSafe = (value) => String(value || '').replace(/[\r\n<>"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

// The mail that tells a customer about an invoice. Everything in it that a user typed
// is escaped in the text and stripped of line breaks in the headers.
// details: { to, from (the business's name), replyTo, customerName, number, total, currency, dueDate, link }
const invoiceMail = ({ to, from, replyTo, customerName, number, total, currency, dueDate, link }) => {
  const business = headerSafe(from) || 'A business';
  const amount = `${currency} ${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return {
    to,
    subject: `Invoice ${headerSafe(number)} from ${business}`,
    senderName: `${business} via Invoisify`,
    // answers go to the business, when it gave an address that is one
    replyTo: typeof replyTo === 'string' && EMAIL_PATTERN.test(replyTo) ? replyTo : undefined,
    html: `<p>Hello ${escapeHtml(customerName)},</p>
<p>${escapeHtml(business)} has sent you invoice <strong>${escapeHtml(number)}</strong> for <strong>${escapeHtml(amount)}</strong>, due on ${escapeHtml(dayLabel(dueDate))}.</p>
<p><a href="${escapeHtml(link)}">View the invoice</a>. You can also download it as a PDF there.</p>
<p>If you have a question about this invoice, reply to this email: your answer goes to ${escapeHtml(business)}.</p>
<p>Sent with Invoisify</p>`,
  };
};

// Sends the invoice mail. Returns whether it was accepted for delivery; a failure
// never throws, so the caller can leave the invoice as it was.
async function sendInvoiceMail(details) {
  try {
    await deliver(invoiceMail(details));
    return true;
  } catch (error) {
    console.log(error.message);
    return false;
  }
}

export { invoiceMail, sendInvoiceMail };

export default mailSender;
