import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const mongoDBURI = process.env.MONGODB_PUBLIC_URI;

let isConnected = false;

export const dbConnect = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(mongoDBURI);
    isConnected = true;
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};
