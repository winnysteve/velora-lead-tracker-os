import {
  dailyTasks,
  ecommerceMetrics,
  learningNotes,
  pipeline,
  roadmap,
  salesMetrics,
  skills,
  weeklyMetrics
} from "./seedData.js";

const STORAGE_KEY = "kos-dashboard-v2";
const BEIRUT_TIME_ZONE = "Asia/Beirut";

const defaultData = {
  hiddenWidgets: [],
  mission: {
    eyebrow: "Summer operating target",
    title: "Cash, proof, lessons.",
    body: "3 clients, one controlled ecommerce test, and one professional marketing lesson captured per company day.",
    stats: [
      { label: "Calls", value: "300" },
      { label: "Clients", value: "3" },
      { label: "Ad cap", value: "$150" }
    ]
  },
  dailyTasks,
  pipeline,
  ecommerceMetrics,
  learningNotes,
  weeklyMetrics,
  salesMetrics,
  skills,
  roadmap,
  customTodayWidgets: [
    {
      id: "today-custom-1",
      type: "table",
      title: "Custom Table",
      meta: "editable",
      rows: [
        { label: "Offer angle", value: "Booking-focused website" },
        { label: "Next prospect", value: "Clinic / salon owner" },
        { label: "Follow-up rule", value: "24h, 3d, 7d" }
      ]
    }
  ],
  reflections: {
    template: {
      pipeline: [
        { label: "Wins", value: "1" },
        { label: "Lessons", value: "1" },
        { label: "Avoidance", value: "0" }
      ],
      notes: [
        { label: "What happened?", value: "Write the truth, not the story." },
        { label: "What did I learn?", value: "Capture one decision rule." },
        { label: "What changes tomorrow?", value: "Pick one leverage move." }
      ],
      table: [
        { label: "Energy", value: "7/10" },
        { label: "Sales reps", value: "5 calls" },
        { label: "Main bottleneck", value: "Follow-up clarity" }
      ],
      customWidgets: []
    },
    byDate: {}
  }
};

const state = {
  data: loadData(),
  activeView: "today",
  checkedTasks: new Set(loadStoredArray("checkedTasks", ["call-1", "learn-1"])),
  checkedSkills: new Set(loadStoredArray("checkedSkills", ["skill-ai", "skill-dm"])),
  selectedDay: { month: "June", day: 1 },
  winnyOpen: false,
  editModal: null,
  editDraft: null,
  reflectionNotice: false,
  reply: "",
  status: "",
  message: "What is my highest leverage move today?",
  voice: "Kore",
  audio: null
};

const navItems = [
  { id: "today", label: "Today", icon: "O" },
  { id: "calendar", label: "Calendar", icon: "<>" },
  { id: "skills", label: "Skills", icon: "/" },
  { id: "metrics", label: "Metrics", icon: "^" },
  { id: "reflect", label: "Reflect", icon: "R" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return mergeData(clone(defaultData), stored || {});
  } catch {
    return clone(defaultData);
  }
}

