// Builds Sprint_Planning_Presentation.pptx from sprint_data.json (run build_sprint_artifacts.py first)
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");
const D = require("./sprint_data.json");

const THEME = { name: "HMS Sprint", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "10312F", lt1: "FFFFFF", dk2: "0B4F4A", lt2: "ECF8F6", accent1: "0F766E", accent2: "F59E0B",
            accent3: "7C3AED", accent4: "C2410C", accent5: "1D4ED8", accent6: "BE185D", hlink: "0F766E", folHlink: "7C3AED" } };
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "HMS Sprint Planning"; pres.author = "HMS Team";
const C = pres.SchemeColor;
const HEX = { teal: "0F766E", dark: "10312F", mint: "ECF8F6", amber: "F59E0B", mute: "5B7270", line: "CFE3E0",
  AB: "0F766E", UQ: "7C3AED", TA: "C2410C", WA: "1D4ED8", MY: "BE185D" };
const first = k => D.team[k].name.split(" ").slice(-1)[0];
const shortName = { AB: "Abdullah", UQ: "Umair", TA: "Talha", WA: "Waleed", MY: "Yousaf" };

pres.defineSlideMaster({ title: "TITLE_DARK", background: { color: "10312F" } });
pres.defineSlideMaster({ title: "CONTENT", background: { color: "FFFFFF" },
  objects: [{ text: { text: "HMS | Sprint 1 Planning", options: { x: 0.5, y: 5.28, w: 5, h: 0.25, fontSize: 10, color: "5B7270", margin: 0 } } }],
  slideNumber: { x: 9.0, y: 5.28, w: 0.5, h: 0.25, fontSize: 10, color: "5B7270", align: "right" } });

let n = 0;
function content(title, notes) {
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText(title, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 30, bold: true, fontFace: "Cambria", color: "10312F", margin: 0, isTextBox: true, objectName: "Title" });
  if (notes) s.addNotes(notes);
  return s;
}
const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontFace: "Calibri", color: "10312F" }, o));
const card = (s, x, y, w, h, fill) => s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill || "ECF8F6" }, line: { color: "CFE3E0", width: 0.75 } });
const hdrCell = t => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: "0F766E" }, fontSize: 12, fontFace: "Calibri" } });
const cell = (t, o) => ({ text: String(t), options: Object.assign({ fontSize: 10.5, color: "10312F", fontFace: "Calibri" }, o || {}) });

// 1 Title
{ const s = pres.addSlide({ masterName: "TITLE_DARK" });
  T(s, "AGILE / SCRUM | SPRINT PLANNING", { x: 0.7, y: 1.0, w: 8.6, h: 0.35, fontSize: 14, bold: true, color: "F59E0B", charSpacing: 3 });
  T(s, "Hospital Management System (HMS)", { x: 0.7, y: 1.5, w: 8.6, h: 1.0, fontSize: 34, bold: true, fontFace: "Cambria", color: "FFFFFF" });
  T(s, `${D.sprint}: ${D.start} to ${D.end}`, { x: 0.7, y: 2.6, w: 8.6, h: 0.4, fontSize: 20, color: "CFE3E0" });
  const names = Object.keys(D.team).map(k => D.team[k].name).join("  |  ");
  T(s, names, { x: 0.7, y: 4.3, w: 8.6, h: 0.6, fontSize: 13, color: "FFFFFF" });
  s.addNotes("Presenter: Muhammad Abdullah Malik. Introduce the team and say the presentation will be done live in the project management tool."); }

// 2 Overview
{ const s = content("1. Project overview", "Presenter: Abdullah. HMS = browser -> Python server -> SQLite database. Three validation layers.");
  T(s, "Objectives", { x: 0.5, y: 1.05, w: 4.3, h: 0.3, fontSize: 18, bold: true, color: "0F766E" });
  T(s, D.objectives.map((o, i) => ({ text: o, options: { bullet: true, breakLine: i < D.objectives.length - 1, paraSpaceAfter: 6 } })),
    { x: 0.5, y: 1.4, w: 4.3, h: 2.9, fontSize: 13, valign: "top" });
  T(s, "browser (HMS/)  >  server.py  >  SQLite (hms.db)", { x: 0.5, y: 4.5, w: 4.3, h: 0.4, fontSize: 10.5, bold: true, color: "0F766E", fontFace: "Courier New" });
  T(s, "Major modules", { x: 5.2, y: 1.05, w: 4.3, h: 0.3, fontSize: 18, bold: true, color: "0F766E" });
  D.modules.forEach((m, i) => { const y = 1.45 + i * 0.52;
    card(s, 5.2, y, 4.3, 0.45);
    T(s, m[0], { x: 5.32, y, w: 1.55, h: 0.45, fontSize: 12, bold: true, valign: "middle" });
    T(s, m[1], { x: 6.9, y, w: 2.55, h: 0.45, fontSize: 10, color: "5B7270", valign: "middle" }); }); }

