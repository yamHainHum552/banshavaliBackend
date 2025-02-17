import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hierarchyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hierarchy",
    required: true,
  },
  name: { type: String, required: true },

  parent: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" },
  children: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "FamilyMember" }],
    validate: {
      validator: function (v) {
        if (this.isFemale) {
          return v.length === 0;
        }
        return true;
      },
      message: "Female members cannot have children.",
    },
  },
  isFemale: { type: Boolean, required: true },
  isAlive: {
    type: Boolean,
    default: true,
  },
  occupation: {
    type: String,
    trim: true,
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
  },
  address: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    default: "",
  },
});

const FamilyMember = mongoose.model("FamilyMember", familyMemberSchema);
export default FamilyMember;
