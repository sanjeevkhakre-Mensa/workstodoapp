/* ============================================================
   WorkToDo — Dashboard KPI counts row
   ============================================================ */

function kpiRowHtml(tasks) {
  const counts = computeNavCounts(tasks);
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
    </div>`;
}
