import FriendRequest from "../schemas/friendRequest.js";

export const sendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const existingRequest = await FriendRequest.findOne({
      senderId,
      receiverId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const friendRequest = new FriendRequest({ senderId, receiverId });
    await friendRequest.save();
    res.status(201).json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requestRespond = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (action !== "accepted" && action !== "rejected") {
      return res.status(400).json({ message: "Invalid action" });
    }

    friendRequest.status = action;
    await friendRequest.save();

    res.json({ message: `Friend request ${action}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await FriendRequest.find({
      receiverId: userId,
      status: "pending",
    }).populate("senderId", "username email image");
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFriendList = async (req, res) => {
  try {
    const { userId } = req.params;

    const friends = await FriendRequest.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: "accepted",
    })
      .populate("senderId", "username email image")
      .populate("receiverId", "username email image");

    // Use a Set to store unique friend IDs
    const uniqueFriends = new Map();

    friends.forEach((friend) => {
      const friendData =
        friend.senderId._id.toString() === userId
          ? friend.receiverId
          : friend.senderId;

      uniqueFriends.set(friendData._id.toString(), friendData);
    });

    res.json([...uniqueFriends.values()]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
