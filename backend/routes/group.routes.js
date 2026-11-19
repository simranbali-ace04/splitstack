const express = require("express");
const Router = express.Router();
const {
  handleCreateGroup,
  handleGetGroups,
  handleGetGroupById,
  handleAddGroupMembers,
} = require("../controllers/group.controller");

Router.post("/", handleCreateGroup);
Router.get("/", handleGetGroups);
Router.get("/:groupid", handleGetGroupById);
Router.patch("/:groupid/members", handleAddGroupMembers);

module.exports = Router;
