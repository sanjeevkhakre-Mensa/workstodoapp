/* ============================================================
   WorkToDo — Add Task modal (full-detail creation)

   Editing an existing task happens in the task drawer (js/components/
   taskDrawer.js) instead — one edit surface, not two. This modal is
   create-only: the fast path for capturing a task with more than just
   a title (due date/time, priority) without leaving the current page.
   ============================================================ */

function openTaskModal() {
  const t = { title: "", dueDate: "", dueTime: "", priority: "Medium" };

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "taskModalOverlay";
  overlay.onclick = (e) => { if (e.target === overlay) closeTaskModal(); };

  overlay.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3>Add Task</h3>
        <div class="icon-btn xs" onclick="closeTaskModal()">${icon("x")}</div>
      </div>
      <div class="modal-body">
        <div class="form-field">
          <label>Task Name</label>
          <input type="text" id="f_title" placeholder="e.g. Send weekly report" value="${escapeHtml(t.title)}" autofocus />
        </div>
        <div class="form-field">
          <label>Notes (optional)</label>
          <textarea id="f_description" placeholder="Add more detail"></textarea>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label>Due Date</label>
            <input type="date" id="f_dueDate" value="${t.dueDate}" />
          </div>
          <div class="form-field">
            <label>Due Time (optional)</label>
            <input type="time" id="f_dueTime" value="${t.dueTime}" />
          </div>
        </div>
        <div class="form-field">
          <label>Priority</label>
          <div class="priority-picker" id="f_priority_picker">
            ${["Low", "Medium", "High"]
              .map((p) => `<div class="priority-opt sel-${p.toLowerCase()} ${t.priority === p ? "selected" : ""}" data-val="${p}" onclick="selectPriorityOpt('${p}')">${p}</div>`)
              .join("")}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeTaskModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitTaskModal()">Add Task</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.addEventListener("keydown", modalEscHandler);
  setTimeout(() => document.getElementById("f_title") && document.getElementById("f_title").focus(), 30);
}

function modalEscHandler(e) {
  if (e.key === "Escape") closeTaskModal();
}

function selectPriorityOpt(val) {
  document.querySelectorAll("#f_priority_picker .priority-opt").forEach((el) => {
    el.classList.toggle("selected", el.dataset.val === val);
  });
}

function getSelectedPriority() {
  const sel = document.querySelector("#f_priority_picker .priority-opt.selected");
  return sel ? sel.dataset.val : "Medium";
}

function closeTaskModal() {
  const overlay = document.getElementById("taskModalOverlay");
  if (overlay) overlay.remove();
  document.removeEventListener("keydown", modalEscHandler);
}

async function submitTaskModal() {
  const title = document.getElementById("f_title").value.trim();
  if (!title) {
    showToast("Task name is required", "error");
    document.getElementById("f_title").focus();
    return;
  }

  const patch = {
    title,
    description: document.getElementById("f_description").value.trim(),
    dueDate: document.getElementById("f_dueDate").value,
    dueTime: document.getElementById("f_dueTime").value,
    priority: getSelectedPriority(),
  };

  const saveBtn = document.querySelector("#taskModalOverlay .modal-footer .btn-primary");
  if (saveBtn) saveBtn.disabled = true;

  try {
    await Store.addTask(patch);
    showToast("Task added", "success");
    closeTaskModal();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to save task", "error");
    if (saveBtn) saveBtn.disabled = false;
  }
}
