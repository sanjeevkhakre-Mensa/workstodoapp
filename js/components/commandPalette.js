/* ============================================================
   WorkToDo — Command palette: Ctrl/Cmd+K global search
   ============================================================ */

const PaletteState = { open: false, query: "", activeIndex: 0 };

function paletteMatches() {
  const q = PaletteState.query.trim().toLowerCase();
  const tasks = Store.getTasks();
  if (!q) {
    // No query yet: show what's most relevant to jump to right now.
    return tasks
      .filter((t) => t.status !== "Completed")
      .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
      .slice(0, 8);
  }
  return tasks
    .filter((t) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
    .slice(0, 20);
}

function openCommandPalette() {
  PaletteState.open = true;
  PaletteState.query = "";
  PaletteState.activeIndex = 0;
  renderCommandPalette();
}

function closeCommandPalette() {
  PaletteState.open = false;
  const el = document.getElementById("commandPaletteOverlay");
  if (el) el.remove();
  document.removeEventListener("keydown", paletteKeyHandler);
}

function renderCommandPalette() {
  let overlay = document.getElementById("commandPaletteOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "commandPaletteOverlay";
    overlay.className = "overlay palette-overlay";
    overlay.onclick = (e) => { if (e.target === overlay) closeCommandPalette(); };
    document.body.appendChild(overlay);
    document.addEventListener("keydown", paletteKeyHandler);
  }

  const matches = paletteMatches();
  if (PaletteState.activeIndex >= matches.length) PaletteState.activeIndex = Math.max(0, matches.length - 1);

  overlay.innerHTML = `
    <div class="palette" onclick="event.stopPropagation()">
      <div class="palette-search">
        ${icon("search")}
        <input type="text" id="paletteInput" placeholder="Search tasks…" value="${escapeHtml(PaletteState.query)}"
          oninput="setPaletteQuery(this.value)" />
        <kbd>Esc</kbd>
      </div>
      <div class="palette-results">
        ${
          matches.length
            ? matches
                .map(
                  (t, i) => `
              <div class="palette-item ${i === PaletteState.activeIndex ? "active" : ""}" onclick="handlePaletteSelect('${t.id}')">
                <div class="task-check ${t.status === "Completed" ? "done" : ""}" onclick="event.stopPropagation(); handlePaletteToggle('${t.id}')">${t.status === "Completed" ? icon("check") : ""}</div>
                <div class="palette-item-main">
                  <div class="palette-item-title ${t.status === "Completed" ? "done" : ""}">${escapeHtml(t.title)}</div>
                  <div class="palette-item-meta">${fmtDateHuman(t.dueDate)}</div>
                </div>
                <span class="badge ${priorityBadgeClass(t.priority)}">${escapeHtml(t.priority)}</span>
              </div>`
                )
                .join("")
            : `<div class="palette-empty">No matching tasks.</div>`
        }
      </div>
      <div class="palette-footer">
        <span>↑↓ to navigate</span><span>Enter to open</span>
      </div>
    </div>`;

  const input = document.getElementById("paletteInput");
  if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

function setPaletteQuery(val) {
  PaletteState.query = val;
  PaletteState.activeIndex = 0;
  renderCommandPalette();
}

function paletteKeyHandler(e) {
  if (e.key === "Escape") { closeCommandPalette(); return; }
  const matches = paletteMatches();
  if (e.key === "ArrowDown") {
    e.preventDefault();
    PaletteState.activeIndex = Math.min(PaletteState.activeIndex + 1, matches.length - 1);
    renderCommandPalette();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    PaletteState.activeIndex = Math.max(PaletteState.activeIndex - 1, 0);
    renderCommandPalette();
  } else if (e.key === "Enter") {
    const t = matches[PaletteState.activeIndex];
    if (t) handlePaletteSelect(t.id);
  }
}

function handlePaletteSelect(taskId) {
  closeCommandPalette();
  openTaskDrawer(taskId);
}

async function handlePaletteToggle(taskId) {
  try {
    await Store.toggleComplete(taskId);
    renderCommandPalette();
    rerenderCurrentPage(true);
  } catch (e) {
    showToast(e.message || "Failed to update task", "error");
  }
}

// Global shortcut: Ctrl/Cmd+K opens the palette from anywhere in the app.
document.addEventListener("keydown", (e) => {
  const isK = e.key === "k" || e.key === "K";
  if (isK && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (PaletteState.open) closeCommandPalette();
    else openCommandPalette();
  }
});
