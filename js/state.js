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

const TASK_FIELDS = ["title", "description", "dueDate", "dueTime", "priority", "status"];

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
    this.tasks = this.tasks.filter((t) => t.id !== id);
    writeTasksToStorage(this.tasks);
  },

  async toggleComplete(id) {
    const task = this.getTask(id);
    if (!task) throw new Error("Task not found");
    task.status = task.status === "Completed" ? "Pending" : "Completed";
    writeTasksToStorage(this.tasks);
    return task;
  },
};
