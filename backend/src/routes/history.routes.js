import {Router} from 'express';
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {getHistory} from '../controllers/history.controller.js';

const router = Router();

router.route('/get-history').get(verifyJwt, getHistory);

export default router;
