import cloudinary from 'cloudinary';
import { getEnvVar } from './getEnvVar.js';
import { CLOUDINARY } from '../constans/index.js';

cloudinary.v2.config({
  secure: true,
  cloud_name: getEnvVar(CLOUDINARY.CLOUD_NAME),
  api_key: getEnvVar(CLOUDINARY.API_KEY),
  api_secret: getEnvVar(CLOUDINARY.API_SECRET),
});

export function saveFileToCloudinary(filePath) {
  return cloudinary.v2.uploader.upload(filePath);
}
