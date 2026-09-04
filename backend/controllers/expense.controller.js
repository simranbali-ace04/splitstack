const Expense = require("../models/expense.model");

async function handleGetAllExpenses(req, res) {
  const expenses = await Expense.find({});
  res.setHeader("X-Total-Expenses", expenses.length);
  return res.json(expenses);
}
async function handleGetExpenseById(req, res) {
  const expense = await Expense.findById(req.params.id);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  return res.status(200).json(expense);
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
    const newExpense = await Expense.create(req.body);
    return res.status(201).json(newExpense);
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
