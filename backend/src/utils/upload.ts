import {
  cloudinary,
  isCloudinaryConfigured,
} from "../config/cloudinary.config";
import { BadRequestException } from "./app-error";

export const uploadImageBuffer = async (
  buffer: Buffer,
  folder = "chat-app"
): Promise<string> => {
  if (!isCloudinaryConfigured) {
    throw new BadRequestException(
      "Cloudinary is not configured. Set CLOUDINARY_* env variables."
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};
