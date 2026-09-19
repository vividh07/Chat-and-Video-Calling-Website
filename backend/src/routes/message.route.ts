import { Router } from "express";
import {
  getMessagesController,
  markReadController,
  sendMessageController,
  uploadChatImageController,
} from "../controllers/message.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  getMessagesSchema,
  markReadSchema,
  sendMessageSchema,
} from "../validators/message.validator";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.use(isAuthenticated);

router.post("/upload", upload.single("image"), uploadChatImageController);
router.get("/:chatId", validate(getMessagesSchema), getMessagesController);
router.post("/", validate(sendMessageSchema), sendMessageController);
router.patch("/:chatId/read", validate(markReadSchema), markReadController);

export default router;
