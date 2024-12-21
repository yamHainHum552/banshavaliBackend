import express from "express";
import cors from "cors";
import { dbConnect } from "./db/connectToMongo.js";
import { login, register } from "./apis/authController.js";
import { createHierarchy, getHierarchy } from "./apis/hierarchyController.js";
import { AuthMiddleware } from "./middlewares/AuthMiddleWare.js";
import {
  addChild,
  addParent,
  addSibling,
  getFamilyMembers,
} from "./apis/familyController.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  await dbConnect();
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Hello there" });
});

// User
app.post("/api/registerUser", register);
app.post("/api/loginUser", login);

// Hierarchy
app.post("/api/registerHierarchy", AuthMiddleware, createHierarchy);
app.get("/api/getHierarchy/:hierarchyId", AuthMiddleware, getHierarchy);

// Family Member
app.post("/api/registerParent", AuthMiddleware, addParent);
app.post("/api/registerChild", AuthMiddleware, addChild);
app.post("/api/registerSibling", AuthMiddleware, addSibling);
app.get(
  "/api/hierarchy/:hierarchyId/user/:userId/family",
  AuthMiddleware,
  getFamilyMembers
);

app.listen(3000, () => {
  console.log("Server running on 3000");
});