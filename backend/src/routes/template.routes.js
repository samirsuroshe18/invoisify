import {Router} from "express";
import {createTemplate, getTemplates} from "../controllers/template.controller.js";

const router = Router();

router.post("/create-templet", createTemplate);
router.get("/get-templet", getTemplates);

export default router;
