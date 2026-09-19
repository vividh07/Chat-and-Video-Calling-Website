import { Router } from "express";
import {
  acceptRequestController,
  getFriendsController,
  getRequestsController,
  rejectRequestController,
  sendRequestController,
} from "../controllers/friend.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  requestIdParamSchema,
  sendFriendRequestSchema,
} from "../validators/friend.validator";

const router = Router();

router.use(isAuthenticated);

router.get("/", getFriendsController);
router.get("/requests", getRequestsController);
router.post("/request", validate(sendFriendRequestSchema), sendRequestController);
router.post(
  "/requests/:requestId/accept",
  validate(requestIdParamSchema),
  acceptRequestController
);
router.post(
  "/requests/:requestId/reject",
  validate(requestIdParamSchema),
  rejectRequestController
);

export default router;
