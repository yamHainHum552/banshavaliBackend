import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isFirstLogin: { type: Boolean, default: true },
  image: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
});

const User = mongoose.model("User", userSchema);
export default User;
