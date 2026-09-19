import { Router } from "express";
import {
  getMeController,
  searchUsersController,
  updateProfileController,
  uploadAvatarController,
  discoverUsersController,
  getUserProfileController,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  searchUsersSchema,
  updateProfileSchema,
  userIdParamSchema,
} from "../validators/user.validator";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.use(isAuthenticated);

router.get("/me", getMeController);
router.get("/discover", discoverUsersController);
router.get("/search", validate(searchUsersSchema), searchUsersController);
router.get("/:userId", validate(userIdParamSchema), getUserProfileController);
router.patch("/me", validate(updateProfileSchema), updateProfileController);
router.post("/me/avatar", upload.single("avatar"), uploadAvatarController);

export default router;
