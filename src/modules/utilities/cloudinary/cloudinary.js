import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: 'dclziguvf',
  api_key: '264586979866139',
  api_secret: process.env.api_secret,
  secure: true
});

export const uploadFile = async (file, path = "general") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${process.env.application_name}/${path}`
    });
  return {
      secure_url: result.secure_url,
      url: result.url,
      public_id: result.public_id,
      asset_id: result.asset_id
    };
  } catch (error) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw error;
  }
};

export const uploadFiles = async (files = [], path = "general") => {
  const uploadPromises = files.map(file => 
    uploadFile(file, path).catch(error => {
      console.error(`Failed to upload ${file.originalname}:`, error);
      return null;
    })
  );
  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean); 
};
export const destroyFile = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};