// 3 Team
{ const s = content("2. Scrum team and roles", "Presenter: Abdullah. Each member owns one area so work does not collide. Umair is Product Owner, Abdullah Scrum Master.");
  Object.keys(D.team).forEach((k, i) => { const m = D.team[k], x = 0.5 + i * 1.8;
    card(s, x, 1.1, 1.7, 3.35, "FFFFFF");
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.55, y: 1.25, w: 0.6, h: 0.6, fill: { color: HEX[k] }, line: { color: HEX[k] } });
    T(s, shortName[k].slice(0, 1), { x: x + 0.55, y: 1.25, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    T(s, m.name, { x: x + 0.1, y: 1.95, w: 1.5, h: 0.55, fontSize: 12, bold: true, align: "center", valign: "top" });
    T(s, m.role, { x: x + 0.1, y: 2.5, w: 1.5, h: 0.5, fontSize: 10.5, bold: true, color: HEX[k], align: "center", valign: "top" });
    T(s, m.resp, { x: x + 0.1, y: 3.05, w: 1.5, h: 1.9, fontSize: 11.5, color: "3F5754", valign: "top" }); }); }

// 4 Product backlog
const SHORT = { "PB-17": "Verified database design", "PB-01": "Secure login", "PB-02": "Patient register / edit / search", "PB-04": "Doctors and departments",
  "PB-06": "Book appointments, no double-booking", "PB-07": "Medical records with vitals", "PB-09": "Invoices, live totals, payments",
  "PB-10": "Medicine stock and expiry alerts", "PB-11": "Dispensing reduces stock", "PB-18": "Automatic tests", "PB-03": "Patient profile timeline",
  "PB-05": "Doctor schedules, available today", "PB-08": "Prescriptions in a visit", "PB-12": "Dashboard with alerts", "PB-15": "Reports",
  "PB-16": "Audit log", "PB-13": "Notifications (read / unread)", "PB-14": "Global search", "PB-19": "Role-based access",
  "PB-20": "SMS / email reminders", "PB-21": "Invoice PDF export", "PB-22": "PostgreSQL + online hosting" };
{ const s = content("3. Product Backlog (prioritised)", "Presenter: Umair (Product Owner). Show the Backlog view in the tool. Order = dependencies first, then Must, Should, Could. Items 19-22 stay in the backlog for later sprints.");
  const rows = [[hdrCell("#"), hdrCell("ID"), hdrCell("User story (short)"), hdrCell("MoSCoW"), hdrCell("Pts"), hdrCell("Sprint 1")]];
  const pick = D.backlog.filter(b => b.rank <= 10 || b.rank >= 19);
  pick.forEach(b => rows.push([cell(b.rank), cell(b.id, { bold: true }), cell(SHORT[b.id]), cell(b.moscow.replace(" (this sprint)", "")),
    cell(b.pts), cell(b.inSprint ? "Yes" : "Later", { bold: true, color: b.inSprint ? "0F766E" : "C2410C" })]));
  s.addTable(rows, { x: 0.5, y: 0.98, w: 9.0, colW: [0.4, 0.8, 4.1, 1.3, 0.6, 1.8], rowH: 0.25, border: { type: "solid", pt: 0.5, color: "CFE3E0" }, autoPage: false, margin: [0.02, 0.08, 0.02, 0.08] });
  T(s, `Ranks 11 to 18 (Should / Could stories, ${D.backlog.filter(b => b.rank >= 11 && b.rank <= 18).reduce((a, b) => a + b.pts, 0)} pts) are also in Sprint 1; see the tool.`, { x: 0.5, y: 4.95, w: 9, h: 0.25, fontSize: 11, color: "5B7270", italic: true }); }

