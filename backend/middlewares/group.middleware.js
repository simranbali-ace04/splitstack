const mongoose = require("mongoose");
const Group = require("../models/group.model");

const verifyGroupMember = async (req, res, next) => {
  try {
    const { groupid } = req.params;
    if (!mongoose.isObjectIdOrHexString(groupid)) {
      return res.status(400).json({
        message: "Invalid group ID",
      });
    }
    const group = await Group.findById(groupid);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user.id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    req.group = group; // Attach the group to the request object for further use in the route handler
    next();
  } catch (error) {
    next(error);
  }
};

const verifyAdmin = (req, res, next) => {
  const currentMember = req.group.members.find(
    (member) => member.user.toString() === req.user.id.toString()
  );

  if (currentMember.role !== "admin") {
    return res.status(403).json({
      message: "Only admins can perform this action",
    });
  }

  next();
};

module.exports = { 
    verifyGroupMember,
    verifyAdmin
};