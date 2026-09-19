import { Router } from "express";
import {
  createGroupChatController,
  createPrivateChatController,
  getChatController,
  getChatsController,
} from "../controllers/chat.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  chatIdParamSchema,
  createGroupChatSchema,
  createPrivateChatSchema,
} from "../validators/chat.validator";

const router = Router();

router.use(isAuthenticated);

router.get("/", getChatsController);
router.get("/:chatId", validate(chatIdParamSchema), getChatController);
router.post(
  "/private",
  validate(createPrivateChatSchema),
  createPrivateChatController
);
router.post(
  "/group",
  validate(createGroupChatSchema),
  createGroupChatController
);

export default router;
