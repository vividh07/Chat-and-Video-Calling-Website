import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import chatRoutes from "./chat.route";
import messageRoutes from "./message.route";
import friendRoutes from "./friend.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/friends", friendRoutes);
router.use("/chats", chatRoutes);
router.use("/messages", messageRoutes);

export default router;
