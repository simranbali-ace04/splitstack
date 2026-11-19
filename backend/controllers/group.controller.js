const Group = require("../models/group.model");
const User = require("../models/user.model");

async function handleCreateGroup(req, res) {
  const { name, members } = req.body;
  const createdBy = req.user.id;
  if (!name || !Array.isArray(members)) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const memberIds = [
      ...new Set(members.map((member) => member.user ?? member)),
    ];
    const invalidIds = memberIds.some(
      (id) => !mongoose.isObjectIdOrHexString(id),
    );
    if (invalidIds) {
      return res.status(400).json({
        message: "Invalid member IDs provided",
      });
    }
    const otherMemberIds = memberIds.filter(
      (id) => id.toString() !== createdBy.toString(),
    );
    const users = await User.find({
      _id: { $in: otherMemberIds },
    });
    if (users.length !== otherMemberIds.length) {
      return res.status(400).json({
        message: "One or more members do not exist",
      });
    }
    const groupMembers = [
      {
        user: createdBy,
        role: "admin",
      },
      ...otherMemberIds.map((memberId) => ({
        user: memberId,
        role: "member",
      })),
    ];
    const group = new Group({
      name,
      createdBy,
      members: groupMembers,
    });
    await group.save();
    return res
      .status(201)
      .json({ message: "Group created successfully", group });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error creating group", error: err.message });
  }
}

async function handleGetGroups(req, res) {
  try {
    const groups = await Group.find({ "members.user": req.user._id }).populate(
      "members.user",
      "name email",
    );
    return res.status(200).json(groups);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching groups", error: err.message });
  }
}

async function handleGetGroupById(req, res) {
  try {
    const group = await Group.findById(req.params.groupid).populate(
      "members.user",
      "name email",
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const isMember = group.members.some(
      (member) => member.user._id.toString() === req.user.id.toString(),
    );
    if(!isMember){
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    return res.status(200).json(group);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching group", error: err.message });
  }
}

module.exports = {
  handleCreateGroup,
  handleGetGroups,
  handleGetGroupById,
};
