/* ============================================================
   WorkToDo — Store: tasks persisted in the browser's localStorage

   This is a static, backend-free build (for GitHub Pages and similar static
   hosts, which can't run a server). Every method still returns a Promise so
   the rest of the app (which awaits them) didn't need to change at all —
   only where the data actually lives changed.
   ============================================================ */

const STORAGE_KEY = "worktodo_tasks_v1";

let nextIdCounter = 1;
function genId() {
  return "t_" + Date.now().toString(36) + "_" + (nextIdCounter++).toString(36);
}

function readTasksFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeTasksToStorage(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

const TASK_FIELDS = ["title", "description", "dueDate", "dueTime", "priority", "status", "checklist"];

function genChecklistId() {
  return "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
}

const Store = {
  tasks: [],

  async load() {
    this.tasks = readTasksFromStorage();
    return this.tasks;
  },

  getTasks() {
    return this.tasks;
  },

  getTask(id) {
    return this.tasks.find((t) => t.id === id);
  },

  async addTask(patch) {
    if (!patch || !patch.title || !String(patch.title).trim()) {
      throw new Error("Task name is required");
    }
    const task = {
      id: genId(),
      title: String(patch.title).trim(),
      description: "",
      dueDate: "",
      dueTime: "",
      priority: "Medium",
      status: "Pending",
      checklist: [],
      createdAt: new Date().toISOString(),
    };
    TASK_FIELDS.forEach((f) => {
      if (patch[f] !== undefined) task[f] = patch[f];
    });
    this.tasks.unshift(task);
    writeTasksToStorage(this.tasks);
    return task;
  },

  async updateTask(id, patch) {
    const task = this.getTask(id);
    if (!task) throw new Error("Task not found");
    if (patch.title !== undefined && !String(patch.title).trim()) {
      throw new Error("Task name is required");
    }
    TASK_FIELDS.forEach((f) => {
      if (patch[f] !== undefined) task[f] = patch[f];
    });
    writeTasksToStorage(this.tasks);
    return task;
  },

  async deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const [removed] = this.tasks.splice(index, 1);
    writeTasksToStorage(this.tasks);
    return { task: removed, index };
  },

  // Undo for deleteTask — reinserts at the same position so list order feels stable.
  async restoreTask(task, index) {
    const at = Math.min(index, this.tasks.length);
    this.tasks.splice(at, 0, task);
    writeTasksToStorage(this.tasks);
    return task;
  },

  async toggleComplete(id) {
    const task = this.getTask(id);
    if (!task) throw new Error("Task not found");
    task.status = task.status === "Completed" ? "Pending" : "Completed";
    writeTasksToStorage(this.tasks);
    return task;
  },

  async addChecklistItem(taskId, text) {
    const task = this.getTask(taskId);
    if (!task) throw new Error("Task not found");
    if (!task.checklist) task.checklist = [];
    task.checklist.push({ id: genChecklistId(), text: String(text).trim(), done: false });
    writeTasksToStorage(this.tasks);
    return task;
  },

  async toggleChecklistItem(taskId, itemId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error("Task not found");
    const item = (task.checklist || []).find((c) => c.id === itemId);
    if (item) item.done = !item.done;
    writeTasksToStorage(this.tasks);
    return task;
  },

  async deleteChecklistItem(taskId, itemId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error("Task not found");
    task.checklist = (task.checklist || []).filter((c) => c.id !== itemId);
    writeTasksToStorage(this.tasks);
    return task;
  },
};
