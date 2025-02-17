import express from "express";
import cors from "cors";
import multer from "multer"; // Import multer for file uploads
import { dbConnect } from "./db/connectToMongo.js";
import { login, register } from "./apis/authController.js";
import {
  createHierarchy,
  getHierarchy,
  getMatchedHierarchUsers,
} from "./apis/hierarchyController.js";
import { AuthMiddleware } from "./middlewares/AuthMiddleWare.js";
import {
  addChild,
  addFirstFamilyMember,
  addParent,
  addSibling,
  deleteFamilyMember,
  editFamilyMember,
  getFamilyMembers,
} from "./apis/familyController.js";
import {
  getAllRequests,
  getFriendList,
  requestRespond,
  sendRequest,
} from "./apis/friendRequestController.js";
import { uploadUserImage } from "./apis/userController.js"; // Import the upload function

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
  await dbConnect();
  next();
});

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Hello there" });
});

// User Authentication
app.post("/api/registerUser", register);
app.post("/api/loginUser", login);

// Hierarchy Management
app.post("/api/registerHierarchy", AuthMiddleware, createHierarchy);
app.get("/api/getHierarchy", AuthMiddleware, getHierarchy);
app.get(
  "/api/getUsers/:familyName/:placeOfOrigin/:userId",
  AuthMiddleware,
  getMatchedHierarchUsers
);

// Family Member Management
app.post("/api/registerFirstMember", AuthMiddleware, addFirstFamilyMember);
app.post("/api/registerParent", AuthMiddleware, addParent);
app.post("/api/registerChild", AuthMiddleware, addChild);
app.post("/api/registerSibling", AuthMiddleware, addSibling);
app.get(
  "/api/hierarchy/:familyName/user/:userId/family",
  AuthMiddleware,
  getFamilyMembers
);
app.put("/api/editFamilyMember/:memberId", AuthMiddleware, editFamilyMember);
app.delete("/api/family-member/:memberId", AuthMiddleware, deleteFamilyMember);

// Friend Requests
app.get("/api/requests/:userId", AuthMiddleware, getAllRequests);
app.get("/api/friends/:userId", AuthMiddleware, getFriendList);
app.post("/api/sendRequest", AuthMiddleware, sendRequest);
app.post("/api/respondRequest", AuthMiddleware, requestRespond);

// ✅ Upload User Image to Cloudinary
app.post(
  "/api/uploadUserImage",
  AuthMiddleware,
  upload.single("file"),
  uploadUserImage
);

// Start the server
app.listen(3000, () => {
  console.log("Server running on 3000");
});
