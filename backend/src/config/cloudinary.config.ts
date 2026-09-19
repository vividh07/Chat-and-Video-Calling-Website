import { v2 as cloudinary } from "cloudinary";
import { Env } from "./env.config";

const isCloudinaryConfigured =
  Boolean(Env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(Env.CLOUDINARY_API_KEY) &&
  Boolean(Env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: Env.CLOUDINARY_CLOUD_NAME,
    api_key: Env.CLOUDINARY_API_KEY,
    api_secret: Env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary, isCloudinaryConfigured };
