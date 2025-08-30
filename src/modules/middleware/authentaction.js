import { verify_token } from "../utilities/security/token.js";
import { UserModel } from "../DB/models/user.model.js";
import jwt from "jsonwebtoken";


export const authUser = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let decoded;
    try {
      decoded = jwt.decode(token);
      if (!decoded) throw new Error("Invalid token structure");
      
      const secret = decoded.tokenType === 'System'
        ? process.env.ACCESS_SYSTEM_TOKEN_SECRET
        : process.env.ACCESS_USER_TOKEN_SECRET;
      
      decoded = verify_token(token, secret);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }


    const userExists = await UserModel.findById(decoded.id).lean();
    if (!userExists) {
      return res.status(401).json({ message: "User not found, authentication required" });
    }

    if (userExists.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Session expired, please login again" });
    }


    req.user = userExists;
    next();
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};