// 5 Goal and duration
{ const s = content("4. Sprint Goal and duration", "Presenter: Umair. Read the goal. 14 days, 166 hours of tasks for 5 people, review 31 Oct, retrospective 1 Nov. Definition of Done is on the right.");
  card(s, 0.5, 1.05, 9, 1.2, "10312F");
  T(s, D.goal, { x: 0.7, y: 1.1, w: 8.6, h: 1.1, fontSize: 14, color: "FFFFFF", valign: "middle" });
  const stats = [[`${D.totals.days} days`, `${D.start} - ${D.end}`], [`${D.totals.hours} h`, `${D.totals.tasks} tasks`], [`${D.totals.points} pts`, `${D.totals.stories} user stories`], ["31 Oct / 1 Nov", "Review / Retrospective"]];
  stats.forEach((st, i) => { const x = 0.5 + i * 1.1; });
  stats.forEach((st, i) => { const y = 2.45 + Math.floor(i / 2) * 1.2, x = 0.5 + (i % 2) * 2.2;
    card(s, x, y, 2.1, 1.05);
    T(s, st[0], { x: x + 0.1, y: y + 0.08, w: 1.9, h: 0.5, fontSize: 22, bold: true, color: "0F766E", fontFace: "Cambria", valign: "middle" });
    T(s, st[1], { x: x + 0.1, y: y + 0.6, w: 1.9, h: 0.35, fontSize: 11, color: "5B7270" }); });
  T(s, "Definition of Done", { x: 5.2, y: 2.4, w: 4.3, h: 0.3, fontSize: 16, bold: true, color: "0F766E" });
  T(s, D.dod.map((d, i) => ({ text: d, options: { bullet: true, breakLine: i < D.dod.length - 1, paraSpaceAfter: 4 } })), { x: 5.2, y: 2.75, w: 4.3, h: 2.3, fontSize: 11, valign: "top" }); }

// 6 Sprint backlog table
{ const s = content("5. Sprint Backlog: 18 user stories", "Presenter: Umair. Open the Sprint Backlog in the tool. Each story has acceptance criteria written by the Product Owner and tasks owned by team members.");
  const owners = id => [...new Set(D.tasks.filter(t => t.story === id).map(t => shortName[t.owner]))].join(", ");
  const half = D.backlog.filter(b => b.inSprint);
  const mk = list => { const r = [[hdrCell("ID"), hdrCell("Story"), hdrCell("Pts"), hdrCell("Owners")]];
    list.forEach(b => r.push([cell(b.id, { bold: true, fontSize: 11 }), cell(SHORT[b.id], { fontSize: 11 }), cell(b.pts, { fontSize: 11 }), cell(owners(b.id), { fontSize: 11 })])); return r; };
  const opt = { y: 1.05, w: 4.4, colW: [0.6, 1.9, 0.4, 1.5], rowH: 0.36, border: { type: "solid", pt: 0.5, color: "CFE3E0" }, autoPage: false, margin: [0.02, 0.07, 0.02, 0.07] };
  s.addTable(mk(half.slice(0, 9)), Object.assign({ x: 0.5 }, opt));
  s.addTable(mk(half.slice(9)), Object.assign({ x: 5.1 }, opt));
  T(s, "Every story has acceptance criteria and at least two tasks of 2-7 hours.", { x: 0.5, y: 4.9, w: 9, h: 0.3, fontSize: 12, color: "5B7270", italic: true }); }

// 7 Acceptance criteria
{ const s = content("5. Acceptance criteria (key stories)", "Presenter: Umair. Pick two stories and read the criteria. Say how each will be tested in the Sprint Review.");
  ["PB-02", "PB-06", "PB-09", "PB-11"].forEach((id, i) => { const x = 0.5 + (i % 2) * 4.6, y = 1.05 + Math.floor(i / 2) * 2.05;
    card(s, x, y, 4.4, 1.95, "FFFFFF");
    T(s, `${id}  ${SHORT[id]}`, { x: x + 0.15, y: y + 0.1, w: 4.1, h: 0.3, fontSize: 13, bold: true, color: "0F766E" });
    T(s, D.acceptance[id].map((a, j) => ({ text: a, options: { bullet: true, breakLine: j < D.acceptance[id].length - 1, paraSpaceAfter: 3 } })),
      { x: x + 0.15, y: y + 0.45, w: 4.1, h: 1.45, fontSize: 11.5, valign: "top" }); }); }

