const express = require("express");
const Router = express.Router();
const {
  handleCreateGroup,
  handleGetGroups,
  handleGetGroupById,
  handleAddGroupMembers,
} = require("../controllers/group.controller");
const { verifyGroupMember, verifyAdmin } = require("../middlewares/group.middleware");

Router.post("/", handleCreateGroup);
Router.get("/", handleGetGroups);
Router.get("/:groupid", verifyGroupMember, handleGetGroupById);
Router.patch("/:groupid/members", verifyGroupMember, verifyAdmin, handleAddGroupMembers);

module.exports = Router;
