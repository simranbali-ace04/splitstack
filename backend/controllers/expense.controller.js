const Expense = require("../models/expense.model");
const mongoose = require("mongoose");

async function handleGetAllExpenses(req, res) {
  try {
    const expenses = await Expense.find({
      group: req.group.id,
    });
    res.setHeader("X-Total-Expenses", expenses.length);
    return res.json(expenses);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching group expenses",
      error: error.message,
    });
  }
}

async function handleGetExpenseById(req, res) {
  try {
    const expense = await Expense.findOne({
      id: req.params.id,
      group: req.group.id,
    });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    return res.status(200).json(expense);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching expense",
      error: error.message,
    });
  }
}

async function handleDeleteExpense(req, res) {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  return res.status(200).json({
    message: "Successfully deleted the expense",
  });
}

async function handleModifyExpense(req, res) {
  const modifyExpense = await Expense.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!modifyExpense)
    return res.status(404).json({ message: "Expense cannot be updated" });
  return res.status(200).json(modifyExpense);
}

async function handleUpdateExpense(req, res) {
  const body = req.body;
  if (
    body.description === undefined ||
    body.amount === undefined ||
    body.paidBy === undefined
  ) {
    return res.status(400).json({
      message: "PUT requires description, amount and paidBy",
    });
  }
  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    {
      description: body.description,
      amount: body.amount,
      paidBy: body.paidBy,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!expense) return res.status(404).json({ message: "Expense not found" });
  return res.status(200).json(expense);
}

async function handleCreateExpense(req, res) {
  try {
    const group = req.group;
    const { description, amount, paidBy, splitAmong, splitType } = req.body;
    if (!description || !amount || !paidBy || !splitAmong?.length) {
      return res.status(400).json({
        message: "Please provide all required expense details",
      });
    }
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number",
      });
    }
    if (!mongoose.isObjectIdOrHexString(paidBy)) {
      return res.status(400).json({ message: "Invalid payer ID" });
    }
    const groupMemberIds = group.members.map((member) =>
      member.user.toString(),
    );
    if (!groupMemberIds.includes(paidBy.toString())) {
      return res.status(400).json({
        message: "Payer is not a member of this group",
      });
    }
    const splitUserIds = splitAmong.map((item) => item.user);

    if (splitUserIds.some((id) => !mongoose.isObjectIdOrHexString(id))) {
      return res.status(400).json({
        message: "Invalid split participant ID",
      });
    }
    if (new Set(splitUserIds.map(String)).size !== splitUserIds.length) {
      return res.status(400).json({
        message: "Duplicate split participants are not allowed",
      });
    }

    const invalidParticipants = splitUserIds.some(
      (id) => !groupMemberIds.includes(id.toString()),
    );

    if (invalidParticipants) {
      return res.status(400).json({
        message: "All split participants must belong to this group",
      });
    }
    const totalShare = splitAmong.reduce((sum, item) => sum + item.share, 0);
    if (
      splitAmong.some(
        (item) => typeof item.share !== "number" || item.share < 0,
      )
    ) {
      return res.status(400).json({
        message: "Split shares cannot be negative or invalid",
      });
    }

    if (Math.abs(totalShare - amount) > 0.001) {
      return res.status(400).json({
        message: "Split shares must add up to the expense amount",
      });
    }

    if (hasUnequalShares) {
      return res.status(400).json({
        message: "All shares must be equal",
      });
    }
    const newExpense = await Expense.create({
      description,
      amount,
      group: group._id,
      paidBy,
      splitAmong,
      splitType: splitType || "equal",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Expense created successfully",
      expense: newExpense,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  handleGetAllExpenses,
  handleGetExpenseById,
  handleDeleteExpense,
  handleModifyExpense,
  handleUpdateExpense,
  handleCreateExpense,
};
