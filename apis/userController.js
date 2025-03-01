import NameLocation from "../schemas/namelocationSchema.js";
import User from "../schemas/userSchema.js";
import { uploadOnCloudinary, deleteImage } from "../utils/cloudinary.js";

export const uploadUserImage = async (req, res) => {
  const { userId } = req.body;

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

export const getFamilyNameLocation = async (req, res) => {
  try {
    const nameLocations = await NameLocation.find(
      {},
      "familyName placeOfOrigin"
    );
    res.status(200).json({ success: true, data: nameLocations });
  } catch (error) {
    console.error("Error fetching name locations:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const postFamilyNameLocation = async (req, res) => {
  try {
    const { familyName, placeOfOrigin } = req.body;

    if (!familyName || !placeOfOrigin) {
      return res.status(400).json({
        success: false,
        message: "Both familyName and placeOfOrigin are required.",
      });
    }

    // Check if familyName or placeOfOrigin already exists separately
    const existingFamily = await NameLocation.findOne({ familyName });
    const existingPlace = await NameLocation.findOne({ placeOfOrigin });

    if (existingFamily && existingPlace) {
      return res.status(409).json({
        success: false,
        message: "Both family name and place of origin already exist.",
      });
    }

    // Determine what needs to be added
    let newEntries = [];
    if (!existingFamily) newEntries.push({ familyName, placeOfOrigin: null });
    if (!existingPlace) newEntries.push({ familyName: null, placeOfOrigin });

    if (newEntries.length === 0) {
      return res.status(409).json({
        success: false,
        message: "No new values to add.",
      });
    }

    // Insert only new values
    const insertedEntries = await NameLocation.insertMany(newEntries);

    res.status(201).json({
      success: true,
      message: "Successfully added new values.",
      data: insertedEntries,
    });
  } catch (error) {
    console.error("Error adding name location:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
