import FriendRequest from "../schemas/friendRequest.js";
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
    const { familyName, placeOfOrigin, userId } = req.params;
    const callingUserId = userId;

    if (!callingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request. User ID is missing.",
      });
    }

    if (!familyName || !placeOfOrigin) {
      return res.status(400).json({
        success: false,
        message: "Family name and place of origin are required.",
      });
    }

    // Fetch users who match familyName and placeOfOrigin
    const users = await Hierarchy.find({ familyName, placeOfOrigin }).populate(
      "userId"
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No users found with the provided family name and place of origin.",
      });
    }

    // Fetch all friend requests involving the calling user (both sent and received)
    const friendRequests = await FriendRequest.find({
      $or: [{ senderId: callingUserId }, { receiverId: callingUserId }],
    });

    // Extract friend IDs (both accepted and pending)
    const excludedUserIds = new Set();
    friendRequests.forEach((request) => {
      if (request.status === "accepted" || request.status === "pending") {
        const sender = request.senderId.toString();
        const receiver = request.receiverId.toString();

        if (sender === callingUserId.toString()) {
          excludedUserIds.add(receiver);
        } else {
          excludedUserIds.add(sender);
        }
      }
    });

    // Filter out friends, pending requests, and calling user itself
    const matchedUsers = users
      .filter((hierarchy) => {
        if (!hierarchy.userId || !hierarchy.userId._id) return false; // Ensure userId exists
        const userIdStr = hierarchy.userId._id.toString();
        return (
          userIdStr !== callingUserId.toString() &&
          !excludedUserIds.has(userIdStr)
        );
      })
      .map((hierarchy) => ({
        userId: hierarchy.userId._id,
        username: hierarchy.userId.username,
        email: hierarchy.userId.email,
        familyName: hierarchy.familyName,
        placeOfOrigin: hierarchy.placeOfOrigin,
        image: hierarchy.userId.image,
      }));

    if (matchedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No users found who are not yet friends and do not have pending friend requests.",
      });
    }

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
