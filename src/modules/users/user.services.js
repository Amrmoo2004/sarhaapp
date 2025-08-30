import { asynchandler } from "../utilities/response/response.js";
import { comparehash, generatehash } from "../utilities/security/hash.js";
import { UserModel } from "../DB/models/user.model.js";
import bcrypt from 'bcrypt';
import { uploadFile } from "../utilities/cloudinary/cloudinary.js";
 import { filevalidation } from "../utilities/multer/locaal.multer.js";
import { destroyFile } from "../utilities/cloudinary/cloudinary.js";
import { decrypt } from "../utilities/security/dec.js";
import { encrypt } from "../utilities/security/enc.js";
import fs from 'fs';


export const updatepassword = asynchandler(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new Error("All fields are required", { cause: 400 }));
  } 
  if (newPassword !== confirmPassword) {
    return next(new Error("New password and confirm password do not match", { cause:  400 }));
  } 
  const user = await UserModel.findById(req.user._id)
    .select('+password +tokenVersion');

  if (!await comparehash(oldPassword, user.password)) {
    return next(new Error("Invalid current password", { cause: 400 }));
  }

user.password = await generatehash({ plaintext: newPassword });
  user.tokenVersion += 1; 
  await user.save();

  return res.json({
    success: true,
    requiresReauth: true, 
    message: "Password updated. Please login again."
  });
});
export const getProfile = asynchandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id)
    .select('-password -__v -createdAt -updatedAt -forgotPasswordOtp -otpExpires');
  
  if (!user) {
    throw new Error('User not found', { cause: 404 });
  }

  if (user.phone) {
    user.phone = decrypt(user.phone);
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      
    }
  });
});
export const updateProfile = asynchandler(async (req, res, next) => {
  const { username, phone } = req.body;
  let imageData = null;

  if (req.file) {
    try {
      imageData = await uploadFile(req.file, `users/profile/${req.user._id}`);
      fs.unlinkSync(req.file.path); 
    } catch (error) {
      return next(new Error(`Image upload failed: ${error.message}`, { cause: 500 }));
    }
  }

  const user = await UserModel.findById(req.user._id);
  if (!user) {
    if (imageData) await destroyFile(imageData.public_id);
    return next(new Error('User not found', { cause: 404 }));
  }

  const updateData = {
    ...(username && { username }),
    ...(phone && { phone: encrypt(phone) }),
  };

  if (imageData) {
    if (user.picture?.public_id) {
      await destroyFile(user.picture.public_id);
    }
    
    updateData.picture = {
     url: imageData.secure_url,
      public_id: imageData.public_id
    };
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    updateData,
    { 
      new: true,
      runValidators: true
    }
  ).lean();

  if (!updatedUser) {
    if (imageData) await destroyFile(imageData.public_id);
    return next(new Error('User update failed', { cause: 500 }));
  }

  const responseData = {
    id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    phone: updatedUser.phone ? decrypt(updatedUser.phone) : null,
    role: updatedUser.role,
    isVerified: updatedUser.isVerified,
    picture: updatedUser.picture
  };

  if (updatedUser.picture?.secure_url) {
    responseData.picture = {
      url: updatedUser.picture.secure_url,
      public_id: updatedUser.picture.public_id
    };
  }

  return res.status(200).json({
    success: true,
    data: responseData,
    message: 'Profile updated successfully'
  });
});
export const update_userrole= asynchandler(async (req, res, next) => {

  const { role } = req.body;
  const user = await UserModel.findById(req.params.id||req.query.id);

  if (!user) {
    return next(new Error('User not found', { cause: 404 }));
  }

  user.role = role;
  await user.save();  
  return res.status(200).json({
    success: true,
    message: 'User role updated successfully'
  });
})
export const get_users = asynchandler(async (req, res, next) => {
  const users = await UserModel.find().lean();
  
  if (!users || users.length === 0) {
    return next(new Error('Users not found', { cause: 404 }));
  }

  const usersWithDecryptedPhones = users.map(user => {
    // Create a copy of the user object
    const userCopy = { ...user };
    
    if (userCopy.phone) {
      userCopy.phone = decrypt(userCopy.phone);
    }
    
    return userCopy;
  });

  return res.status(200).json({
    success: true,
    data: usersWithDecryptedPhones
  });
});
export const deleteuser = asynchandler(async (req, res, next) => {
  const user = await UserModel.findByIdAndDelete(req.params.id || req.query.id);
  
  if (!user) {
    return next(new Error('User not found', { cause: 404 }));
  }

  if (user.picture?.public_id) {
    await destroyFile(user.picture.public_id);
  }

  return res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
})