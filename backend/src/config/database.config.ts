import mongoose from "mongoose";
import { Env } from "./env.config";

const connectDatabse = async () => {
  try {
    let uri = Env.MONGO_URI;

    // Local-only optional memory DB (package is a devDependency; skipped on Render)
    if (Env.USE_MEMORY_DB === "true") {
      const moduleName = "mongodb-memory-server";
      const memory = await import(moduleName);
      const memoryServer = await memory.MongoMemoryServer.create();
      uri = memoryServer.getUri("luma");
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
