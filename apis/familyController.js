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

export const deleteFamilyMember = async (req, res) => {
  const { memberId } = req.params;

  try {
    const familyMember = await FamilyMember.findById(memberId);

    if (!familyMember) {
      return res
        .status(404)
        .json({ message: "Family member not found.", success: false });
    }

    const hierarchy = await Hierarchy.findById(familyMember.hierarchyId);
    if (!hierarchy || hierarchy.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized action.", success: false });
    }

    if (familyMember.children.length > 0) {
      if (familyMember.parent) {
        await FamilyMember.updateMany(
          { _id: { $in: familyMember.children } },
          { $set: { parent: familyMember.parent } }
        );

        await FamilyMember.findByIdAndUpdate(familyMember.parent, {
          $addToSet: { children: { $each: familyMember.children } },
        });
      } else {
        await FamilyMember.updateMany(
          { _id: { $in: familyMember.children } },
          { $unset: { parent: "" } }
        );
      }
    }

    if (familyMember.parent) {
      await FamilyMember.findByIdAndUpdate(familyMember.parent, {
        $pull: { children: familyMember._id },
      });
    }

    await FamilyMember.findByIdAndDelete(memberId);

    res.status(200).json({
      message: "Family member deleted successfully.",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
      success: false,
    });
  }
};

export const addFirstFamilyMember = async (req, res) => {
  const { hierarchyId, name, isFemale } = req.body;

  try {
    // Check if the hierarchy exists
    const hierarchy = await Hierarchy.findById(hierarchyId);
    if (!hierarchy || hierarchy.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized access to this hierarchy.",
        success: false,
      });
    }

    // Check if any family members already exist in this hierarchy
    const existingFamilyMembers = await FamilyMember.find({ hierarchyId });
    if (existingFamilyMembers.length > 0) {
      return res.status(400).json({
        message: "Family members already exist in this hierarchy.",
        success: false,
      });
    }

    // Add the first family member (root of the family tree)
    const newFamilyMember = new FamilyMember({
      userId: req.user.id,
      hierarchyId,
      name,
      isFemale,
      parent: null, // No parent since this is the first member
      children: [], // No children initially
    });

    await newFamilyMember.save();

    res.status(201).json({
      message: "First family member added successfully.",
      familyMember: newFamilyMember,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
export const editFamilyMember = async (req, res) => {
  const { memberId } = req.params;
  const { name, isFemale } = req.body;

  try {
    // Fetch the family member by ID
    const familyMember = await FamilyMember.findById(memberId);

    if (!familyMember) {
      return res.status(404).json({
        message: "Family member not found.",
        success: false,
      });
    }

    // Check if the user is authorized to edit this family member
    const hierarchy = await Hierarchy.findById(familyMember.hierarchyId);
    if (!hierarchy || hierarchy.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized action.",
        success: false,
      });
    }

    // Update the family member information
    if (name !== undefined) {
      familyMember.name = name;
    }
    if (isFemale !== undefined) {
      familyMember.isFemale = isFemale;
    }

    await familyMember.save();

    res.status(200).json({
      message: "Family member information updated successfully.",
      success: true,
      familyMember,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
