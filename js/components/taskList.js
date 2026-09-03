/* ============================================================
   WorkToDo — Task list: filtering, rows, row actions
   ============================================================ */

const ROUTE_TITLES = {
  dashboard: "Dashboard",
  today: "Today",
  upcoming: "Upcoming",
  overdue: "Overdue",
  completed: "Completed",
};

function filterTasksForRoute(tasks, route) {
  const today = todayYmd();
  let list = tasks.slice();

  switch (route) {
    case "today":
      list = list.filter((t) => t.status !== "Completed" && t.dueDate === today);
      break;
    case "upcoming":
      list = list.filter((t) => t.status !== "Completed" && t.dueDate > today);
      break;
    case "overdue":
      list = list.filter((t) => computeEffectiveStatus(t) === "Overdue");
      break;
    case "completed":
      list = list.filter((t) => t.status === "Completed");
      break;
    default:
      break; // dashboard shows everything, subject to the filters below
  }

  if (AppState.search.trim()) {
    const q = AppState.search.trim().toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q));
  }
  if (AppState.priorityFilter !== "all") {
    list = list.filter((t) => t.priority === AppState.priorityFilter);
  }
  if (AppState.statusFilter !== "all") {
    list = list.filter((t) => t.status === AppState.statusFilter);
  }

  list.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  return list;
}

function toolbarHtml() {
  return `
    <div class="toolbar">
      <div class="select-box">
        <select onchange="setPriorityFilter(this.value)">
          <option value="all" ${AppState.priorityFilter === "all" ? "selected" : ""}>All Priority</option>
          <option value="High" ${AppState.priorityFilter === "High" ? "selected" : ""}>High</option>
          <option value="Medium" ${AppState.priorityFilter === "Medium" ? "selected" : ""}>Medium</option>
          <option value="Low" ${AppState.priorityFilter === "Low" ? "selected" : ""}>Low</option>
        </select>
      </div>
      <div class="select-box">
        <select onchange="setStatusFilter(this.value)">
          <option value="all" ${AppState.statusFilter === "all" ? "selected" : ""}>All Status</option>
          <option value="Pending" ${AppState.statusFilter === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Completed" ${AppState.statusFilter === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </div>
    </div>`;
}

function taskListHtml(list) {
  if (!list.length) {
    return `<div class="task-card">${emptyStateHtml("No tasks here.", "Add Task", "openTaskModal()")}</div>`;
  }
  return `<div class="task-card">${list.map(taskRowHtml).join("")}</div>`;
}

function taskRowHtml(t) {
  const eff = computeEffectiveStatus(t);
  const done = t.status === "Completed";
  const timeStr = t.dueTime ? fmtTime12(t.dueTime) : "";
  return `
    <div class="task-row">
      <div class="task-check ${done ? "done" : ""}" onclick="handleToggleComplete('${t.id}')">${done ? icon("check") : ""}</div>
      <div class="task-main">
        <div class="task-title ${done ? "done" : ""}">${escapeHtml(t.title)}</div>
        ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ""}
        <div class="task-meta ${eff === "Overdue" ? "overdue" : ""}">
          ${fmtDateHuman(t.dueDate)}${timeStr ? " · " + timeStr : ""}
        </div>
      </div>
      <div class="task-tags">
        <span class="badge ${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority)}</span>
        <span class="badge ${statusBadgeClass(eff)}">${escapeHtml(eff)}</span>
      </div>
      <div class="row-actions">
        <div class="icon-btn xs" data-tooltip="Edit" onclick="openTaskModal('${t.id}')">${icon("edit")}</div>
        <div class="icon-btn xs" data-tooltip="Delete" onclick="handleDeleteTask('${t.id}')">${icon("trash")}</div>
      </div>
    </div>`;
}

function emptyStateHtml(msg, btnLabel, onclickAttr) {
  return `
    <div class="empty-state">
      ${icon("inbox")}
      <div class="msg">${escapeHtml(msg)}</div>
      ${btnLabel ? `<button class="btn btn-primary btn-sm" onclick="${onclickAttr}">${icon("plus")} ${escapeHtml(btnLabel)}</button>` : ""}
    </div>`;
}

async function handleToggleComplete(id) {
  try {
    const task = await Store.toggleComplete(id);
    showToast(task.status === "Completed" ? "Task marked as completed" : "Task moved back to pending", "success");
    rerenderCurrentPage();
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

async function handleDeleteTask(id) {
  if (!confirm("Delete this task? This cannot be undone.")) return;
  try {
    await Store.deleteTask(id);
    showToast("Task deleted", "success");
    rerenderCurrentPage();
  } catch (e) {
    showToast(e.message || "Failed to delete task", "error");
  }
}
