import { asynchandler } from "../utilities/response/response.js";
import { UserModel } from "../DB/models/user.model.js";
import { generatehash } from "../utilities/security/hash.js";
import { successResponse } from "../utilities/response/response.js";
import { comparehash } from "../utilities/security/hash.js";
import { encrypt} from "../utilities/security/enc.js";
import { decrypt } from "../utilities/security/dec.js";
import { generate_token, verify_token } from "../utilities/security/token.js";
import { OAuth2Client } from 'google-auth-library';
import { login_Credentials } from "../utilities/login_Creadtinals/login.creadtnials.js";
import { emailevnt } from "../utilities/events/email.events.js";
import { setAuthCookies } from "../utilities/login_Creadtinals/login.creadtnials.js";

export const providerEnum = {
  google: "google",
  local: "local"
}

export const roleEnum = {
  USER: 'user',
  ADMIN: 'admin'
} 

export const signup = asynchandler(async (req, res, next) => {
  const { username, email, password, phone ,confirmPassword} = req.body;
  
  
  if (!username || !email || !password || !phone|| !confirmPassword) {
    return next(new Error("All fields are required", { cause: 400 }));
  }

  const existingUser = await UserModel.findOne({ email });
  
  if (existingUser) {
      return next(new Error("Account already exists", { cause: 409 }));
    }
  const user = await UserModel.create({
    username,
    email,
    password: await generatehash({ plaintext: password, saltround: process.env.SALTROUNDS }),
    phone: await encrypt(phone, process.env.encryption_key)
  });



  return successResponse(res, {
    message: "signup successful",
    userId: user._id
  }, 201);
});
export const login = asynchandler(async (req, res, next) => {
  const { email, password } = req.body;



  const user = await UserModel.findOne({ email })
    .select('+password +tokenVersion +isActive');
    
  if (!user || !user.isActive) {
    return next(new Error("Invalid credentials", { cause: 401 }));
  }

  const isValid = await comparehash(password, user.password);
  if (!isValid) {
    await UserModel.updateOne({ email }, { $inc: { loginAttempts: 1 } });
    return next(new Error("Invalid credentials", { cause: 401 }));
  }

  const tokenType = user.role === roleEnum.ADMIN ? 'System' : 'User';
  const { access_token, refresh_token } = login_Credentials(user, res, tokenType);
  const decryptedPhone = user.phone ? await decrypt(user.phone) : null;

  return successResponse(res, {
    statusCode: 200,
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        phone: decryptedPhone,
        username: user.username,
      },
      access_token, 
      expires_in: 1800 // 30 minutes
    },
    message: "Login successful"
  });
});



async function verifygoogleaccount(idToken) { 
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,  
    audience: process.env.web_client_id,
  });
  return ticket.getPayload();
}

