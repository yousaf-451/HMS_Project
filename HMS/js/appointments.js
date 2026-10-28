/* =========================================================
   appointments.js — Appointment Management
   List + week calendar, booking form with dependent dropdowns,
   conflict detection, status changes.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const $ = (id) => document.getElementById(id);

  let appointments = HMSData.get("appointments");
  const patients = HMSData.get("patients");
  const doctors = HMSData.get("doctors");
  let editingId = null;
  let original = null;
  let view = "list";

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const EDITABLE = ["Scheduled", "Pending", "Confirmed"];
  const statusBadge = { Confirmed: "success", Completed: "success", Scheduled: "info", Pending: "warning", Cancelled: "danger" };
  const statusIcon = { Confirmed: "✔", Completed: "✔", Scheduled: "🕒", Pending: "⏳", Cancelled: "✖" };
  const badge = (s) => `<span class="badge badge-${statusBadge[s]}">${statusIcon[s]} ${s}</span>`;
  const typeText = (t) => (t === "Emergency" ? "🚨 Emergency" : t);

  // ----- Date helpers -----
  const dayName = (iso) => DAY_NAMES[new Date(iso + "T00:00:00").getDay()];
  function addDays(iso, n) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return HMSUtils.toISO(d);
  }
  function mondayOf(iso) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return HMSUtils.toISO(d);
  }
  const nowHM = () => {
    const n = new Date();
    return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
  };
  let weekStart = mondayOf(HMSUtils.today());

  // ---------------------------------------------------------
  // 1. LIST + FILTERS
  // ---------------------------------------------------------
  $("deptFilter").insertAdjacentHTML("beforeend", HMSData.departments.map((d) => `<option>${d}</option>`).join(""));

  function getFiltered(ignoreDate = false) {
    const q = $("searchBox").value.trim().toLowerCase();
    return appointments.filter((a) => {
      const haystack = (a.id + " " + HMSData.patientName(a.patientId) + " " + HMSData.doctorName(a.doctorId) + " " + a.reason).toLowerCase();
      return (!q || haystack.includes(q)) &&
             (!$("statusFilter").value || a.status === $("statusFilter").value) &&
             (!$("deptFilter").value || a.department === $("deptFilter").value) &&
             (ignoreDate || !$("dateFilter").value || a.date === $("dateFilter").value);
    }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  function renderList() {
    const list = getFiltered();
    $("resultCount").textContent = `Showing ${list.length} of ${appointments.length} appointments`;
    if (!list.length) {
      $("apptRows").innerHTML = `<tr><td colspan="10" class="empty-state">No appointments match your search or filters.</td></tr>`;
      return;
    }
    $("apptRows").innerHTML = list.map((a) => `<tr>
      <td>${a.id}</td>
      <td><a href="patient-profile.html?id=${a.patientId}">${esc(HMSData.patientName(a.patientId))}</a></td>
      <td><a href="doctor-profile.html?id=${a.doctorId}">${esc(HMSData.doctorName(a.doctorId))}</a></td>
      <td>${esc(a.department)}</td>
      <td>${HMSUtils.formatDate(a.date)}</td>
      <td>${a.time}</td>
      <td>${typeText(a.type)}</td>
      <td>${badge(a.status)}</td>
      <td>${esc(a.reason)}</td>
      <td><div class="actions-cell">
        <button class="btn btn-sm" data-act="view" data-id="${a.id}" type="button">View</button>
        ${EDITABLE.includes(a.status) ? `<button class="btn btn-sm" data-act="edit" data-id="${a.id}" type="button">Edit</button>` : ""}
      </div></td>
    </tr>`).join("");
  }

  // ---------------------------------------------------------
  // 2. WEEK CALENDAR
  // ---------------------------------------------------------
  function renderWeek() {
    const list = getFiltered(true);
    const today = HMSUtils.today();
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i));
    $("weekLabel").textContent = HMSUtils.formatDate(days[0]) + " – " + HMSUtils.formatDate(days[6]);
    $("weekGrid").innerHTML = days.map((day) => {
      const items = list.filter((a) => a.date === day);
      const title = new Date(day + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
      return `<div class="week-day ${day === today ? "today" : ""}">
        <h3>${title}${day === today ? " (Today)" : ""}</h3>
        ${items.length ? items.map((a) => `
          <button class="week-appt ${statusBadge[a.status]}" data-view="${a.id}" type="button">
            <strong>${a.time}</strong> ${esc(HMSData.patientName(a.patientId))}<br>
            <small>${esc(HMSData.doctorName(a.doctorId))} · ${statusIcon[a.status]} ${a.status}</small>
          </button>`).join("") : '<div class="week-empty">No appointments</div>'}
      </div>`;
    }).join("");
  }

  function render() { view === "list" ? renderList() : renderWeek(); }

  function setView(v) {
    view = v;
    $("listView").classList.toggle("hidden", v !== "list");
    $("weekView").classList.toggle("hidden", v !== "week");
    $("listViewBtn").setAttribute("aria-pressed", v === "list");
    $("weekViewBtn").setAttribute("aria-pressed", v === "week");
    render();
  }

  $("listViewBtn").addEventListener("click", () => setView("list"));
  $("weekViewBtn").addEventListener("click", () => setView("week"));
  $("prevWeek").addEventListener("click", () => { weekStart = addDays(weekStart, -7); renderWeek(); });
  $("nextWeek").addEventListener("click", () => { weekStart = addDays(weekStart, 7); renderWeek(); });
  $("thisWeek").addEventListener("click", () => { weekStart = mondayOf(HMSUtils.today()); renderWeek(); });

  $("searchBox").addEventListener("input", HMSUtils.debounce(render, 150));
  ["statusFilter", "deptFilter", "dateFilter"].forEach((id) => $(id).addEventListener("change", render));
  $("todayBtn").addEventListener("click", () => { $("dateFilter").value = HMSUtils.today(); setView("list"); });
  $("clearFilters").addEventListener("click", () => {
    $("searchBox").value = ""; $("statusFilter").value = ""; $("deptFilter").value = ""; $("dateFilter").value = "";
    render();
  });

  $("apptRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    if (btn.dataset.act === "view") openView(btn.dataset.id);
    if (btn.dataset.act === "edit") openForm(btn.dataset.id);
  });
  $("weekGrid").addEventListener("click", (e) => {
    const item = e.target.closest("[data-view]");
    if (item) openView(item.dataset.view);
  });

  // ---------------------------------------------------------
  // 3. BOOKING FORM: dependent dropdowns
  // ---------------------------------------------------------
  $("aPatient").innerHTML = '<option value="">Select...</option>' +
    patients.map((p) => `<option value="${p.id}">${p.id} — ${esc(p.firstName + " " + p.lastName)}</option>`).join("");
  $("aDept").innerHTML = '<option value="">Select...</option>' +
    HMSData.departments.map((d) => `<option>${d}</option>`).join("");

  function fillDoctors(dept, selected) {
    const sel = $("aDoctor");
    if (!dept) {
      sel.innerHTML = '<option value="">Select a department first</option>';
      sel.disabled = true;
      return;
    }
    const list = doctors.filter((d) => d.department === dept && (d.status === "Active" || d.id === selected));
    sel.disabled = false;
    sel.innerHTML = list.length
      ? '<option value="">Select...</option>' + list.map((d) =>
          `<option value="${d.id}">${esc(d.name)} — ${esc(d.specialization)}${d.status !== "Active" ? " (" + d.status + ")" : ""}</option>`).join("")
      : '<option value="">No active doctors in this department</option>';
  }

  // Doctor's working hours → 30-minute slots
  function makeSlots(doctor) {
    const toMin = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10);
    const [start, end] = doctor.time.split("-");
    const slots = [];
    for (let m = toMin(start); m < toMin(end); m += 30) {
      slots.push(String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"));
    }
    return slots;
  }

  // CONFLICT DETECTION: same doctor, same date, same time, not cancelled
  function findConflict(doctorId, date, time) {
    return appointments.find((a) => a.doctorId === doctorId && a.date === date && a.time === time &&
      a.status !== "Cancelled" && a.id !== editingId);
  }

  function showWarning(message) {
    $("conflictBox").textContent = message || "";
    $("conflictBox").classList.toggle("hidden", !message);
  }

  function checkConflict() {
    const time = $("aTime").value;
    if (!time) { showWarning(""); return; }
    const c = findConflict($("aDoctor").value, $("aDate").value, time);
    showWarning(c
      ? `Conflict: ${HMSData.doctorName(c.doctorId)} already has appointment ${c.id} (${HMSData.patientName(c.patientId)}) at ${time} on ${HMSUtils.formatDate(c.date)}. Please choose another time.`
      : "");
  }

  function updateSlots(keep) {
    const sel = $("aTime");
    const doctor = doctors.find((d) => d.id === $("aDoctor").value);
    const date = $("aDate").value;
    if (!doctor || !date) {
      sel.innerHTML = '<option value="">Select doctor and date first</option>';
      sel.disabled = true; showWarning(""); return;
    }
    if (!doctor.days.includes(dayName(date))) {
      sel.innerHTML = '<option value="">Doctor not working on this day</option>';
      sel.disabled = true;
      showWarning(`${doctor.name} does not work on ${dayName(date)}. Working days: ${doctor.days.join(", ")}.`);
      return;
    }
    sel.disabled = false;
    sel.innerHTML = '<option value="">Select time...</option>' + makeSlots(doctor).map((t) =>
      `<option value="${t}">${t}${findConflict(doctor.id, date, t) ? " — already booked" : ""}</option>`).join("");
    if (keep) sel.value = keep;
    checkConflict();
  }

  $("aDept").addEventListener("change", () => {
    fillDoctors($("aDept").value, "");
    updateSlots("");
  });
  $("aDoctor").addEventListener("change", () => { updateSlots(""); HMSValidate.setError("aTime", ""); });
  $("aDate").addEventListener("change", () => { updateSlots(""); HMSValidate.setError("aTime", ""); });
  $("aTime").addEventListener("change", checkConflict);

  function openForm(id = null) {
    editingId = id;
    original = id ? appointments.find((a) => a.id === id) : null;
    HMSValidate.clearAll($("apptForm"));
    $("apptForm").reset();
    showWarning("");
    $("aDate").min = HMSUtils.today();
    $("aDate").max = HMSData.offset(365);
    $("apptModalTitle").textContent = id ? "Edit / Reschedule Appointment" : "Book Appointment";
    $("saveApptBtn").textContent = id ? "Save Changes" : "Book Appointment";
    $("aId").value = id || HMSUtils.nextId("APT", appointments, "id");

    if (id) {
      const a = original;
      $("aPatient").value = a.patientId;
      $("aDept").value = a.department;
      fillDoctors(a.department, a.doctorId);
      $("aDoctor").value = a.doctorId;
      $("aDate").value = a.date;
      updateSlots(a.time);
      $("aType").value = a.type;
      $("aReason").value = a.reason;
    } else {
      fillDoctors("", "");
      updateSlots("");
    }
    HMSUI.open("apptModal");
  }
  $("addApptBtn").addEventListener("click", () => openForm());

  // ---------------------------------------------------------
  // 4. VALIDATION
  // ---------------------------------------------------------
  const validators = {
    aPatient: (v) => HMSValidate.required(v, "Patient"),
    aDept: (v) => HMSValidate.required(v, "Department"),
    aDoctor: (v) => HMSValidate.required(v, "Doctor"),
    aDate: (v) => {
      if (!v) return "Appointment date is required.";
      if (isNaN(new Date(v + "T00:00:00"))) return "Enter a valid date.";
      const unchanged = editingId && original.date === v;
      if (v < HMSUtils.today() && !unchanged) return "Appointment date cannot be in the past.";
      if (v > HMSData.offset(365)) return "Date must be within the next 12 months.";
      const doctor = doctors.find((d) => d.id === $("aDoctor").value);
      if (doctor && !doctor.days.includes(dayName(v))) return `${doctor.name} does not work on ${dayName(v)}.`;
      return "";
    },
    aTime: (v) => {
      if (!v) return "Choose an available time slot.";
      if (findConflict($("aDoctor").value, $("aDate").value, v)) return "This slot is already booked for the doctor.";
      const unchanged = editingId && original.date === $("aDate").value && original.time === v;
      if ($("aDate").value === HMSUtils.today() && v <= nowHM() && !unchanged) return "That time has already passed today.";
      return "";
    },
    aType: (v) => HMSValidate.required(v, "Appointment type"),
    aReason: (v) => {
      v = v.trim();
      if (!v) return "Reason is required.";
      if (v.length < 5) return "Reason must be at least 5 characters.";
      return HMSValidate.maxLength(v, 200, "Reason");
    }
  };

  ["aPatient", "aDept", "aDoctor", "aDate", "aType", "aReason"].forEach((id) =>
    $(id).addEventListener("blur", () => HMSValidate.setError(id, validators[id]($(id).value))));
  $("aTime").addEventListener("blur", () => { if (!$("aTime").disabled) HMSValidate.setError("aTime", validators.aTime($("aTime").value)); });

  $("apptForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!HMSValidate.runAll(validators)) {
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const record = {
      id: $("aId").value,
      patientId: $("aPatient").value,
      doctorId: $("aDoctor").value,
      department: $("aDept").value,
      date: $("aDate").value,
      time: $("aTime").value,
      type: $("aType").value,
      status: editingId ? original.status : "Scheduled",
      reason: $("aReason").value.trim()
    };
    if (editingId) {
      appointments = appointments.map((a) => (a.id === editingId ? record : a));
      HMSLayout.toast(`Appointment ${record.id} updated.`);
    } else {
      appointments.push(record);
      HMSLayout.toast(`Appointment ${record.id} booked for ${HMSUtils.formatDate(record.date)} at ${record.time}.`);
    }
    HMSData.set("appointments", appointments);
    HMSUI.close("apptModal");
    render();
  });

  // ---------------------------------------------------------
  // 5. DETAILS MODAL + STATUS CHANGES
  // ---------------------------------------------------------
  function fillView(id) {
    const a = appointments.find((x) => x.id === id);
    $("viewTitle").textContent = "Appointment " + a.id;
    $("viewBody").innerHTML = `
      <dl class="detail-list">
        <dt>Status</dt><dd>${badge(a.status)}</dd>
        <dt>Patient</dt><dd><a href="patient-profile.html?id=${a.patientId}">${esc(HMSData.patientName(a.patientId))}</a> (${a.patientId})</dd>
        <dt>Doctor</dt><dd><a href="doctor-profile.html?id=${a.doctorId}">${esc(HMSData.doctorName(a.doctorId))}</a></dd>
        <dt>Department</dt><dd>${esc(a.department)}</dd>
        <dt>Date and time</dt><dd>${HMSUtils.formatDate(a.date)} (${dayName(a.date)}) at ${a.time}</dd>
        <dt>Type</dt><dd>${typeText(a.type)}</dd>
        <dt>Reason</dt><dd>${esc(a.reason)}</dd>
      </dl>
      ${a.status === "Completed"
        ? `<p style="margin-top:16px"><a class="btn btn-primary" href="medical-records.html?new=1&patient=${a.patientId}">+ Add medical record for this visit</a></p>` : ""}`;

    const open = EDITABLE.includes(a.status);
    $("viewFooter").innerHTML = `
      <button class="btn" type="button" data-close>Close</button>
      ${open ? '<button class="btn" type="button" data-vact="edit">Edit / Reschedule</button>' : ""}
      ${["Scheduled", "Pending"].includes(a.status) ? '<button class="btn btn-primary" type="button" data-vact="Confirmed">Confirm</button>' : ""}
      ${a.status === "Confirmed" ? '<button class="btn btn-primary" type="button" data-vact="Completed">Mark completed</button>' : ""}
      ${open ? '<button class="btn btn-danger" type="button" data-vact="Cancelled">Cancel appointment</button>' : ""}`;
    $("viewModal").dataset.id = id;
  }

  function openView(id) {
    fillView(id);
    if ($("viewModal").classList.contains("hidden")) HMSUI.open("viewModal");
  }

  function setStatus(id, status) {
    appointments = appointments.map((a) => (a.id === id ? { ...a, status } : a));
    HMSData.set("appointments", appointments);
    render();
    HMSLayout.toast(`Appointment ${id} marked as ${status}.`, status === "Cancelled" ? "info" : "success");
  }

  $("viewModal").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vact]");
    if (!btn) return;
    const id = $("viewModal").dataset.id;
    const action = btn.dataset.vact;
    if (action === "edit") { HMSUI.close("viewModal"); openForm(id); }
    else if (action === "Cancelled") {
      HMSUI.close("viewModal");
      HMSUI.confirm(`Cancel appointment ${id}? The time slot becomes free again.`,
        () => setStatus(id, "Cancelled"), "Yes, cancel appointment");
    } else {
      setStatus(id, action);
      fillView(id);
    }
  });

  // ---------------------------------------------------------
  // 6. START (supports ?new=1 and ?view=APT-0001)
  // ---------------------------------------------------------
  render();
  const params = new URLSearchParams(window.location.search);
  if (params.get("new") === "1") openForm();
  const viewParam = params.get("view");
  if (viewParam && appointments.some((a) => a.id === viewParam)) openView(viewParam);
});
