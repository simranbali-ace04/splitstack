const Expense = require("../models/expense.model");
const mongoose = require("mongoose");

async function handleGetAllExpenses(req, res) {
  try {
    const expenses = await Expense.find({
      group: req.group._id,
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
      _id: req.params.id,
      group: req.group._id,
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
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      group: req.group._id,
    });
    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }
    return res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting expense",
      error: error.message,
    });
  }
}

async function handleModifyExpense(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;

    const allowedFields = [
      "description",
      "amount",
      "paidBy",
      "splitAmong",
      "splitType",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    const expense = await Expense.findOne({
      _id: id,
      group: req.group._id,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    const finalAmount =
      updates.amount !== undefined ? updates.amount : expense.amount;

    const finalSplitType =
      updates.splitType !== undefined ? updates.splitType : expense.splitType;

    const finalSplitAmong =
      updates.splitAmong !== undefined
        ? updates.splitAmong
        : expense.splitAmong;

    if (updates.description !== undefined) {
      if (
        typeof updates.description !== "string" ||
        !updates.description.trim()
      ) {
        return res.status(400).json({
          message: "Description cannot be empty",
        });
      }

      updates.description = updates.description.trim();
    }

    if (
      typeof finalAmount !== "number" ||
      !Number.isFinite(finalAmount) ||
      finalAmount <= 0
    ) {
      return res.status(400).json({
        message: "Amount must be a valid positive number",
      });
    }

    if (!["equal", "unequal"].includes(finalSplitType)) {
      return res.status(400).json({
        message: "Split type must be equal or unequal",
      });
    }

    const groupMemberIds = req.group.members.map((member) =>
      member.user.toString(),
    );

    const finalPaidBy =
      updates.paidBy !== undefined ? updates.paidBy : expense.paidBy;

    if (!mongoose.isObjectIdOrHexString(finalPaidBy)) {
      return res.status(400).json({
        message: "Invalid payer ID",
      });
    }

    if (!groupMemberIds.includes(finalPaidBy.toString())) {
      return res.status(400).json({
        message: "Payer must be a member of this group",
      });
    }

    if (!Array.isArray(finalSplitAmong) || finalSplitAmong.length === 0) {
      return res.status(400).json({
        message: "At least one split participant is required",
      });
    }

    for (const item of finalSplitAmong) {
      if (
        !item ||
        !mongoose.isObjectIdOrHexString(item.user) ||
        typeof item.share !== "number" ||
        !Number.isFinite(item.share) ||
        item.share < 0
      ) {
        return res.status(400).json({
          message:
            "Each split must have a valid user ID and non-negative share",
        });
      }
    }

    const splitUserIds = finalSplitAmong.map((item) => item.user.toString());

    const uniqueSplitUserIds = new Set(splitUserIds);

    if (uniqueSplitUserIds.size !== splitUserIds.length) {
      return res.status(400).json({
        message: "Duplicate split participants are not allowed",
      });
    }

    const allParticipantsAreMembers = splitUserIds.every((userId) =>
      groupMemberIds.includes(userId),
    );

    if (!allParticipantsAreMembers) {
      return res.status(400).json({
        message: "All split participants must belong to this group",
      });
    }

    if (finalSplitType === "equal") {
      if (updates.amount !== undefined) {
        const totalPaise = Math.round(finalAmount * 100);

        const baseShare = Math.floor(totalPaise / finalSplitAmong.length);

        const remainder = totalPaise % finalSplitAmong.length;

        updates.splitAmong = finalSplitAmong.map((item, index) => ({
          user: item.user,
          share: (baseShare + (index < remainder ? 1 : 0)) / 100,
        }));
      } else {
        const totalPaise = Math.round(finalAmount * 100);

        const baseShare = Math.floor(totalPaise / finalSplitAmong.length);

        const remainder = totalPaise % finalSplitAmong.length;

        const expectedShares = finalSplitAmong.map(
          (item, index) => (baseShare + (index < remainder ? 1 : 0)) / 100,
        );

        const hasInvalidShares = finalSplitAmong.some(
          (item, index) => Math.abs(item.share - expectedShares[index]) > 0.001,
        );

        if (hasInvalidShares) {
          return res.status(400).json({
            message:
              "All shares must be equal and add up to the expense amount",
          });
        }
      }
    }

    if (finalSplitType === "unequal") {
      const totalShare = finalSplitAmong.reduce(
        (sum, item) => sum + item.share,
        0,
      );

      if (Math.abs(totalShare - finalAmount) > 0.001) {
        return res.status(400).json({
          message: "Total split shares must equal the expense amount",
        });
      }
    }

    if (updates.paidBy !== undefined) {
      updates.paidBy = finalPaidBy;
    }

    Object.assign(expense, updates);

    await expense.save();

    return res.status(200).json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Error modifying expense:", error);

    return res.status(500).json({
      message: "Error updating expense",
      error: error.message,
    });
  }
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
