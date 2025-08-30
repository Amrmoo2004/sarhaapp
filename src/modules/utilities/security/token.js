    import jwt from "jsonwebtoken";
    import { asynchandler } from "../response/response.js";


export const generate_token = (payload, secretKey , options = { expiresIn: '1h' }) => {
  // Check for payload.id instead of user.id
  if (!payload?.id) {
    throw new Error("Payload must contain user id", { cause: 400 });
  }
  
  if (!secretKey) {
    throw new Error("Secret key is required", { cause: 500 });
  }

  return jwt.sign(payload, secretKey, options);
};


export const verify_token=(token,secretKey)=>{
    try {
        return jwt.verify(token,secretKey)
    } catch (error) {
        return {error}
    }
}
