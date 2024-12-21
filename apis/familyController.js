import FamilyMember from "../schemas/familyMemberSchema.js";
import Hierarchy from "../schemas/hierarchySchema.js";

export const addParent = async (req, res) => {
  const { hierarchyId, name, isFemale, childIds } = req.body;

  try {
    const hierarchy = await Hierarchy.findById(hierarchyId);
    if (!hierarchy || hierarchy.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized action", success: false });
    }

    const children = await FamilyMember.find({ _id: { $in: childIds } });
    if (children.length !== childIds.length) {
      return res
        .status(404)
        .json({ message: "Some children not found.", success: false });
    }

    const newParent = new FamilyMember({
      userId: req.user.id,
      hierarchyId,
      name,
      isFemale,
      parent: null,
      children: childIds,
    });

    await newParent.save();

    await FamilyMember.updateMany(
      { _id: { $in: childIds } },
      { $set: { parent: newParent._id } }
    );

    res.status(201).json({
      message: "Parent added successfully with multiple children.",
      parent: newParent,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Child
export const addChild = async (req, res) => {
  const { hierarchyId, name, isFemale, parentId } = req.body;

  try {
    const hierarchy = await Hierarchy.findById(hierarchyId);
    if (!hierarchy || hierarchy.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized action", success: false });
    }

    const parentMember = parentId
      ? await FamilyMember.findById(parentId)
      : null;

    if (parentId && !parentMember) {
      return res
        .status(404)
        .json({ message: "Parent member not found.", success: false });
    }

    // Create the new child
    const newChild = new FamilyMember({
      userId: req.user.id,
      hierarchyId,
      name,
      isFemale,
      parent: parentId || null,
      children: [],
    });

    await newChild.save();

    if (parentMember) {
      parentMember.children.push(newChild._id);
      await parentMember.save();
    }

    res.status(201).json({
      message: "Child added successfully.",
      child: newChild,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Siblings
export const addSibling = async (req, res) => {
  const { hierarchyId, name, isFemale, siblingId } = req.body;

  try {
    const hierarchy = await Hierarchy.findById(hierarchyId);
    if (!hierarchy || hierarchy.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized action", success: false });
    }

    const siblingMember = await FamilyMember.findById(siblingId);
    if (!siblingMember || !siblingMember.parent) {
      return res.status(400).json({
        message: "Sibling must have a parent to add a new sibling.",
        success: false,
      });
    }

    const newSibling = new FamilyMember({
      userId: req.user.id,
      hierarchyId,
      name,
      isFemale,
      parent: siblingMember.parent,
      children: [],
    });

    await newSibling.save();

    await FamilyMember.findByIdAndUpdate(siblingMember.parent, {
      $push: { children: newSibling._id },
    });

    res.status(201).json({
      message: "Sibling added successfully.",
      sibling: newSibling,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getFamilyMembers = async (req, res) => {
  const { hierarchyId, userId } = req.params;

  try {
    const hierarchy = await Hierarchy.findOne({
      _id: hierarchyId,
      userId: userId,
    });

    if (!hierarchy) {
      return res.status(403).json({
        message: "Unauthorized access to this hierarchy.",
        success: false,
      });
    }

    const familyMembers = await FamilyMember.find({ hierarchyId });

    res.status(200).json({
      message: "Family members fetched successfully.",
      success: true,
      data: familyMembers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
