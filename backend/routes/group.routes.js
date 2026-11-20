const express = require("express");
const Router = express.Router();
const {
  handleCreateGroup,
  handleGetGroups,
  handleGetGroupById,
  handleAddGroupMembers,
} = require("../controllers/group.controller");
const {
  verifyGroupMember,
  verifyAdmin,
} = require("../middlewares/group.middleware");
const expenseRoutes = require("./expense.routes");

Router.post("/", handleCreateGroup);
Router.get("/", handleGetGroups);
Router.get("/:groupid", verifyGroupMember, handleGetGroupById);
Router.patch(
  "/:groupid/members",
  verifyGroupMember,
  verifyAdmin,
  handleAddGroupMembers,
);

Router.use("/:groupid/expenses", verifyGroupMember, expenseRoutes);

module.exports = Router;
