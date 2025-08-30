
import { generate_token } from "../security/token.js";

export const login_Credentials = (user, res, tokenType) => {
  const accessSecret = tokenType === 'System' 
    ? process.env.ACCESS_SYSTEM_TOKEN_SECRET 
    : process.env.ACCESS_USER_TOKEN_SECRET;
  
  const refreshSecret = tokenType === 'System'
    ? process.env.REFRESH_SYSTEM_TOKEN_SECRET
    : process.env.REFRESH_USER_TOKEN_SECRET;

  // Payload
  const tokenPayload = {
    id: user._id.toString(),
    role: user.role,
    tokenVersion: user.tokenVersion,
    tokenType
  };

  // Generate tokens
  const access_token = generate_token(tokenPayload, accessSecret, { expiresIn: '30m' });
  const refresh_token = generate_token(tokenPayload, refreshSecret, { expiresIn: '7d' });

  setAuthCookies(res, { access_token, refresh_token });

  return { 
    access_token, 
    token_type: 'Bearer',
    expires_in: 1800 
  };
};

export const setAuthCookies = (res, { access_token, refresh_token }) => {
  res.cookie('access_token', access_token, {
    httpOnly: false, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', 
    maxAge: 30 * 60 * 1000
  });

  res.cookie('refresh_token', refresh_token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth/refresh', 
    maxAge: 7 * 24 * 60 * 60 * 1000

  });
};