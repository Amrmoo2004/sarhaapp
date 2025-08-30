import { Router } from "express";
import { isValid } from "../middleware/validation.middleware.js";
import { deleteSchema, sendSchema } from "./message.validation.js";
import { authUser } from "../middleware/authentaction.js";
import* as Message from'./message.service.js'

const router=Router();
router.post("/send-message",authUser,isValid(sendSchema),Message.sendMessage)
router.get("/",authUser,Message.getMessages)
router.delete("/delete/:id",authUser,isValid(deleteSchema),Message.deleteMessage)

export default router