// 8 Task breakdown and allocation
{ const s = content("6. Task breakdown and allocation", "Presenter: Abdullah. Each story is cut into tasks of 2-7 hours. Workload is balanced: 32-35 hours each. Done tasks are spread across all five members.");
  Object.keys(D.team).forEach((k, i) => { const m = D.team[k], x = 0.5 + i * 1.8;
    card(s, x, 1.05, 1.7, 4.05, "FFFFFF");
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.05, w: 1.7, h: 0.62, rectRadius: 0.08, fill: { color: HEX[k] }, line: { color: HEX[k] } });
    T(s, [{ text: shortName[k], options: { bold: true, fontSize: 13, breakLine: true } }, { text: m.focus, options: { fontSize: 9 } }],
      { x: x + 0.08, y: 1.07, w: 1.55, h: 0.58, color: "FFFFFF", valign: "middle" });
    T(s, `${m.tasks} tasks | ${m.hours} h`, { x: x + 0.08, y: 1.72, w: 1.55, h: 0.25, fontSize: 11, bold: true, color: HEX[k] });
    T(s, `${m.done} done (${m.done_hours} h)`, { x: x + 0.08, y: 1.97, w: 1.55, h: 0.25, fontSize: 10, color: "5B7270" });
    const ts = D.tasks.filter(t => t.owner === k).slice(0, 4);
    T(s, ts.map((t, j) => ({ text: t.title.replace(/\s*\(.*?\)/g, ""), options: { bullet: true, breakLine: j < ts.length - 1, paraSpaceAfter: 2 } })),
      { x: x + 0.08, y: 2.3, w: 1.55, h: 2.75, fontSize: 10, valign: "top" }); }); }

// 9 Schedule (gantt)
{ const s = content("7. Scheduling and dependencies", "Presenter: Talha. Bars show planned start to due date for each area. The database and server (T-01 to T-04) come first because every module depends on them. Critical path is on the bottom line.");
  const area = id => ({ "PB-17": "Database and login", "PB-01": "Database and login", "PB-16": "Database and login", "PB-02": "Patients and search", "PB-03": "Patients and search", "PB-14": "Patients and search",
    "PB-04": "Doctors", "PB-05": "Doctors", "PB-06": "Appointments", "PB-07": "Medical records", "PB-08": "Medical records", "PB-09": "Billing",
    "PB-10": "Pharmacy", "PB-11": "Pharmacy", "PB-12": "Dashboard and reports", "PB-13": "Dashboard and reports", "PB-15": "Dashboard and reports", "PB-18": "Testing" })[id];
  const areas = ["Database and login", "Patients and search", "Doctors", "Appointments", "Medical records", "Billing", "Pharmacy", "Dashboard and reports", "Testing"];
  const d0 = new Date("2026-10-19"), days = 14, gx = 2.6, gw = 6.9, gy = 1.35, rh = 0.36;
  const dx = iso => gx + ((new Date(iso) - d0) / 864e5) * (gw / days);
  for (let d = 0; d < days; d += 1) { const x = gx + d * gw / days;
    T(s, String(19 + d > 31 ? 19 + d - 31 : 19 + d), { x, y: 1.05, w: gw / days, h: 0.25, fontSize: 9, color: "5B7270", align: "center" });
    if (d % 7 === 0 || true) s.addShape(pres.ShapeType.line, { x, y: gy, w: 0, h: rh * areas.length, line: { color: "E3EEEC", width: 0.5 } }); }
  T(s, "Oct 19 - Nov 1", { x: 0.5, y: 1.05, w: 2, h: 0.25, fontSize: 9, color: "5B7270" });
  areas.forEach((a, i) => { const ts = D.tasks.filter(t => area(t.story) === a);
    const st = ts.map(t => t.startIso).sort()[0], en = ts.map(t => t.dueIso).sort().slice(-1)[0];
    const y = gy + i * rh;
    T(s, a, { x: 0.5, y, w: 2.05, h: rh, fontSize: 11, bold: true, valign: "middle" });
    const x1 = dx(st), x2 = dx(en) + gw / days;
    s.addShape(pres.ShapeType.roundRect, { x: x1, y: y + 0.07, w: x2 - x1, h: rh - 0.14, rectRadius: 0.05, fill: { color: "0F766E" }, line: { color: "0F766E" } });
    T(s, `${ts.length} tasks`, { x: x1 + 0.05, y: y + 0.07, w: Math.max(x2 - x1 - 0.1, 0.5), h: rh - 0.14, fontSize: 9, color: "FFFFFF", valign: "middle" }); });
  const tx = dx("2026-10-25") + gw / days;  // end of 25 Oct
  s.addShape(pres.ShapeType.line, { x: tx, y: gy - 0.05, w: 0, h: rh * areas.length + 0.1, line: { color: "F59E0B", width: 2, dashType: "dash" } });
  T(s, "Snapshot 25 Oct", { x: tx - 0.5, y: gy + rh * areas.length + 0.08, w: 1.4, h: 0.22, fontSize: 9, bold: true, color: "B45309" });
  T(s, [{ text: "Critical path: ", options: { bold: true, color: "0F766E" } }, { text: "T-01 schema > T-04 server and login > module tasks > T-47 browser self-test > T-48 final regression run" }],
    { x: 0.5, y: 4.85, w: 9, h: 0.3, fontSize: 11 }); }