function mergeData(base, stored) {
  for (const [key, value] of Object.entries(stored || {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      base[key] = mergeData(base[key], value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

function loadStoredArray(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(`kos-${key}`) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  localStorage.setItem("kos-checkedTasks", JSON.stringify([...state.checkedTasks]));
  localStorage.setItem("kos-checkedSkills", JSON.stringify([...state.checkedSkills]));
}

function todayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BEIRUT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function beirutTimeParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BEIRUT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function ensureTodayReflection() {
  const key = todayKey();
  if (!state.data.reflections.byDate[key]) {
    state.data.reflections.byDate[key] = clone(state.data.reflections.template);
    saveData();
  }
  if (!state.data.reflections.byDate[key].customWidgets) {
    state.data.reflections.byDate[key].customWidgets = [];
  }
  return state.data.reflections.byDate[key];
}

function dashboardContext() {
  return {
    dashboardData: state.data,
    activeView: state.activeView,
    todayTasks: state.data.dailyTasks.map((task) => ({ ...task, done: state.checkedTasks.has(task.id) })),
    checkedSkills: state.data.skills.filter((skill) => state.checkedSkills.has(skill.id)).map((skill) => skill.title),
    selectedDay: state.selectedDay,
    availableEditActions: [
      "set:data.path.to.value",
      "append:data.path.to.array",
      "replace:data.path.to.array",
      "delete:data.path.to.array.index"
    ]
  };
}

function html(strings, ...values) {
  return strings.reduce((output, string, index) => output + string + (values[index] ?? ""), "");
}

function render() {
  document.getElementById("root").innerHTML = html`
    <div class="app-shell">
      ${background()}
      <main class="dashboard">
        ${header()}
        ${view()}
      </main>
      ${bottomNav()}
      ${winnyDrawer()}
      ${editModal()}
      ${reflectionNotice()}
    </div>
  `;
  bindEvents();
}

function background() {
  return html`
    <div class="background" aria-hidden="true">
      <span class="orbit orbit-one"></span>
      <span class="orbit orbit-two"></span>
      <span class="orbit orbit-three"></span>
      <span class="pulse-dot dot-one"></span>
      <span class="pulse-dot dot-two"></span>
      <span class="pulse-dot dot-three"></span>
    </div>
  `;
}

function header() {
  return html`
    <header class="topbar">
      <div>
        <p class="micro">Saturday · May 30</p>
        <h1>KOS 2026</h1>
      </div>
      <button class="winny-button" data-action="open-winny">
        <span class="spark">+</span>
        Winny AI
      </button>
    </header>
  `;
}

function view() {
  if (state.activeView === "calendar") return calendarView();
  if (state.activeView === "skills") return skillsView();
  if (state.activeView === "metrics") return metricsView();
  if (state.activeView === "reflect") return reflectView();
  return todayView();
}

function widget(content, className = "", editConfig = null) {
  if (editConfig?.id && state.data.hiddenWidgets.includes(editConfig.id)) return "";
  const widgetTools = editConfig
    ? `<div class="widget-tools">
        <button class="edit-pencil" title="Edit widget" data-action="edit" data-edit='${escapeAttr(JSON.stringify(editConfig))}'>edit</button>
        <button class="delete-widget" title="Delete widget" data-action="delete-widget" data-id="${escapeAttr(editConfig.id)}">delete</button>
      </div>`
    : "";
  return `<article class="widget ${className}">${widgetTools}${content}</article>`;
}

function widgetTitle(title, meta) {
  return html`<div class="widget-title"><h2>${escapeHtml(title)}</h2><span>${escapeHtml(meta)}</span></div>`;
}

function todayView() {
  const completed = state.data.dailyTasks.filter((task) => state.checkedTasks.has(task.id)).length;
  return html`
    <section class="view-grid">
      ${widget(html`
        <p class="micro">${escapeHtml(state.data.mission.eyebrow)}</p>
        <h2>${escapeHtml(state.data.mission.title)}</h2>
        <p class="muted">${escapeHtml(state.data.mission.body)}</p>
        <div class="mission-stats">
          ${state.data.mission.stats.map((item) => metricPill(item.label, item.value)).join("")}
        </div>
      `, "mission-card", editConfig("Mission", "data.mission", "mission", "mission"))}

      ${widget(html`
        ${widgetTitle("Daily Tasks", `${completed}/${state.data.dailyTasks.length} done`)}
        <div class="task-list">
          ${state.data.dailyTasks.map((task) => taskRow(task)).join("")}
        </div>
      `, "", editConfig("Daily Tasks", "data.dailyTasks", "tasks", "daily-tasks"))}

      ${metricWidget("Service Pipeline", "client acquisition", "data.pipeline", state.data.pipeline)}
      ${metricWidget("Meta Ads Test", "UTM tracked", "data.ecommerceMetrics", state.data.ecommerceMetrics)}
      ${notesWidget("Marketing Team Notes", "daily capture", "data.learningNotes", state.data.learningNotes)}
      ${state.data.customTodayWidgets.map((custom, index) => customWidget(custom, `data.customTodayWidgets.${index}`, "Today Custom Widget")).join("")}
      ${widget(html`
        ${widgetTitle("Add Today Widget", "editable")}
        <button class="primary-button slim" data-action="add-custom" data-target="today">Add table / notes / pipeline</button>
      `)}
    </section>
  `;
}

function taskRow(task) {
  const done = state.checkedTasks.has(task.id);
  return html`
    <button class="task-row ${done ? "is-done" : ""}" data-action="toggle-task" data-id="${escapeAttr(task.id)}">
      <span class="checkbox">${done ? "✓" : ""}</span>
      <span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.detail)}</small></span>
    </button>
  `;
}

function calendarView() {
  const selectedMonth = state.data.roadmap.find((month) => month.name === state.selectedDay.month);
  const selectedTasks = selectedMonth?.tasks[state.selectedDay.day] || ["Review plan", "Protect sleep"];
  return html`
    <section class="calendar-layout">
      ${widget(html`
        ${widgetTitle("2026 Calendar", "June → December")}
        <div class="months-grid">
          ${state.data.roadmap.map((month) => monthCard(month)).join("")}
        </div>
      `, "", editConfig("2026 Calendar", "data.roadmap", "calendar", "calendar"))}
      ${widget(html`
        ${widgetTitle(`${state.selectedDay.month} ${state.selectedDay.day}`, "selected day")}
        <div class="task-list compact">
          ${selectedTasks.map((task) => html`
            <div class="task-row static">
              <span class="checkbox mini"></span>
              <span><strong>${escapeHtml(task)}</strong><small>${escapeHtml(selectedMonth?.focus || "")}</small></span>
            </div>
          `).join("")}
        </div>
      `, "sticky-detail", editConfig(`${state.selectedDay.month} ${state.selectedDay.day}`, selectedDayPath(), "taskList", "selected-day"))}
    </section>
  `;
}

function selectedDayPath() {
  const monthIndex = state.data.roadmap.findIndex((month) => month.name === state.selectedDay.month);
  return `data.roadmap.${monthIndex}.tasks.${state.selectedDay.day}`;
}

function monthCard(month) {
  const days = Array.from({ length: month.days }, (_, index) => index + 1);
  return html`
    <article class="month-card">
      <div class="month-head"><h3>${escapeHtml(month.name)}</h3><span>${escapeHtml(month.focus)}</span></div>
      <div class="day-grid">
        ${days.map((day) => {
          const isSelected = state.selectedDay.month === month.name && state.selectedDay.day === day;
          const dots = month.dots[day % month.dots.length] || ["review", "health"];
          return html`
            <button class="day-cell ${isSelected ? "is-selected" : ""}" data-action="select-day" data-month="${escapeAttr(month.name)}" data-day="${day}">
              <span>${day}</span>
              <i class="dot ${escapeAttr(dots[0])}"></i>
              <i class="dot ${escapeAttr(dots[1])}"></i>
            </button>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function skillsView() {
  return html`
    <section class="view-grid">
      ${widget(html`
        <p class="micro">Ranked skill stack</p>
        <h2>Sell outcomes. Build proof. Compound systems.</h2>
        <p class="muted">Check only skills you practiced this week, not skills you merely watched videos about.</p>
      `, "mission-card")}
      ${widget(html`
        ${widgetTitle("Skills Checklist", `${state.checkedSkills.size}/${state.data.skills.length} active`)}
        <div class="skills-list">
          ${state.data.skills.map((skill, index) => skillRow(skill, index)).join("")}
        </div>
      `, "", editConfig("Skills Checklist", "data.skills", "skills", "skills"))}
    </section>
  `;
}

function skillRow(skill, index) {
  return html`
    <button class="skill-row ${state.checkedSkills.has(skill.id) ? "is-done" : ""}" data-action="toggle-skill" data-id="${escapeAttr(skill.id)}">
      <span class="rank">${String(index + 1).padStart(2, "0")}</span>
      <span class="skill-copy"><strong>${escapeHtml(skill.title)}</strong><small>${escapeHtml(skill.path)}</small></span>
      <span class="skill-level">${escapeHtml(skill.level)}</span>
    </button>
  `;
}

function metricsView() {
  return html`
    <section class="view-grid">
      ${widget(html`
        ${widgetTitle("Weekly Scorecard", "operator metrics")}
        <div class="score-grid">
          ${state.data.weeklyMetrics.map((metric) => html`
            <div class="score-card">
              <span>${escapeHtml(metric.label)}</span>
              <strong>${escapeHtml(metric.value)}</strong>
              <div class="bar"><i style="width: ${Number(metric.progress) || 0}%"></i></div>
            </div>
          `).join("")}
        </div>
      `, "", editConfig("Weekly Scorecard", "data.weeklyMetrics", "scorecard", "weekly-scorecard"))}
      ${metricWidget("Sales Ratios", "feedback loops", "data.salesMetrics", state.data.salesMetrics)}
    </section>
  `;
}

function reflectView() {
  const key = todayKey();
  const reflection = ensureTodayReflection();
  return html`
    <section class="view-grid">
      ${widget(html`
        <p class="micro">Daily reflection</p>
        <h2>${escapeHtml(key)}</h2>
        <p class="muted">Capture the truth at 10:00 PM Beirut time: what happened, what changed, and what tomorrow needs.</p>
      `, "mission-card")}
      ${metricWidget("Reflection Pipeline", "daily close", `data.reflections.byDate.${key}.pipeline`, reflection.pipeline)}
      ${notesWidget("Reflection Notes", "10 PM review", `data.reflections.byDate.${key}.notes`, reflection.notes)}
      ${metricWidget("Reflection Table", "editable", `data.reflections.byDate.${key}.table`, reflection.table)}
      ${(reflection.customWidgets || []).map((custom, index) => customWidget(custom, `data.reflections.byDate.${key}.customWidgets.${index}`, "Reflection Custom Widget")).join("")}
      ${widget(html`
        ${widgetTitle("Add Reflection Widget", "editable")}
        <button class="primary-button slim" data-action="add-custom" data-target="reflect">Add table / notes / pipeline</button>
      `)}
    </section>
  `;
}

function metricWidget(title, meta, path, rows) {
  return widget(html`
    ${widgetTitle(title, meta)}
    <div class="metric-stack">
      ${(rows || []).map((item) => splitRow(item.label, item.value)).join("")}
    </div>
  `, "", editConfig(title, path, "rows", path));
}

function notesWidget(title, meta, path, rows) {
  return widget(html`
    ${widgetTitle(title, meta)}
    <div class="note-list">
      ${(rows || []).map((note) => html`
        <div class="note-row"><span>${escapeHtml(note.label)}</span><p>${escapeHtml(note.value)}</p></div>
      `).join("")}
    </div>
  `, "", editConfig(title, path, "rows", path));
}

function customWidget(custom, path, fallbackTitle) {
  const title = custom.title || fallbackTitle;
  if (custom.type === "notes") {
    return widget(html`
      ${widgetTitle(title, custom.meta || "custom")}
      <div class="note-list">
        ${(custom.rows || []).map((note) => html`
          <div class="note-row"><span>${escapeHtml(note.label)}</span><p>${escapeHtml(note.value)}</p></div>
        `).join("")}
      </div>
    `, "", editConfig(title, path, "customWidget", path));
  }
  if (custom.type === "pipeline") {
    return widget(html`
      ${widgetTitle(title, custom.meta || "custom")}
      <div class="pipeline-grid">
        ${(custom.rows || []).map((item) => metricBlock(item.label, item.value)).join("")}
      </div>
    `, "", editConfig(title, path, "customWidget", path));
  }
  return widget(html`
    ${widgetTitle(title, custom.meta || "custom")}
    <div class="metric-stack">
      ${(custom.rows || []).map((item) => splitRow(item.label, item.value)).join("")}
    </div>
  `, "", editConfig(title, path, "customWidget", path));
}

function editConfig(title, path, type, id = path) {
  return { title, path, type, id };
}

function winnyDrawer() {
  return html`
    <div class="drawer-layer ${state.winnyOpen ? "is-open" : ""}" aria-hidden="${!state.winnyOpen}">
      <button class="drawer-scrim" data-action="close-winny" tabindex="${state.winnyOpen ? 0 : -1}"></button>
      <aside class="winny-drawer">
        <div class="drawer-handle"></div>
        <div class="winny-head">
          <div>
            <p class="micro">Strategic assistant with edit access</p>
            <h2>Winny AI</h2>
          </div>
          <button class="icon-button" data-action="close-winny">x</button>
        </div>
        <form class="winny-form" data-action="ask-winny">
          <textarea rows="4" name="message" placeholder="Ask Winny to analyze or edit tasks, skills, calendar, ads, notes, reflections...">${escapeHtml(state.message)}</textarea>
          <button class="primary-button" type="button" data-action="ask-winny-click">Ask / Edit With Winny</button>
        </form>
        <div class="key-setup">
          <p class="micro">Gemini setup</p>
          <div class="key-row">
            <input type="password" data-role="gemini-key" placeholder="Paste Gemini API key once" />
            <button type="button" data-action="save-gemini-key">Save key</button>
          </div>
          <small>Your key is saved only to the local server .env file.</small>
        </div>
        ${state.reply ? html`
          <div class="winny-reply">
            <pre>${escapeHtml(state.reply)}</pre>
            <div class="voice-row">
              <select name="voice" data-action="voice">
                ${["Kore", "Puck", "Charon", "Sulafat"].map((voice) => html`
                  <option value="${voice}" ${voice === state.voice ? "selected" : ""}>${voice}</option>
                `).join("")}
              </select>
              <button data-action="speak" type="button">Speak</button>
              <button data-action="stop" type="button">Stop</button>
            </div>
          </div>
        ` : ""}
        ${state.status ? `<p class="status-line">${escapeHtml(state.status)}</p>` : ""}
      </aside>
    </div>
  `;
}

function editModal() {
  if (!state.editModal) return "";
  return html`
    <div class="modal-layer is-open">
      <button class="drawer-scrim" data-action="close-edit"></button>
      <aside class="edit-modal">
        <div class="winny-head">
          <div>
            <p class="micro">Editable widget</p>
            <h2>${escapeHtml(state.editModal.title)}</h2>
          </div>
          <button class="icon-button" data-action="close-edit">x</button>
        </div>
        <p class="muted edit-help">${editHelp(state.editModal.type)}</p>
        <div class="friendly-editor">
          ${friendlyEditor()}
        </div>
        <div class="voice-row">
          <button class="primary-button" data-action="save-edit" type="button">Save</button>
          ${canAddRows(state.editModal.type) ? `<button data-action="add-edit-row" type="button">Add row</button>` : ""}
          <button data-action="close-edit" type="button">Cancel</button>
          <button data-action="reset-widget" type="button">Reset widget</button>
        </div>
        ${state.status ? `<p class="status-line">${escapeHtml(state.status)}</p>` : ""}
      </aside>
    </div>
  `;
}

function editHelp(type) {
  if (type === "tasks") return "Edit each task title and detail. Add or delete tasks without touching code.";
  if (type === "skills") return "Edit each skill name, practice path, and level.";
  if (type === "calendar") return "Edit each month focus. Click a day in the calendar to edit that day's tasks.";
  if (type === "taskList") return "Edit the selected day's tasks.";
  if (type === "scorecard") return "Edit metric name, value, and progress percentage.";
  if (type === "customWidget") return "Edit the widget title, type, subtitle, and rows.";
  if (type === "mission") return "Edit the mission text and the three stat boxes.";
  return "Edit label and value rows. Add or remove rows freely.";
}

function canAddRows(type) {
  return ["rows", "tasks", "skills", "taskList", "scorecard", "customWidget"].includes(type);
}

function friendlyEditor() {
  const draft = state.editDraft;
  if (state.editModal.type === "mission") {
    return html`
      ${inputField("Eyebrow", "eyebrow", draft.eyebrow)}
      ${inputField("Title", "title", draft.title)}
      ${textareaField("Description", "body", draft.body)}
      <div class="edit-section-title">Stat boxes</div>
      ${rowEditor(draft.stats || [], ["label", "value"])}
    `;
  }
  if (state.editModal.type === "customWidget") {
    return html`
      ${inputField("Widget title", "title", draft.title)}
      ${inputField("Small label", "meta", draft.meta)}
      <label class="edit-field">
        <span>Widget type</span>
        <select data-draft-field="type">
          ${["table", "notes", "pipeline"].map((type) => `<option value="${type}" ${draft.type === type ? "selected" : ""}>${type}</option>`).join("")}
        </select>
      </label>
      <div class="edit-section-title">Rows</div>
      ${rowEditor(draft.rows || [], ["label", "value"])}
    `;
  }
  if (state.editModal.type === "tasks") return rowEditor(draft, ["title", "detail"]);
  if (state.editModal.type === "skills") return rowEditor(draft, ["title", "path", "level"]);
  if (state.editModal.type === "scorecard") return rowEditor(draft, ["label", "value", "progress"]);
  if (state.editModal.type === "taskList") return listEditor(draft);
  if (state.editModal.type === "calendar") {
    return html`
      <div class="edit-section-title">Month focus</div>
      ${(draft || []).map((month, index) => html`
        <div class="edit-row simple">
          <label class="edit-field"><span>${escapeHtml(month.name)} focus</span><input data-row="${index}" data-key="focus" value="${escapeAttr(month.focus)}" /></label>
        </div>
      `).join("")}
    `;
  }
  return rowEditor(Array.isArray(draft) ? draft : [], ["label", "value"]);
}

function inputField(label, field, value) {
  return html`
    <label class="edit-field">
      <span>${label}</span>
      <input data-draft-field="${field}" value="${escapeAttr(value)}" />
    </label>
  `;
}

function textareaField(label, field, value) {
  return html`
    <label class="edit-field">
      <span>${label}</span>
      <textarea data-draft-field="${field}" rows="3">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function rowEditor(rows, keys) {
  return html`
    <div class="edit-rows">
      ${(rows || []).map((row, index) => html`
        <div class="edit-row">
          ${keys.map((key) => html`
            <label class="edit-field">
              <span>${key}</span>
              <input data-row="${index}" data-key="${key}" value="${escapeAttr(row?.[key] ?? "")}" />
            </label>
          `).join("")}
          <button class="row-delete" data-action="remove-edit-row" data-index="${index}" type="button">Delete row</button>
        </div>
      `).join("")}
    </div>
  `;
}

function listEditor(items) {
  return html`
    <div class="edit-rows">
      ${(items || []).map((item, index) => html`
        <div class="edit-row simple">
          <label class="edit-field">
            <span>Task ${index + 1}</span>
            <input data-row="${index}" data-key="value" value="${escapeAttr(item)}" />
          </label>
          <button class="row-delete" data-action="remove-edit-row" data-index="${index}" type="button">Delete row</button>
        </div>
      `).join("")}
    </div>
  `;
}

function reflectionNotice() {
  if (!state.reflectionNotice) return "";
  return html`
    <div class="reflection-toast">
      <strong>10:00 PM Reflection</strong>
      <span>Close the day: wins, lessons, avoidance, and tomorrow's leverage move.</span>
      <div class="voice-row">
        <button class="primary-button" data-action="open-reflect">Reflect now</button>
        <button data-action="dismiss-reflection">Dismiss</button>
      </div>
    </div>
  `;
}

function bottomNav() {
  return html`
    <nav class="bottom-nav five">
      ${navItems.map((item) => html`
        <button class="${state.activeView === item.id ? "active" : ""}" data-action="nav" data-id="${item.id}">
          <span>${escapeHtml(item.icon)}</span>
          ${escapeHtml(item.label)}
        </button>
      `).join("")}
    </nav>
  `;
}

function metricPill(label, value) {
  return `<div class="metric-pill"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function metricBlock(label, value) {
  return `<div class="metric-block"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function splitRow(label, value) {
  return `<div class="split-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.onclick = handleClick;
  });
  document.querySelector(".winny-form")?.addEventListener("submit", askWinny);
  document.querySelector("[data-action='voice']")?.addEventListener("change", (event) => {
    state.voice = event.target.value;
  });
  document.querySelector(".winny-form textarea")?.addEventListener("input", (event) => {
    state.message = event.target.value;
  });
}

function handleClick(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;

  if (action === "nav") state.activeView = id;
  if (action === "open-winny") state.winnyOpen = true;
  if (action === "close-winny") state.winnyOpen = false;
  if (action === "toggle-task") toggleSet(state.checkedTasks, id);
  if (action === "toggle-skill") toggleSet(state.checkedSkills, id);
  if (action === "select-day") {
    state.selectedDay = {
      month: event.currentTarget.dataset.month,
      day: Number(event.currentTarget.dataset.day)
    };
  }
  if (action === "edit") openEdit(JSON.parse(event.currentTarget.dataset.edit));
  if (action === "close-edit") {
    state.editModal = null;
    state.editDraft = null;
    state.status = "";
  }
  if (action === "save-edit") saveEdit();
  if (action === "add-edit-row") addEditRow();
  if (action === "remove-edit-row") removeEditRow(Number(event.currentTarget.dataset.index));
  if (action === "reset-widget") resetWidget();
  if (action === "delete-widget") deleteWidget(id);
  if (action === "add-custom") addCustomWidget(event.currentTarget.dataset.target);
  if (action === "ask-winny-click") askWinny(event);
  if (action === "save-gemini-key") saveGeminiKey();
  if (action === "speak") speak();
  if (action === "stop") stopAudio();
  if (action === "open-reflect") {
    state.activeView = "reflect";
    state.reflectionNotice = false;
    markReflectionDismissed();
  }
  if (action === "dismiss-reflection") {
    state.reflectionNotice = false;
    markReflectionDismissed();
  }

  saveData();
  if (!["speak", "stop", "ask-winny-click", "save-edit", "reset-widget", "add-edit-row", "remove-edit-row", "save-gemini-key"].includes(action)) render();
}

function toggleSet(set, id) {
  set.has(id) ? set.delete(id) : set.add(id);
}

function getByPath(path) {
  return path.split(".").reduce((current, part) => current?.[part], { data: state.data });
}

function setByPath(path, value) {
  const parts = path.split(".");
  let current = { data: state.data };
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (current[part] === undefined) current[part] = {};
    current = current[part];
  }
  current[parts.at(-1)] = value;
}

function openEdit(config) {
  state.editModal = config;
  state.editDraft = clone(getByPath(config.path) ?? defaultDraft(config.type));
  state.status = "";
}

function defaultDraft(type) {
  if (type === "taskList") return ["New task"];
  if (type === "tasks") return [{ id: `task-${Date.now()}`, title: "New task", detail: "Add detail" }];
  if (type === "skills") return [{ id: `skill-${Date.now()}`, title: "New skill", path: "Practice path", level: "New" }];
  if (type === "scorecard") return [{ label: "Metric", value: "0", progress: 0 }];
  if (type === "customWidget") return { type: "table", title: "Custom Widget", meta: "editable", rows: [{ label: "Label", value: "Value" }] };
  return [{ label: "Label", value: "Value" }];
}

function syncDraftFromForm() {
  const root = document.querySelector(".friendly-editor");
  if (!root || state.editDraft === null) return;

  root.querySelectorAll("[data-draft-field]").forEach((input) => {
    state.editDraft[input.dataset.draftField] = input.value;
  });

  if (state.editModal.type === "mission") {
    state.editDraft.stats = collectObjectRows(root, ["label", "value"]);
    return;
  }
  if (state.editModal.type === "customWidget") {
    state.editDraft.rows = collectObjectRows(root, ["label", "value"]);
    return;
  }
  if (state.editModal.type === "taskList") {
    state.editDraft = collectListRows(root);
    return;
  }
  if (state.editModal.type === "calendar") {
    root.querySelectorAll("[data-row][data-key]").forEach((input) => {
      const row = Number(input.dataset.row);
      const key = input.dataset.key;
      state.editDraft[row][key] = input.value;
    });
    return;
  }

  const keys = state.editModal.type === "tasks"
    ? ["title", "detail"]
    : state.editModal.type === "skills"
      ? ["title", "path", "level"]
      : state.editModal.type === "scorecard"
        ? ["label", "value", "progress"]
        : ["label", "value"];
  state.editDraft = collectObjectRows(root, keys).map((row, index) => {
    if (state.editModal.type === "tasks") return { id: state.editDraft[index]?.id || `task-${Date.now()}-${index}`, ...row };
    if (state.editModal.type === "skills") return { id: state.editDraft[index]?.id || `skill-${Date.now()}-${index}`, ...row };
    if (state.editModal.type === "scorecard") return { ...row, progress: Number(row.progress) || 0 };
    return row;
  });
}

function collectObjectRows(root, keys) {
  const grouped = [];
  root.querySelectorAll("[data-row][data-key]").forEach((input) => {
    const row = Number(input.dataset.row);
    const key = input.dataset.key;
    if (!grouped[row]) grouped[row] = {};
    if (keys.includes(key)) grouped[row][key] = input.value;
  });
  return grouped.filter(Boolean);
}

function collectListRows(root) {
  return [...root.querySelectorAll("[data-row][data-key='value']")]
    .map((input) => input.value)
    .filter((value) => value.trim());
}

function saveEdit() {
  try {
    syncDraftFromForm();
    setByPath(state.editModal.path, state.editDraft);
    state.editModal = null;
    state.editDraft = null;
    state.status = "";
    saveData();
  } catch (error) {
    state.status = `Could not save: ${error.message}`;
  }
  render();
}

function addEditRow() {
  syncDraftFromForm();
  if (state.editModal.type === "taskList") state.editDraft.push("New task");
  else if (state.editModal.type === "tasks") state.editDraft.push({ id: `task-${Date.now()}`, title: "New task", detail: "Add detail" });
  else if (state.editModal.type === "skills") state.editDraft.push({ id: `skill-${Date.now()}`, title: "New skill", path: "Practice path", level: "New" });
  else if (state.editModal.type === "scorecard") state.editDraft.push({ label: "Metric", value: "0", progress: 0 });
  else if (state.editModal.type === "customWidget") state.editDraft.rows.push({ label: "Label", value: "Value" });
  else if (Array.isArray(state.editDraft)) state.editDraft.push({ label: "Label", value: "Value" });
  render();
}

function removeEditRow(index) {
  syncDraftFromForm();
  if (state.editModal.type === "customWidget") state.editDraft.rows.splice(index, 1);
  else if (Array.isArray(state.editDraft)) state.editDraft.splice(index, 1);
  render();
}

function resetWidget() {
  const defaultValue = state.editModal?.path ? getDefaultByPath(state.editModal.path) : null;
  if (defaultValue !== undefined) {
    setByPath(state.editModal.path, clone(defaultValue));
    state.editModal = null;
    state.editDraft = null;
    state.status = "";
    saveData();
  } else {
    state.status = "No default exists for this custom widget.";
  }
  render();
}

function deleteWidget(id) {
  if (!id || state.data.hiddenWidgets.includes(id)) return;
  state.data.hiddenWidgets.push(id);
  saveData();
}

function getDefaultByPath(path) {
  return path.split(".").reduce((current, part) => current?.[part], { data: defaultData });
}

function addCustomWidget(target) {
  const widgetToAdd = {
    id: `custom-${Date.now()}`,
    type: "table",
    title: target === "reflect" ? "Reflection Custom Table" : "Today Custom Table",
    meta: "new",
    rows: [
      { label: "Label", value: "Value" },
      { label: "Next action", value: "Edit this row" }
    ]
  };

  if (target === "reflect") {
    const reflection = ensureTodayReflection();
    if (!reflection.customWidgets) reflection.customWidgets = [];
    reflection.customWidgets.push(widgetToAdd);
  } else {
    state.data.customTodayWidgets.push(widgetToAdd);
  }
  saveData();
}

async function askWinny(event) {
  event.preventDefault();
  state.status = "Thinking...";
  state.reply = "";
  render();

  try {
    const response = await fetch("/api/winny/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: state.message, dashboardContext: dashboardContext() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Winny failed.");
    state.reply = data.text || data.reply || "";
    if (Array.isArray(data.actions) && data.actions.length) {
      applyWinnyActions(data.actions);
      state.reply += `\n\nApplied ${data.actions.length} dashboard edit${data.actions.length === 1 ? "" : "s"}.`;
    }
    state.status = "";
  } catch (error) {
    state.status = error.message;
  }
  saveData();
  render();
}

async function saveGeminiKey() {
  const input = document.querySelector("[data-role='gemini-key']");
  const key = input?.value?.trim();
  if (!key) {
    state.status = "Paste your Gemini API key first.";
    render();
    return;
  }

  state.status = "Saving Gemini key...";
  render();

  try {
    const response = await fetch("/api/config/gemini-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save Gemini key.");
    state.status = "Gemini key saved. Restarting the local server is recommended if Winny still says missing key.";
  } catch (error) {
    state.status = error.message;
  }
  render();
}

function applyWinnyActions(actions) {
  actions.forEach((action) => {
    if (!action || typeof action.path !== "string" || !action.path.startsWith("data.")) return;
    const current = getByPath(action.path);
    if (action.type === "set" || action.type === "replace") setByPath(action.path, action.value);
    if (action.type === "append" && Array.isArray(current)) current.push(action.value);
    if (action.type === "delete" && Array.isArray(current)) current.splice(Number(action.index), 1);
  });
}

async function speak() {
  if (!state.reply) return;
  stopAudio();
  state.status = "Generating voice...";
  render();

  try {
    const response = await fetch("/api/winny/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: state.reply, voice: state.voice })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "TTS failed.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    state.audio = new Audio(url);
    state.audio.onended = () => URL.revokeObjectURL(url);
    await state.audio.play();
    state.status = "";
  } catch (error) {
    state.status = error.message;
  }
  render();
}

function stopAudio() {
  if (!state.audio) return;
  state.audio.pause();
  state.audio.currentTime = 0;
  state.audio = null;
}

function checkReflectionReminder() {
  const time = beirutTimeParts();
  const key = todayKey();
  if (time.hour === "22" && localStorage.getItem(`kos-reflection-dismissed-${key}`) !== "yes") {
    state.reflectionNotice = true;
    render();
  }
}

function markReflectionDismissed() {
  localStorage.setItem(`kos-reflection-dismissed-${todayKey()}`, "yes");
}

ensureTodayReflection();
checkReflectionReminder();
setInterval(checkReflectionReminder, 60 * 1000);
render();