export const signupWithGmail = asynchandler(async (req, res, next) => {
  const { idtoken } = req.body;
  
  const payload = await verifygoogleaccount(idtoken); 
  const { picture, name, email, email_verified } = payload;

  if (!email_verified) {
    return next(new Error("Email not verified", { cause: 400 }));
  }

  const existinguser = await UserModel.findOne({ email });
  if (existinguser) {
    return next(new Error("User already exists", { cause: 409 }));
  }

  const newuser = await UserModel.create({
    fullname: name,
    email,
    confirmemail: new Date(),
    provider: providerEnum.google,
    picture,
  });

  return successResponse(res, {
    message: "Google account verified successfully",
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
  }, 200);
});
export const loginWithGmail = asynchandler(async (req, res, next) => {
  const { idtoken } = req.body; 
  
  const payload = await verifygoogleaccount(idtoken);
  const { picture, name, email, isVerified: email_verified } = payload;

  if (!email_verified) {
    return next(new Error("Email not verified", { cause: 400 }));
  }

  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await UserModel.create({
      fullname: name,
      email,
      confirmemail: new Date(),
      provider: providerEnum.google,
      picture,
    });
  }

    const credentials = login_Credentials(user, res, tokenType);

await mergeCarts(user._id, req.sessionID); 
  return successResponse(res, {
   credentials,
    message: "Login successful",
   
  });
});
export const verifyEmail = asynchandler(async (req, res, next) => {
  const { email, otp } = req.body;
  
  const user = await UserModel.findOne({ 
    email,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) return next(new Error("Invalid OTP or expired", { cause: 400 }));
  if (user.otp !== otp) return next(new Error("Invalid OTP", { cause: 400 }));
  if (user.isVerified) return next(new Error("Account already verified", { cause: 400 }));

  user.isVerified = true;
  user.verifiedAt = new Date();
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return successResponse(res, {
    message: "Email verified successfully!"
  });
});
export const resendOtp = asynchandler(async (req, res, next) => {
  const { email } = req.body;
  
  const user = await UserModel.findOne({ email });
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  if (user.isVerified) {
    return next(new Error("Account already verified", { cause: 400 }));
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = newOtp;
  user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  emailevnt.emit("confirmemail", {
    to: email,
    subject: "New Verification Code",
    otp: newOtp,
    username: user.username
  });

  return successResponse(res, {
    message: "New verification code sent"
  });
});

export const sendForgotPassword = asynchandler(async (req, res, next) => {
  const { email } = req.body;
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await UserModel.findOneAndUpdate(
    {
      email: email.toLowerCase().trim(), 
      provider: providerEnum.local,
      deletedAt: { $exists: false } 
    },
    {
      $set: {
        forgotPasswordOtp: await generatehash({ plaintext: otp, saltround: process.env.SALTROUNDS }),
        otpExpires: new Date(Date.now() + 900000) // 15 minutes
      },
      $inc: { otpAttempts: 1 }
    },
    { 
      new: true,
      runValidators: true,
      lean: true,
      select: '-password -__v -tokens'
    }
  );

  if (!user) {
    return next(new Error("No active local user found with this email", { cause: 404 }));
  }

  emailevnt.emit("forgotpassword", {
    to: user.email, 
    subject: "Password Reset OTP",
    otp: otp,
    expiresIn: "15 minutes"
  });

  return successResponse(res, {
    success: true,
    message: "Password reset OTP sent successfully!",
    data: {
      email: user.email, 
      otpExpiresIn: "15 minutes"
    }
  });
});

export const verifyPassword = asynchandler(async (req, res, next) => {
  const { email, otp, password, confirmPassword } = req.body;

  const user = await UserModel.findOne({
  email: { $regex: new RegExp(`^${email}$`, 'i') }, 
  provider: providerEnum.local,
  deletedAt: { $exists: false },
  forgotPasswordOtp: { $exists: true },
  otpExpires: { $gt: new Date() }
});

  if (!user) {
    return next(new Error("No account found with this email", { cause: 404 }));
  }
  if (!user.forgotPasswordOtp || !user.otpExpires) {
    return next(new Error("No password reset request found", { cause: 400 }));
  }

  if (user.otpExpires < new Date()) {
    return next(new Error("OTP has expired. Please request a new one", { cause: 400 }));
  }

  const isOtpValid = await comparehash(otp, user.forgotPasswordOtp);
  if (!isOtpValid) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }
  if (password !== confirmPassword) {
    return next(new Error("Passwords do not match", { cause: 400 }));
  }
  user.password = await generatehash({ plaintext: password});
  user.forgotPasswordOtp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password updated successfully"
  });
});
export const logout = asynchandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  if (!token) {
    return res.sendStatus(204);
  }

  try {
    const decoded = verify_token(token, process.env.verify_seckey);
    const remainingExpiry = decoded.exp - Math.floor(Date.now() / 1000);

    if (remainingExpiry > 0) {
      await redisClient.set(
        `blacklist:${token}`, 
        'revoked', 
        { 
          EX: remainingExpiry,
          NX: true 
        }
      );
      
      console.log(`Token blacklisted for ${remainingExpiry} seconds`);
    }

    return res.sendStatus(204);
  } catch (err) {
    console.error('Logout error:', err.message);
    return res.sendStatus(204); 
  }
});