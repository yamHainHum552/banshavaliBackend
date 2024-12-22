import User from "../schemas/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully", success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: err.message, success: false });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid credentials", success: false });

    if (user.isFirstLogin) {
      user.isFirstLogin = false;
      await user.save();
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Invalid credentials", success: false });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).json({
      message: "Logged in successfully!",
      token,
      user: { id: user._id, name: user.name, email: user.email },
      success: true,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: err.message, success: false });
  }
};
export const logout = async (req, res) => {};
