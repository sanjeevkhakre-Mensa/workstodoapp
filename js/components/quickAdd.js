/* ============================================================
   WorkToDo — Quick Add: create a task in one field, zero navigation
   ============================================================ */

function quickAddHtml() {
  return `
    <div class="quick-add">
      ${icon("plus")}
      <input type="text" id="quickAddInput" placeholder="Quick add a task and press Enter…"
        onkeydown="if(event.key==='Enter') handleQuickAdd()" />
      <button type="button" class="quick-add-more" onclick="openTaskModal()" data-tooltip="More options">${icon("edit")}</button>
    </div>`;
}

async function handleQuickAdd() {
  const input = document.getElementById("quickAddInput");
  const title = input.value.trim();
  if (!title) return;
  input.disabled = true;
  try {
    await Store.addTask({ title });
    input.value = "";
    showToast("Task added", "success");
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to add task", "error");
  } finally {
    const freshInput = document.getElementById("quickAddInput");
    if (freshInput) { freshInput.disabled = false; freshInput.focus(); }
  }
}
