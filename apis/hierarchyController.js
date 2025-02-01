import Hierarchy from "../schemas/hierarchySchema.js";
import User from "../schemas/userSchema.js";

export const createHierarchy = async (req, res) => {
  const { familyName, placeOfOrigin } = req.body;

  try {
    const hierarchy = new Hierarchy({
      userId: req.user.id,
      familyName,
      placeOfOrigin,
    });

    await hierarchy.save();

    res.status(201).json({
      message: "Hierarchy created successfully",
      success: true,
      hierarchy,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
};

export const getHierarchy = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.findOne({
      userId: req.user.id,
    });

    if (!hierarchy) {
      return res.status(404).json({
        message: "Hierarchy not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Hierarchy retrieved successfully",
      success: true,
      hierarchy,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
export const getMatchedHierarchUsers = async (req, res) => {
  try {
    const { familyName, placeOfOrigin } = req.params;

    // Validate input
    if (!familyName || !placeOfOrigin) {
      return res.status(400).json({
        success: false,
        message: "Family name and place of origin are required.",
      });
    }

    // Find users with matching familyName and placeOfOrigin
    const users = await Hierarchy.find({ familyName, placeOfOrigin }).populate(
      "userId"
    );

    // If no users are found, return a 404 response
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No users found with the provided family name and place of origin.",
      });
    }

    // Get the calling user's ID (assuming it's available on req.user)
    const callingUserId = req.user?._id;

    // Extract, format, and filter out the calling user
    const matchedUsers = users
      .filter((hierarchy) => {
        // Exclude the calling user if found
        if (
          callingUserId &&
          hierarchy.userId._id.toString() === callingUserId.toString()
        ) {
          return false;
        }
        return true;
      })
      .map((hierarchy) => {
        const user = hierarchy.userId;
        return {
          userId: user._id,
          username: user.username,
          email: user.email,
          familyName: hierarchy.familyName,
          placeOfOrigin: hierarchy.placeOfOrigin,
        };
      });

    // If filtering out the calling user results in an empty list, return a 404 response
    if (matchedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No other users found with the provided family name and place of origin.",
      });
    }

    // Return the matched users
    res.status(200).json({
      success: true,
      message: "Matched users retrieved successfully.",
      data: matchedUsers,
    });
  } catch (error) {
    console.error("Error fetching matched users:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching matched users.",
    });
  }
};
