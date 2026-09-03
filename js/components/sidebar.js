/* ============================================================
   WorkToDo — Sidebar + topbar shell components
   ============================================================ */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "today", label: "Today", icon: "today" },
  { key: "upcoming", label: "Upcoming", icon: "upcoming" },
  { key: "overdue", label: "Overdue", icon: "overdue" },
  { key: "completed", label: "Completed", icon: "completed" },
];

function computeNavCounts(tasks) {
  const today = todayYmd();
  return {
    today: tasks.filter((t) => t.status !== "Completed" && t.dueDate === today).length,
    upcoming: tasks.filter((t) => t.status !== "Completed" && t.dueDate > today).length,
    overdue: tasks.filter((t) => computeEffectiveStatus(t) === "Overdue").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  };
}

function sidebarHtml(currentRoute, tasks) {
  const counts = computeNavCounts(tasks);
  return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">W</div>
        <div class="brand-text">WorkToDo</div>
      </div>
      <div class="sidebar-scroll">
        ${NAV_ITEMS.map((item) => {
          const active = currentRoute === item.key;
          const count = counts[item.key];
          return `<div class="nav-link ${active ? "active" : ""}" onclick="navigate('${item.key}')">${icon(item.icon)} ${item.label} ${count ? `<span class="count">${count}</span>` : ""}</div>`;
        }).join("")}
      </div>
    </aside>
  `;
}

function topbarHtml() {
  return `
    <div class="topbar">
      <div class="hamburger" onclick="toggleMobileSidebar()">${icon("menu")}</div>
      <div class="topbar-search">
        ${icon("search")}
        <input type="text" placeholder="Search tasks..." value="${escapeHtml(AppState.search)}" oninput="setSearch(this.value)" />
      </div>
      <div class="icon-btn" onclick="toggleTheme()"><span id="themeToggleIcon"></span></div>
    </div>
  `;
}

function toggleMobileSidebar() {
  const sb = document.getElementById("sidebar");
  if (sb) sb.classList.toggle("open");
}
function closeMobileSidebar() {
  const sb = document.getElementById("sidebar");
  if (sb) sb.classList.remove("open");
}
