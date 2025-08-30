import { Router } from "express";

import * as auth from "./auth.services.js";
const router = Router();


router.post("/signup",auth.signup); 
router.post("/login",auth.login);
router.post("/signup/gmail",auth.signupWithGmail);
router.post("/login/gmail",auth.loginWithGmail);

export default router; 