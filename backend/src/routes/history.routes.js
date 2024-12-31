
import express from 'express';

const { getHistory } = require('../controllers/historyController');
const router = express.Router();


router.get('/history', getHistory);

export default REACT_ROUTER_VERSION;