// 10 Estimation + burndown
{ const s = content("7. Estimates and burndown", "Presenter: Talha. 166 hours committed, 148 done at the snapshot. Hours per person are balanced. Burndown is below the ideal line, meaning the team is ahead of plan; remaining items are review, QA and board administration.");
  const keys = Object.keys(D.team);
  s.addChart(pres.charts.BAR, [
    { name: "Done (h)", labels: keys.map(k => shortName[k]), values: keys.map(k => D.team[k].done_hours) },
    { name: "Remaining (h)", labels: keys.map(k => shortName[k]), values: keys.map(k => D.team[k].hours - D.team[k].done_hours) }],
    { x: 0.4, y: 1.0, w: 4.4, h: 3.9, barDir: "col", barGrouping: "stacked", chartColors: ["0F766E", "F59E0B"], showTitle: true, title: "Hours per member",
      titleFontSize: 13, titleColor: "10312F", showLegend: true, legendPos: "b", legendFontSize: 10, showValue: true, dataLabelPosition: "ctr", dataLabelColor: "FFFFFF", dataLabelFontSize: 10,
      catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelColor: "5B7270", valAxisLabelColor: "5B7270", valGridLine: { color: "E3EEEC", size: 0.5 }, catGridLine: { style: "none" } });
  const bd = D.burndown;
  s.addChart(pres.charts.LINE, [
    { name: "Ideal", labels: bd.map(b => b.day.slice(0, 2)), values: bd.map(b => b.ideal) },
    { name: "Actual", labels: bd.map(b => b.day.slice(0, 2)), values: bd.map(b => b.actual) }],
    { x: 5.0, y: 1.0, w: 4.6, h: 3.9, chartColors: ["94A3B8", "0F766E"], lineSize: 2.5, lineDataSymbolSize: 5, showTitle: true, title: "Burndown (hours remaining)",
      titleFontSize: 13, titleColor: "10312F", showLegend: true, legendPos: "b", legendFontSize: 10, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
      catAxisLabelColor: "5B7270", valAxisLabelColor: "5B7270", valGridLine: { color: "E3EEEC", size: 0.5 }, catGridLine: { style: "none" } }); }

// 11 Scrum board
{ const s = content("8. Scrum Board (snapshot " + D.snapshot.slice(0, 6) + ")", "Presenter: Waleed. SWITCH TO THE TOOL here and show the live board. Done column has 36 cards: 7 each for Abdullah, Umair, Talha, Waleed and 8 for Yousaf.");
  const cols = ["To Do", "In Progress", "In Review", "Done"], cw = 2.15;
  cols.forEach((c, i) => { const x = 0.5 + i * (cw + 0.13), items = D.tasks.filter(t => t.status === c);
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.0, w: cw, h: 4.1, rectRadius: 0.08, fill: { color: "ECF8F6" }, line: { color: "CFE3E0", width: 0.75 } });
    T(s, `${c}  (${items.length})`, { x: x + 0.1, y: 1.05, w: cw - 0.2, h: 0.3, fontSize: 12, bold: true, color: "0F766E" });
    if (c !== "Done") items.forEach((t, j) => { const y = 1.42 + j * 0.88;
      s.addShape(pres.ShapeType.roundRect, { x: x + 0.08, y, w: cw - 0.16, h: 0.8, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: "CFE3E0", width: 0.5 } });
      T(s, t.id + "  " + t.title.replace(/\s*\(.*?\)/g, ""), { x: x + 0.15, y: y + 0.04, w: cw - 0.3, h: 0.5, fontSize: 9, valign: "top" });
      T(s, shortName[t.owner] + "  |  " + t.hours + " h", { x: x + 0.15, y: y + 0.56, w: cw - 0.3, h: 0.2, fontSize: 9, bold: true, color: HEX[t.owner] }); });
    else { Object.keys(D.team).forEach((k, j) => { const y = 1.45 + j * 0.62, cnt = D.tasks.filter(t => t.owner === k && t.status === "Done");
      s.addShape(pres.ShapeType.roundRect, { x: x + 0.08, y, w: cw - 0.16, h: 0.54, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: "CFE3E0", width: 0.5 } });
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.16, y: y + 0.12, w: 0.3, h: 0.3, fill: { color: HEX[k] }, line: { color: HEX[k] } });
      T(s, String(cnt.length), { x: x + 0.16, y: y + 0.12, w: 0.3, h: 0.3, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
      T(s, shortName[k] + " | " + cnt.reduce((a, t) => a + t.hours, 0) + " h", { x: x + 0.55, y, w: cw - 0.7, h: 0.54, fontSize: 10, bold: true, valign: "middle" }); }); } }); }

