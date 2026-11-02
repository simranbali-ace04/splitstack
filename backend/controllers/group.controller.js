const Group = require("../models/group.model");
const User = require("../models/user.model");

async function handleCreateGroup(req, res) {
  const { name, members } = req.body;
  const createdBy = req.user._id;
  if (!name || !Array.isArray(members)) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const groupMembers = [
      {
        user: createdBy,
        role: "admin",
      },
      ...members.map((member) => ({
        user: member.user ?? member,
        role: "member",
      })),
    ];
    const uniqueMembers = groupMembers.filter(
      (member, index, array) =>
        array.findIndex((m) => m.user.toString() === member.user.toString()) ===
        index,
    );
    const group = new Group({
      name,
      createdBy,
      members: uniqueMembers,
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
    const group = await Group.findById(req.params.id).populate(
      "members.user",
      "name email"
    );
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
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
