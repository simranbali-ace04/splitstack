const express = require("express");
const Router = express.Router();
const {
  handleCreateGroup,
  handleGetGroups,
  handleGetGroupById,
} = require("../controllers/group.controller");

Router.post("/", handleCreateGroup);
Router.get("/", handleGetGroups);
Router.get("/:groupid", handleGetGroupById);

module.exports = Router;
