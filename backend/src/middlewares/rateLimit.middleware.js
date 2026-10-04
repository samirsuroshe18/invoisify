import { rateLimit } from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';
import { connectionOf, visitorOf } from '../utils/visitor.js';

const WINDOW_MS = 15 * 60 * 1000;
const TOO_MANY = "Too many attempts. Please try again in a few minutes.";

// The automated tests switch the limits on by setting ACCOUNT_RATE_LIMIT; otherwise
// they would get in the way of every test.
const skippedInTests = () => process.env.NODE_ENV === 'test' && !process.env.ACCOUNT_RATE_LIMIT;

const setting = (name, fallback) => () => Number(process.env[name]) || fallback;

const limiter = (limit, keyGenerator, skip = skippedInTests) => rateLimit({
    windowMs: WINDOW_MS,
    limit,
    keyGenerator,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    handler: (req, res, next) => next(new ApiError(429, TOO_MANY)),
});

// The visitor's address is forwarded by the proxies in front of the server and can be
// made up by someone who calls the server directly. The address the request really
// arrived from cannot, and neither can the email address it is about, so each of
// those has a limit of its own. The connection comes first: made-up visitors are
// refused before anything is remembered about them.
const emailOf = (req) => (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '');

const byConnection = limiter(setting('ACCOUNT_CONNECTION_RATE_LIMIT', 120), (req) => `connection:${connectionOf(req)}`);
const byVisitor = limiter(setting('ACCOUNT_RATE_LIMIT', 30), visitorOf);
const byEmail = limiter(
    setting('ACCOUNT_EMAIL_RATE_LIMIT', 10),
    (req) => `email:${emailOf(req)}`,
    (req) => skippedInTests() || !emailOf(req)
);

// sign-up, login and password reset: they can send email or test a password
const accountLimiter = [byConnection, byVisitor, byEmail];

// the demo login needs no password, so it only has the limits by address
const demoLimiter = [byConnection, byVisitor];

// Everything a logged-in user changes; reading is not limited. The demo account is
// shared by every visitor, so its limit is kept per visitor: one visitor cannot use up
// the allowance of the others. Use after verifyJwt.
const writeLimiter = limiter(
    setting('WRITE_RATE_LIMIT', 120),
    (req) => `write:${req.user?._id}:${req.user?.isDemo ? visitorOf(req) : ''}`,
    (req) => skippedInTests() || req.method === 'GET'
);

export { accountLimiter, demoLimiter, writeLimiter }
