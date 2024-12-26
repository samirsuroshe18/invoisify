import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {fileURLToPath} from "url";
import { dirname } from "path";
import path from "path";
import errorHandler from "./utils/errorHandler.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticPath = path.join(__dirname, '../public');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

app.use(cors({origin: ["http://localhost:5173", process.env.CORS_ORIGIN], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(staticPath));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.route.js";
import oauthRouter from "./routes/oauth.routes.js";

//routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/oauth", oauthRouter);

app.use(errorHandler);

export default app;