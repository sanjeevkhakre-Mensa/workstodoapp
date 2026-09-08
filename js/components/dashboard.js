/* ============================================================
   WorkToDo — Dashboard: Today's Focus (hero) + KPI/progress row
   ============================================================ */

function kpiRowHtml(tasks) {
  const counts = computeNavCounts(tasks);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const highPriority = tasks.filter((t) => t.status !== "Completed" && t.priority === "High").length;

  const cards = [
    { key: "today", label: "Today", value: counts.today, tone: "blue", icon: "today" },
    { key: "upcoming", label: "Upcoming", value: counts.upcoming, tone: "amber", icon: "upcoming" },
    { key: "overdue", label: "Overdue", value: counts.overdue, tone: "red", icon: "overdue" },
    { key: "completed", label: "Completed", value: counts.completed, tone: "green", icon: "completed" },
  ];

  return `
    <div class="kpi-grid">
      ${cards
        .map(
          (c) => `
        <div class="kpi-card" onclick="navigate('${c.key}')">
          <div class="kpi-top">
            <span class="kpi-label">${c.label}</span>
            <span class="kpi-icon ${c.tone}">${icon(c.icon)}</span>
          </div>
          <div class="kpi-value">${c.value}</div>
        </div>`
        )
        .join("")}
      <div class="kpi-card kpi-card-wide">
        <div class="kpi-top">
          <span class="kpi-label">High Priority Open</span>
          <span class="kpi-icon red">${icon("flag")}</span>
        </div>
        <div class="kpi-value">${highPriority}</div>
      </div>
      <div class="kpi-card kpi-card-wide">
        <div class="kpi-top">
          <span class="kpi-label">Overall Progress</span>
          <span class="kpi-icon blue">${icon("completed")}</span>
        </div>
        <div class="kpi-value">${progress}%</div>
        <div class="progress-track" style="margin-top:8px"><div class="progress-fill" style="width:${progress}%"></div></div>
      </div>
    </div>`;
}

function todaysFocusHtml(tasks) {
  const today = todayYmd();
  const overdue = tasks.filter((t) => computeEffectiveStatus(t) === "Overdue");
  const dueToday = tasks.filter((t) => t.status !== "Completed" && t.dueDate === today);
  const focusList = [...overdue, ...dueToday].sort((a, b) => (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99"));

  return `
    <div class="focus-card">
      <div class="focus-header">
        <div class="focus-title">${icon("sparkle")} Today's Focus</div>
        <span class="focus-count">${focusList.length} task${focusList.length === 1 ? "" : "s"}</span>
      </div>
      ${
        focusList.length
          ? `<div class="focus-list">${focusList.map(taskRowHtml).join("")}</div>`
          : `<div class="focus-empty">Nothing overdue or due today. Add a task or check Upcoming.</div>`
      }
    </div>`;
}
