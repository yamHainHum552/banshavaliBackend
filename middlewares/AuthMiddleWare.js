import jwt from "jsonwebtoken";
import User from "../schemas/userSchema.js";

export const AuthMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "User not found", success: false });
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Not authorized, token failed", success: false });
    }
  } else {
    return res
      .status(401)
      .json({ message: "No token, authorization denied", success: false });
  }
};
