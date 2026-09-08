/* ============================================================
   WorkToDo — App shell: router, state, boot
   ============================================================ */

const AppState = {
  route: "dashboard",
  search: "",
  priorityFilter: "all",
  statusFilter: "all",
  sort: "dueDate",
};

function navigate(route) {
  AppState.route = ROUTE_TITLES[route] ? route : "dashboard";
  window.location.hash = "#/" + AppState.route;
  closeMobileSidebar();
  closeTaskDrawer();
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
    ${quickAddHtml()}
    ${isDashboard ? todaysFocusHtml(tasks) : ""}
    ${isDashboard ? kpiRowHtml(tasks) : ""}
    ${isDashboard ? `<h2 class="section-heading">All Tasks</h2>` : ""}
    ${toolbarHtml()}
    ${taskListHtml(list, AppState.route)}
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
  const mobileNav = document.querySelector(".mobile-nav");
  if (mobileNav) mobileNav.outerHTML = mobileNavHtml(AppState.route);
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
    ${mobileNavHtml(AppState.route)}
  `;
  const themeIcon = document.getElementById("themeToggleIcon");
  if (themeIcon) themeIcon.innerHTML = isDarkActive() ? icon("sun") : icon("moon");
}

function initFromHash() {
  const hash = window.location.hash.replace("#/", "");
  if (ROUTE_TITLES[hash]) AppState.route = hash;
}

function loadingScreenHtml() {
  return `
    <div class="boot-screen">
      <div class="boot-mark">W</div>
      <div class="boot-spinner"></div>
      <div class="boot-label">Loading your tasks…</div>
    </div>`;
}

async function boot() {
  applyTheme();
  const root = document.getElementById("app");
  root.innerHTML = loadingScreenHtml();
  try {
    await Store.load();
  } catch (e) {
    root.innerHTML = `<div class="boot-screen"><div class="boot-mark" style="background:var(--red)">!</div><div class="boot-label" style="color:var(--red);max-width:320px;text-align:center">${escapeHtml(e.message || "Couldn't load tasks — is the server running?")}</div></div>`;
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
    closeTaskDrawer();
    renderApp();
  }
});
