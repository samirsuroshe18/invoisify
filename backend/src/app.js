import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import userRouter from './routes/user.routes.js';
import verifyRouter from './routes/verify.routes.js';
import businessRouter from './routes/business.routes.js';
import invoiceRouter from './routes/invoice.routes.js';
import publicRouter from './routes/public.routes.js';

const app = express();

// the server does not say what it is made with
app.disable('x-powered-by');

// behind the host's proxy the connection's own address is the proxy; this makes
// req.ip the address the proxy saw
app.set('trust proxy', 1);

// the web app reaches the server through its own address, so other origins are only
// allowed when one is named
app.use(cors({ origin: process.env.CORS_ORIGIN || false, credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
    return res.status(200).json(new ApiResponse(200, { status: 'ok' }, "OK"));
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/business", businessRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/public", publicRouter);

app.use((req, res, next) => {
    next(new ApiError(404, "Route not found"));
});

// Custom error handling
app.use((err, req, res, next) => {
    // a body that could not be read, or one that is too large, is the sender's mistake
    const isBodyError = err.type === 'entity.parse.failed' || err.type === 'entity.too.large';
    const isValidationError = err.name === 'ValidationError';
    const statusCode = err.statusCode || err.status || (isBodyError || isValidationError ? 400 : 500);
    // an unexpected failure can carry database or stack details, so only messages
    // written for the client (ApiError) are sent back
    const message = err instanceof ApiError
        ? err.message
        : (isBodyError ? "The request could not be read" : (statusCode >= 500 ? "Internal server error" : "The request is not valid"));

    if (statusCode >= 500) {
        console.log(err);
    }

    return res.status(statusCode).json({
        statusCode: statusCode,
        data: null,
        message: message,
        success: false
    });
})

export default app
