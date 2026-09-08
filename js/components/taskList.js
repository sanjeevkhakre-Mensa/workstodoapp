/* ============================================================
   WorkToDo — Task list: filtering, sorting, rows, row actions
   ============================================================ */

const ROUTE_TITLES = {
  dashboard: "Dashboard",
  today: "Today",
  upcoming: "Upcoming",
  overdue: "Overdue",
  completed: "Completed",
};

const ROUTE_EMPTY_COPY = {
  dashboard: { msg: "No tasks yet — add your first one.", icon: "inbox" },
  today: { msg: "Nothing due today. Enjoy the calm.", icon: "today" },
  upcoming: { msg: "Nothing on the horizon yet.", icon: "upcoming" },
  overdue: { msg: "Nothing overdue — you're on top of things.", icon: "completed" },
  completed: { msg: "No completed tasks yet.", icon: "completed" },
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

  const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
  switch (AppState.sort) {
    case "priority":
      list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      break;
    case "title":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "created":
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      break;
    case "dueDate":
    default:
      list.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
      break;
  }
  return list;
}

function toolbarHtml() {
  return `
    <div class="toolbar">
      <div class="select-box">
        <select onchange="setPriorityFilter(this.value)" aria-label="Filter by priority">
          <option value="all" ${AppState.priorityFilter === "all" ? "selected" : ""}>All Priority</option>
          <option value="High" ${AppState.priorityFilter === "High" ? "selected" : ""}>High</option>
          <option value="Medium" ${AppState.priorityFilter === "Medium" ? "selected" : ""}>Medium</option>
          <option value="Low" ${AppState.priorityFilter === "Low" ? "selected" : ""}>Low</option>
        </select>
      </div>
      <div class="select-box">
        <select onchange="setStatusFilter(this.value)" aria-label="Filter by status">
          <option value="all" ${AppState.statusFilter === "all" ? "selected" : ""}>All Status</option>
          <option value="Pending" ${AppState.statusFilter === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Completed" ${AppState.statusFilter === "Completed" ? "selected" : ""}>Completed</option>
        </select>
      </div>
      <div class="select-box" style="margin-left:auto">
        <select onchange="setSort(this.value)" aria-label="Sort tasks">
          <option value="dueDate" ${AppState.sort === "dueDate" ? "selected" : ""}>Sort: Due Date</option>
          <option value="priority" ${AppState.sort === "priority" ? "selected" : ""}>Sort: Priority</option>
          <option value="title" ${AppState.sort === "title" ? "selected" : ""}>Sort: Title A–Z</option>
          <option value="created" ${AppState.sort === "created" ? "selected" : ""}>Sort: Newest first</option>
        </select>
      </div>
    </div>`;
}

function taskListHtml(list, route) {
  if (!list.length) {
    const copy = AppState.search.trim()
      ? { msg: `No tasks match "${AppState.search.trim()}".`, icon: "search" }
      : ROUTE_EMPTY_COPY[route] || ROUTE_EMPTY_COPY.dashboard;
    return `<div class="task-card">${emptyStateHtml(copy.msg, copy.icon, "Add Task", "openTaskModal()")}</div>`;
  }
  return `<div class="task-card">${list.map(taskRowHtml).join("")}</div>`;
}

function taskRowHtml(t) {
  const eff = computeEffectiveStatus(t);
  const done = t.status === "Completed";
  const timeStr = t.dueTime ? fmtTime12(t.dueTime) : "";
  const checklist = t.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;

  return `
    <div class="task-row" onclick="openTaskDrawer('${t.id}')">
      <div class="task-check ${done ? "done" : ""}" onclick="event.stopPropagation(); handleToggleComplete('${t.id}')">${done ? icon("check") : ""}</div>
      <div class="task-main">
        <div class="task-title ${done ? "done" : ""}">${escapeHtml(t.title)}</div>
        ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ""}
        <div class="task-meta ${eff === "Overdue" ? "overdue" : ""}">
          <span>${fmtDateHuman(t.dueDate)}${timeStr ? " · " + timeStr : ""}</span>
          ${checklist.length ? `<span class="task-subtask-count">${icon("checklist")} ${doneCount}/${checklist.length}</span>` : ""}
        </div>
      </div>
      <div class="task-tags">
        <span class="badge ${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority)}</span>
        <span class="badge ${statusBadgeClass(eff)}">${escapeHtml(eff)}</span>
      </div>
      <div class="row-actions" onclick="event.stopPropagation()">
        <div class="icon-btn xs" data-tooltip="Edit" onclick="openTaskDrawer('${t.id}')">${icon("edit")}</div>
        <div class="icon-btn xs" data-tooltip="Delete" onclick="handleDeleteTask('${t.id}')">${icon("trash")}</div>
      </div>
    </div>`;
}

function emptyStateHtml(msg, iconName, btnLabel, onclickAttr) {
  return `
    <div class="empty-state">
      ${icon(iconName || "inbox")}
      <div class="msg">${escapeHtml(msg)}</div>
      ${btnLabel ? `<button class="btn btn-primary btn-sm" onclick="${onclickAttr}">${icon("plus")} ${escapeHtml(btnLabel)}</button>` : ""}
    </div>`;
}

async function handleToggleComplete(id) {
  try {
    const task = await Store.toggleComplete(id);
    showToast(task.status === "Completed" ? "Task marked as completed" : "Task moved back to pending", "success");
    rerenderCurrentPage(true); // keep the user's scroll position — this can happen far down a long list
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

function setSort(val) {
  AppState.sort = val;
  rerenderCurrentPage(true);
}

async function handleDeleteTask(id) {
  const task = Store.getTask(id);
  if (!task) return;
  const ok = await confirmDialog({
    title: "Delete this task?",
    message: `"${task.title}" will be removed. You can undo this right after.`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;
  try {
    const result = await Store.deleteTask(id);
    rerenderCurrentPage(true);
    if (result) {
      showToast("Task deleted", "success", {
        label: "Undo",
        onClick: async () => {
          await Store.restoreTask(result.task, result.index);
          rerenderCurrentPage(true);
          showToast("Task restored", "success");
        },
      });
    }
  } catch (e) {
    showToast(e.message || "Failed to delete task", "error");
  }
}
