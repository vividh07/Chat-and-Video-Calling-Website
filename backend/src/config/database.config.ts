import mongoose from "mongoose";
import { Env } from "./env.config";

const connectDatabse = async () => {
  try {
    let uri = Env.MONGO_URI;

    if (Env.USE_MEMORY_DB === "true") {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri("chat-video-app");
      console.log("Using in-memory MongoDB for development");
    }

    await mongoose.connect(uri);
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error: ", error);
    process.exit(1);
  }
};

export default connectDatabse;
