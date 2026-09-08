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

const MOBILE_NAV_ITEMS = ["dashboard", "today", "upcoming", "completed"];

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
      <div class="sidebar-hint">
        <kbd>Ctrl</kbd><kbd>K</kbd> <span>to search</span>
      </div>
    </aside>
  `;
}

function topbarHtml() {
  return `
    <div class="topbar">
      <div class="hamburger" onclick="toggleMobileSidebar()">${icon("menu")}</div>
      <button type="button" class="topbar-search" onclick="openCommandPalette()">
        ${icon("search")}
        <span>Search tasks…</span>
        <kbd class="topbar-kbd">${icon("command")}K</kbd>
      </button>
      <div class="icon-btn" onclick="toggleTheme()"><span id="themeToggleIcon"></span></div>
    </div>
  `;
}

function mobileNavHtml(currentRoute) {
  return `
    <nav class="mobile-nav">
      ${MOBILE_NAV_ITEMS.map((key) => {
        const item = NAV_ITEMS.find((n) => n.key === key);
        const active = currentRoute === key;
        return `<a class="${active ? "active" : ""}" onclick="navigate('${key}')">${icon(item.icon)}<span>${item.label}</span></a>`;
      }).join("")}
      <a class="mobile-nav-fab" onclick="openTaskModal()">${icon("plus")}</a>
    </nav>`;
}

function toggleMobileSidebar() {
  const sb = document.getElementById("sidebar");
  if (sb) sb.classList.toggle("open");
}
function closeMobileSidebar() {
  const sb = document.getElementById("sidebar");
  if (sb) sb.classList.remove("open");
}
