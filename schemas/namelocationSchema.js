import mongoose from "mongoose";
const Schema = mongoose.Schema;

const nameLocationSchema = new Schema({
  familyName: { type: String, required: true },
  placeOfOrigin: { type: String, required: true },
});

const NameLocation = mongoose.model("NameLocation", nameLocationSchema);
export default NameLocation;
