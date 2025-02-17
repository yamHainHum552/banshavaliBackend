import User from "../schemas/userSchema.js";
import { uploadOnCloudinary, deleteImage } from "../utils/cloudinary.js";

export const uploadUserImage = async (req, res) => {
  const { userId } = req.body;
  console.log(userId); // Ensure userId is sent in the request body

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Upload to Cloudinary
    const folder = `userImages/${userId}`;
    const result = await uploadOnCloudinary(req.file.buffer, folder); // Use req.file.buffer for memory storage

    // Delete old image if exists
    if (user.image.publicId) {
      await deleteImage(user.image.publicId);
    }

    // Update user in DB
    user.image = {
      url: result.secure_url,
      publicId: result.public_id,
    };
    await user.save();

    res.status(201).json({
      message: "Image uploaded successfully",
      success: true,
      imageUrl: user.image.url,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
