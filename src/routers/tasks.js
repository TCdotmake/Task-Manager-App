const express = require("express");
const router = new express.Router();
const Task = require("../models/tasks");
const auth = require("../middleware/auth");

//task end point
//post task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET tasks/?completed=true
// GET tasks/limit
// Get tasks/sortBy=createdAt_asc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  let createdAt = 1;
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const keyVal = req.query.sortBy.split("_");
    const [key, value] = keyVal;
    if (key === "createdAt") {
      if (value === "desc") {
        sort.createdAt = -1;
      }
    }
  }
  try {
    // await req.user.populate("tasks");
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    const tasks = req.user.tasks;
    if (!tasks) {
      res.status(404).send();
    }
    res.send(tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

//find one task
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    // const task = await Task.findById(id);
    const task = await Task.findOne({ _id, owner: req.user.id });
    if (!task) {
      res.send(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(404).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const acceptableUpdates = ["description", "completed"];
  const accepted = updates.every((update) => {
    return acceptableUpdates.includes(update);
  });

  if (!accepted) {
    return res.status(400).send("Invalid update");
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send("Task id not found");
    }
    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send("Task not found");
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
