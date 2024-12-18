import mongoose from "mongoose";

const hierarchySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  familyName: { type: String, required: true },
});

const Hierarchy = mongoose.model("Hierarchy", hierarchySchema);
export default Hierarchy;
