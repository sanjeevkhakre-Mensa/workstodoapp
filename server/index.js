// WorkToDo backend — one Express server, one JSON file as the "database". No accounts,
// no teams: this is a single-user personal task list, kept as simple as the app itself.

const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4300;
const DB_PATH = path.join(__dirname, "data", "tasks.json");
const PUBLIC_DIR = path.join(__dirname, "..");

let nextIdCounter = 1;
function genId() {
  return "t_" + Date.now().toString(36) + "_" + (nextIdCounter++).toString(36);
}

function loadTasks() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  }
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, "[]");
  return [];
}

let tasks = loadTasks();
function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(tasks, null, 2));
}

const app = express();
app.use(express.json());

const TASK_FIELDS = ["title", "description", "dueDate", "dueTime", "priority", "status", "checklist"];

function findTaskOr404(req, res) {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return null;
  }
  return task;
}

app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const body = req.body || {};
  if (!body.title || !String(body.title).trim()) {
    return res.status(400).json({ error: "Task name is required" });
  }
  const now = new Date().toISOString();
  const task = {
    id: genId(),
    title: String(body.title).trim(),
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "Medium",
    status: "Pending",
    checklist: [],
    createdAt: now,
  };
  TASK_FIELDS.forEach((f) => {
    if (body[f] !== undefined) task[f] = body[f];
  });
  tasks.unshift(task);
  save();
  res.status(201).json(task);
});

app.put("/api/tasks/:id", (req, res) => {
  const task = findTaskOr404(req, res);
  if (!task) return;
  const body = req.body || {};
  if (body.title !== undefined && !String(body.title).trim()) {
    return res.status(400).json({ error: "Task name is required" });
  }
  TASK_FIELDS.forEach((f) => {
    if (body[f] !== undefined) task[f] = body[f];
  });
  save();
  res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const exists = tasks.some((t) => t.id === req.params.id);
  if (!exists) return res.status(404).json({ error: "Task not found" });
  tasks = tasks.filter((t) => t.id !== req.params.id);
  save();
  res.status(204).end();
});

app.post("/api/tasks/:id/toggle-complete", (req, res) => {
  const task = findTaskOr404(req, res);
  if (!task) return;
  task.status = task.status === "Completed" ? "Pending" : "Completed";
  save();
  res.json(task);
});

app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
  console.log(`WorkToDo server running at http://localhost:${PORT}`);
});
