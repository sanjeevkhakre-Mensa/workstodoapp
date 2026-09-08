/* ============================================================
   WorkToDo — Task detail drawer: notes, subtasks, quick-edit fields
   ============================================================ */

const DrawerState = { taskId: null, editingTitle: false, editingNotes: false };

function openTaskDrawer(taskId) {
  DrawerState.taskId = taskId;
  DrawerState.editingTitle = false;
  DrawerState.editingNotes = false;
  renderDrawer();
}

function closeTaskDrawer() {
  DrawerState.taskId = null;
  const ov = document.getElementById("drawerOverlay");
  if (ov) ov.remove();
  document.removeEventListener("keydown", drawerEscHandler);
}

function drawerEscHandler(e) {
  if (e.key === "Escape") closeTaskDrawer();
}

function renderDrawer() {
  const task = Store.getTask(DrawerState.taskId);
  let overlay = document.getElementById("drawerOverlay");
  if (!task) {
    if (overlay) overlay.remove();
    return;
  }
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "drawerOverlay";
    overlay.className = "drawer-overlay";
    overlay.onclick = (e) => { if (e.target === overlay) closeTaskDrawer(); };
    document.body.appendChild(overlay);
    document.addEventListener("keydown", drawerEscHandler);
  }

  const eff = computeEffectiveStatus(task);
  const done = task.status === "Completed";
  const checklist = task.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;

  overlay.innerHTML = `
    <div class="drawer" onclick="event.stopPropagation()">
      <div class="drawer-header">
        <div class="task-check ${done ? "done" : ""}" onclick="handleDrawerToggleComplete('${task.id}')">${done ? icon("check") : ""}</div>
        ${
          DrawerState.editingTitle
            ? `<input type="text" id="drawerTitleInput" class="drawer-title-input" value="${escapeHtml(task.title)}"
                 onkeydown="if(event.key==='Enter'){saveDrawerTitle('${task.id}')} else if(event.key==='Escape'){cancelDrawerTitle()}"
                 onblur="saveDrawerTitle('${task.id}')" />`
            : `<h3 class="${done ? "done" : ""}" onclick="startEditDrawerTitle()">${escapeHtml(task.title)}</h3>`
        }
        <div class="icon-btn xs" onclick="closeTaskDrawer()">${icon("x")}</div>
      </div>

      <div class="drawer-body">
        <div class="drawer-quickrow">
          <div class="select-box">
            <select onchange="handleDrawerFieldChange('${task.id}','priority',this.value)">
              ${["Low", "Medium", "High"].map((p) => `<option value="${p}" ${task.priority === p ? "selected" : ""}>${p} priority</option>`).join("")}
            </select>
          </div>
          <div class="select-box">
            <select onchange="handleDrawerFieldChange('${task.id}','status',this.value)">
              <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
            </select>
          </div>
        </div>

        <div class="drawer-section">
          <div class="lbl">Due</div>
          <div class="drawer-date-row">
            <input type="date" value="${task.dueDate || ""}" onchange="handleDrawerFieldChange('${task.id}','dueDate',this.value)" />
            <input type="time" value="${task.dueTime || ""}" onchange="handleDrawerFieldChange('${task.id}','dueTime',this.value)" />
          </div>
          ${eff === "Overdue" ? `<div class="drawer-overdue-flag">${icon("overdue")} Overdue</div>` : ""}
        </div>

        <div class="drawer-section">
          <div class="lbl">Notes</div>
          ${
            DrawerState.editingNotes
              ? `<textarea id="drawerNotesInput" class="drawer-notes-input" placeholder="Add notes...">${escapeHtml(task.description || "")}</textarea>
                 <div class="drawer-notes-actions">
                   <button class="btn btn-ghost btn-sm" onclick="cancelDrawerNotes()">Cancel</button>
                   <button class="btn btn-primary btn-sm" onclick="saveDrawerNotes('${task.id}')">Save</button>
                 </div>`
              : `<div class="drawer-notes-display" onclick="startEditDrawerNotes()">${task.description ? escapeHtml(task.description).replace(/\n/g, "<br>") : '<span class="placeholder">Add notes…</span>'}</div>`
          }
        </div>

        <div class="drawer-section">
          <div class="lbl">Subtasks${checklist.length ? ` (${doneCount}/${checklist.length})` : ""}</div>
          ${checklist.length ? `<div class="progress-track"><div class="progress-fill" style="width:${(doneCount / checklist.length) * 100}%"></div></div>` : ""}
          <div class="checklist">
            ${checklist
              .map(
                (c) => `
              <div class="checklist-item">
                <input type="checkbox" ${c.done ? "checked" : ""} onchange="handleToggleSubtask('${task.id}','${c.id}')" />
                <span class="${c.done ? "done" : ""}">${escapeHtml(c.text)}</span>
                <div class="icon-btn xs" onclick="handleDeleteSubtask('${task.id}','${c.id}')">${icon("x")}</div>
              </div>`
              )
              .join("")}
          </div>
          <div class="subtask-add-row">
            <input type="text" id="newSubtaskInput" placeholder="Add a subtask…"
              onkeydown="if(event.key==='Enter') handleAddSubtask('${task.id}')" />
            <button type="button" class="subtask-add-btn" onclick="handleAddSubtask('${task.id}')">${icon("plus")}</button>
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <button class="btn btn-ghost" onclick="handleDrawerDelete('${task.id}')">${icon("trash")} Delete task</button>
      </div>
    </div>`;

  if (DrawerState.editingTitle) {
    const el = document.getElementById("drawerTitleInput");
    if (el) { el.focus(); el.select(); }
  }
}

