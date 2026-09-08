/* ============================================================
   WorkToDo — App shell: router, state, boot
   ============================================================ */

const AppState = {
  route: "dashboard",
  search: "",
  priorityFilter: "all",
  statusFilter: "all",
};

function navigate(route) {
  AppState.route = ROUTE_TITLES[route] ? route : "dashboard";
  window.location.hash = "#/" + AppState.route;
  closeMobileSidebar();
  renderApp();
  window.scrollTo(0, 0);
}

function setSearch(val) {
  AppState.search = val;
  rerenderCurrentPage(true);
}
function setPriorityFilter(val) {
  AppState.priorityFilter = val;
  rerenderCurrentPage(true);
}
function setStatusFilter(val) {
  AppState.statusFilter = val;
  rerenderCurrentPage(true);
}

function renderPageContent() {
  const tasks = Store.getTasks();
  const list = filterTasksForRoute(tasks, AppState.route);
  const isDashboard = AppState.route === "dashboard";

  return `
    <div class="page-header">
      <div>
        <h1>${ROUTE_TITLES[AppState.route]}</h1>
        <p class="sub">${list.length} task${list.length === 1 ? "" : "s"}</p>
      </div>
      <button class="btn btn-primary" onclick="openTaskModal()">${icon("plus")} Add Task</button>
    </div>
    ${isDashboard ? kpiRowHtml(tasks) : ""}
    ${toolbarHtml()}
    ${taskListHtml(list)}
  `;
}

function rerenderCurrentPage(skipTopScroll) {
  const contentEl = document.getElementById("pageContent");
  if (!contentEl) return;
  contentEl.innerHTML = renderPageContent();
  renderSidebarActive();
  if (!skipTopScroll) window.scrollTo(0, 0);
}

function renderSidebarActive() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  // Re-rendering replaces the whole element, so the mobile "open" state (a CSS class,
  // not part of AppState) would otherwise be silently dropped on every task action.
  const wasOpen = sidebar.classList.contains("open");
  sidebar.outerHTML = sidebarHtml(AppState.route, Store.getTasks());
  if (wasOpen) {
    const newSidebar = document.getElementById("sidebar");
    if (newSidebar) newSidebar.classList.add("open");
  }
}

function renderApp() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="app-shell">
      ${sidebarHtml(AppState.route, Store.getTasks())}
      <div class="main-col">
        ${topbarHtml()}
        <div class="content" id="pageContent">${renderPageContent()}</div>
      </div>
    </div>
  `;
  const themeIcon = document.getElementById("themeToggleIcon");
  if (themeIcon) themeIcon.innerHTML = isDarkActive() ? icon("sun") : icon("moon");
}

function initFromHash() {
  const hash = window.location.hash.replace("#/", "");
  if (ROUTE_TITLES[hash]) AppState.route = hash;
}

async function boot() {
  applyTheme();
  const root = document.getElementById("app");
  root.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--ink-faint);font-size:13px">Loading your tasks…</div>`;
  try {
    await Store.load();
  } catch (e) {
    root.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;color:var(--red);font-size:13.5px;font-weight:600">${escapeHtml(e.message || "Couldn't load tasks — is the server running?")}</div>`;
    return;
  }
  initFromHash();
  renderApp();
}

window.addEventListener("DOMContentLoaded", boot);

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#/", "");
  if (ROUTE_TITLES[hash] && hash !== AppState.route) {
    AppState.route = hash;
    renderApp();
  }
});
