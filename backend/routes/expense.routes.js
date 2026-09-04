const express = require("express");
const Router = express.Router();
const {
  handleGetAllExpenses,
  handleGetExpenseById,
  handleDeleteExpense,
  handleModifyExpense,
  handleUpdateExpense,
  handleCreateExpense
} = require("../controllers/expense.controller");

Router.route("/")
.get(handleGetAllExpenses)
.post(handleCreateExpense);

Router.route("/:id")
.get(handleGetExpenseById)
.delete(handleDeleteExpense)
.patch(handleModifyExpense)
.put(handleUpdateExpense);

module.exports = Router;