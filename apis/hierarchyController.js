import Hierarchy from "../schemas/hierarchySchema.js";

export const createHierarchy = async (req, res) => {
  const { familyName } = req.body;

  try {
    const existingHierarchy = await Hierarchy.findOne({ familyName });
    if (existingHierarchy) {
      return res.status(400).json({
        message: "Hierarchy name already exists. Please choose another name.",
        success: false,
      });
    }

    const hierarchy = new Hierarchy({
      userId: req.user.id,
      familyName,
    });

    await hierarchy.save();

    res.status(201).json({
      message: "Hierarchy created successfully",
      success: true,
      hierarchy,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error", error: error.message, success: false });
  }
};

export const getHierarchy = async (req, res) => {
  try {
    const hierarchy = await Hierarchy.findOne({
      userId: req.user.id,
    });

    if (!hierarchy) {
      return res.status(404).json({
        message: "Hierarchy not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Hierarchy retrieved successfully",
      success: true,
      hierarchy,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
      success: false,
    });
  }
};