// 12 Increment
{ const s = content("9. Expected Sprint Increment", "Presenter: Yousaf. Then run the live demo following HMS/PRESENTATION_GUIDE.md: login, add patient, FK refusal, book appointment, vitals validation, invoice, dispensing, audit log.");
  D.increment.forEach((t, i) => { const x = 0.5 + (i % 3) * 3.05, y = 1.05 + Math.floor(i / 3) * 1.35;
    card(s, x, y, 2.9, 1.22, "FFFFFF");
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.12, y: y + 0.12, w: 0.34, h: 0.34, fill: { color: "0F766E" }, line: { color: "0F766E" } });
    T(s, String(i + 1), { x: x + 0.12, y: y + 0.12, w: 0.34, h: 0.34, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    T(s, t, { x: x + 0.55, y: y + 0.08, w: 2.28, h: 1.06, fontSize: 10.5, valign: "middle" }); }); }

// 13 Risks
{ const s = content("10. Risks and challenges", "Presenter: all members. Each member should be able to explain the risk in their own area. Owner column shows who watches it.");
  const rows = [[hdrCell("Risk"), hdrCell("Likelihood"), hdrCell("Impact"), hdrCell("Mitigation"), hdrCell("Owner")]];
  D.risks.forEach(r => rows.push([cell(r.risk, { fontSize: 10.5 }), cell(r.prob, { fontSize: 10.5 }), cell(r.impact, { fontSize: 10.5, bold: true, color: r.impact === "High" ? "B91C1C" : "92400E" }), cell(r.plan, { fontSize: 10.5 }), cell(r.owner, { fontSize: 10.5 })]));
  s.addTable(rows, { x: 0.5, y: 1.0, w: 9, colW: [2.6, 1.0, 0.7, 3.9, 0.8], border: { type: "solid", pt: 0.5, color: "CFE3E0" }, autoPage: false, margin: [0.03, 0.07, 0.03, 0.07] }); }

// 14 Closing
{ const s = pres.addSlide({ masterName: "TITLE_DARK" });
  T(s, "Workspace and next steps", { x: 0.7, y: 0.8, w: 8.6, h: 0.7, fontSize: 34, bold: true, fontFace: "Cambria", color: "FFFFFF" });
  T(s, "Project workspace link: " + D.link, { x: 0.7, y: 1.7, w: 8.6, h: 0.4, fontSize: 14, color: "F59E0B", bold: true });
  T(s, [
    { text: "Show the Backlog, Sprint Backlog and Board live in the tool", options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: "Daily Scrum 10:00 (15 min); Sprint Review " + D.review + "; Retrospective " + D.retro, options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: "Open items: T-09 workspace import, T-17/T-27/T-37 reviews, T-28 widget, T-48 final regression run, T-18 PO acceptance", options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: "All members are ready to justify the scope, estimates, allocations and deliverables", options: { bullet: true } }],
    { x: 0.7, y: 2.3, w: 8.6, h: 1.8, fontSize: 14, color: "FFFFFF", valign: "top" });
  T(s, "Thank you  |  Questions?", { x: 0.7, y: 4.5, w: 8.6, h: 0.4, fontSize: 18, color: "CFE3E0" });
  s.addNotes("Presenter: all members. Open the project tool, then take questions. Each member answers about their own tasks."); }

(async () => { await pres.writeFile({ fileName: "Sprint_Planning_Presentation.pptx" }); await applyTheme("Sprint_Planning_Presentation.pptx", THEME); console.log("ok"); })();