function startEditDrawerTitle() {
  DrawerState.editingTitle = true;
  renderDrawer();
}
function cancelDrawerTitle() {
  DrawerState.editingTitle = false;
  renderDrawer();
}
async function saveDrawerTitle(taskId) {
  const input = document.getElementById("drawerTitleInput");
  const val = input.value.trim();
  DrawerState.editingTitle = false;
  if (!val) { renderDrawer(); return; }
  try {
    await Store.updateTask(taskId, { title: val });
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

function startEditDrawerNotes() {
  DrawerState.editingNotes = true;
  renderDrawer();
  const el = document.getElementById("drawerNotesInput");
  if (el) el.focus();
}
function cancelDrawerNotes() {
  DrawerState.editingNotes = false;
  renderDrawer();
}
async function saveDrawerNotes(taskId) {
  const val = document.getElementById("drawerNotesInput").value.trim();
  DrawerState.editingNotes = false;
  try {
    await Store.updateTask(taskId, { description: val });
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

async function handleDrawerFieldChange(taskId, field, value) {
  try {
    await Store.updateTask(taskId, { [field]: value });
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

async function handleDrawerToggleComplete(taskId) {
  try {
    const task = await Store.toggleComplete(taskId);
    showToast(task.status === "Completed" ? "Task marked as completed" : "Task moved back to pending", "success");
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

async function handleAddSubtask(taskId) {
  const input = document.getElementById("newSubtaskInput");
  const val = input.value.trim();
  if (!val) return;
  try {
    await Store.addChecklistItem(taskId, val);
    input.value = "";
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to add subtask", "error");
  }
}

async function handleToggleSubtask(taskId, itemId) {
  try {
    await Store.toggleChecklistItem(taskId, itemId);
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to update subtask", "error");
  }
}

async function handleDeleteSubtask(taskId, itemId) {
  try {
    await Store.deleteChecklistItem(taskId, itemId);
    renderDrawer();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to remove subtask", "error");
  }
}

async function handleDrawerDelete(taskId) {
  const task = Store.getTask(taskId);
  if (!task) return;
  const ok = await confirmDialog({
    title: "Delete this task?",
    message: `"${task.title}" will be removed. You can undo this right after.`,
    confirmLabel: "Delete",
    danger: true,
  });
  if (!ok) return;
  try {
    const result = await Store.deleteTask(taskId);
    closeTaskDrawer();
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
