/* =========================================================
   medical-records.js — Medical Records module
   List → filters → add/edit (validated) → details → patient history
   All clinical data is fictional. No medical advice is generated.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const $ = (id) => document.getElementById(id);

  let records = HMSData.get("medicalRecords");
  const patients = HMSData.get("patients");
  const doctors = HMSData.get("doctors");
  const today = HMSUtils.today();
  let editingId = null;
  let view = "list";

  const has = (x) => x !== "" && x != null;
  const dayDiff = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);

  function vitalChips(r) {
    const chips = [];
    if (has(r.bp)) chips.push(`BP ${esc(r.bp)}`);
    if (has(r.heartRate)) chips.push(`HR ${r.heartRate} bpm`);
    if (has(r.temperature)) chips.push(`${r.temperature} °C`);
    if (has(r.weight)) chips.push(`${r.weight} kg`);
    return chips.length ? chips.map((c) => `<span class="vital">${c}</span>`).join("") : "—";
  }

  // Follow-up: text + icon badge (never color alone)
  function followUp(r) {
    if (!r.followUp) return "—";
    const n = dayDiff(r.followUp);
    const date = HMSUtils.formatDate(r.followUp);
    if (n < 0) return `<span class="badge badge-danger">⚠ Overdue</span><br><small>${date}</small>`;
    if (n === 0) return `<span class="badge badge-warning">🔁 Due today</span>`;
    if (n <= 7) return `<span class="badge badge-warning">🔁 Due in ${n} day${n === 1 ? "" : "s"}</span><br><small>${date}</small>`;
    return date;
  }

  // ---------------------------------------------------------
  // 1. LIST + FILTERS
  // ---------------------------------------------------------
  $("doctorFilter").insertAdjacentHTML("beforeend",
    doctors.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join(""));

  function getFiltered() {
    const q = $("searchBox").value.trim().toLowerCase();
    const f = $("followFilter").value;
    return records.filter((r) => {
      const hay = [r.id, HMSData.patientName(r.patientId), HMSData.doctorName(r.doctorId),
                   r.diagnosis, r.symptoms, r.prescription, r.complaint].join(" ").toLowerCase();
      const n = r.followUp ? dayDiff(r.followUp) : null;
      const followOk = !f || (f === "none" && !r.followUp) ||
                       (f === "overdue" && n !== null && n < 0) ||
                       (f === "soon" && n !== null && n >= 0 && n <= 7);
      return (!q || hay.includes(q)) &&
             (!$("doctorFilter").value || r.doctorId === $("doctorFilter").value) && followOk;
    }).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }

  function renderList() {
    const list = getFiltered();
    $("resultCount").textContent = `Showing ${list.length} of ${records.length} records`;
    if (!list.length) {
      $("recordRows").innerHTML = `<tr><td colspan="9" class="empty-state">No medical records match your search or filters.</td></tr>`;
      return;
    }
    $("recordRows").innerHTML = list.map((r) => `<tr>
      <td>${r.id}</td>
      <td><a href="patient-profile.html?id=${r.patientId}">${esc(HMSData.patientName(r.patientId))}</a></td>
      <td>${esc(HMSData.doctorName(r.doctorId))}</td>
      <td>${HMSUtils.formatDate(r.visitDate)}</td>
      <td>${esc(r.diagnosis)}</td>
      <td>${vitalChips(r)}</td>
      <td>${esc(r.prescription) || "—"}</td>
      <td>${followUp(r)}</td>
      <td><div class="actions-cell">
        <button class="btn btn-sm" data-view="${r.id}" type="button">View</button>
        <button class="btn btn-sm" data-edit="${r.id}" type="button">Edit</button>
      </div></td>
    </tr>`).join("");
  }

  $("searchBox").addEventListener("input", HMSUtils.debounce(renderList, 150));
  ["doctorFilter", "followFilter"].forEach((id) => $(id).addEventListener("change", renderList));
  $("clearFilters").addEventListener("click", () => {
    $("searchBox").value = ""; $("doctorFilter").value = ""; $("followFilter").value = ""; renderList();
  });

  // One listener handles View/Edit buttons in both the list and the timeline
  document.querySelector(".content").addEventListener("click", (e) => {
    const v = e.target.closest("[data-view]");
    const ed = e.target.closest("[data-edit]");
    if (v) openView(v.dataset.view);
    if (ed) openForm(ed.dataset.edit);
  });

  // ---------------------------------------------------------
  // 2. PATIENT HISTORY
  // ---------------------------------------------------------
  function fillHistoryPatients(selected) {
    $("historyPatient").innerHTML = '<option value="">Select a patient...</option>' + patients.map((p) => {
      const n = records.filter((r) => r.patientId === p.id).length;
      return `<option value="${p.id}">${p.id} — ${esc(p.firstName + " " + p.lastName)} (${n} record${n === 1 ? "" : "s"})</option>`;
    }).join("");
    $("historyPatient").value = selected || "";
  }

  function renderHistory() {
    const id = $("historyPatient").value;
    const box = $("historyBody");
    if (!id) { box.innerHTML = '<div class="empty-state">Choose a patient to see their medical history.</div>'; return; }
    const p = patients.find((x) => x.id === id);
    const list = records.filter((r) => r.patientId === id).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
    const head = `<div class="history-head">
        <div><h2 style="margin:0">${esc(p.firstName + " " + p.lastName)}</h2>
          <span class="text-muted">${p.id} · ${HMSUtils.calcAge(p.dob)} years · ${p.gender} · Blood group ${p.bloodGroup}</span></div>
        <div><a class="btn" href="patient-profile.html?id=${p.id}">Open patient profile</a>
          <button class="btn btn-primary" type="button" id="historyAdd">+ Add record</button></div>
      </div>`;
    if (!list.length) {
      box.innerHTML = head + '<div class="empty-state">This patient has no medical records yet.</div>';
    } else {
      box.innerHTML = head + `<ol class="timeline">` + list.map((r) => `
        <li class="tl-item">
          <div class="tl-date">${HMSUtils.formatDate(r.visitDate)} · ${r.id}</div>
          <div class="tl-card">
            <p><strong>${esc(r.diagnosis)}</strong> — ${esc(HMSData.doctorName(r.doctorId))}</p>
            ${r.complaint ? `<p><em>Complaint:</em> ${esc(r.complaint)}</p>` : ""}
            ${r.symptoms ? `<p><em>Symptoms:</em> ${esc(r.symptoms)}</p>` : ""}
            <p>${vitalChips(r)}</p>
            <p><em>Treatment:</em> ${esc(r.treatment)}</p>
            ${r.prescription ? `<p><em>Prescription:</em> ${esc(r.prescription)}</p>` : ""}
            ${r.labNotes ? `<p><em>Lab notes:</em> ${esc(r.labNotes)}</p>` : ""}
            ${r.followUp ? `<p><em>Follow-up:</em> ${followUp(r).replace("<br>", " ")}</p>` : ""}
            <button class="btn btn-sm" data-view="${r.id}" type="button">Details</button>
          </div>
        </li>`).join("") + `</ol>
        <p class="section-note">The patient profile page shows a fuller timeline that also includes appointments and billing.</p>`;
    }
    $("historyAdd").addEventListener("click", () => openForm(null, id));
  }
  $("historyPatient").addEventListener("change", renderHistory);

  function setView(v, patientId) {
    view = v;
    $("listView").classList.toggle("hidden", v !== "list");
    $("historyView").classList.toggle("hidden", v !== "history");
    $("listViewBtn").setAttribute("aria-pressed", v === "list");
    $("historyViewBtn").setAttribute("aria-pressed", v === "history");
    if (v === "history") {
      fillHistoryPatients(patientId || $("historyPatient").value ||
        (records[0] ? records[0].patientId : ""));
      renderHistory();
    } else renderList();
  }
  $("listViewBtn").addEventListener("click", () => setView("list"));
  $("historyViewBtn").addEventListener("click", () => setView("history"));

  function refresh() {
    if (view === "history") { fillHistoryPatients($("historyPatient").value); renderHistory(); }
    else renderList();
  }

  // ---------------------------------------------------------
  // 3. ADD / EDIT FORM
  // ---------------------------------------------------------
  $("rPatient").innerHTML = '<option value="">Select...</option>' +
    patients.map((p) => `<option value="${p.id}">${p.id} — ${esc(p.firstName + " " + p.lastName)}</option>`).join("");

  function fillDoctors(selected) {
    const list = doctors.filter((d) => d.status === "Active" || d.id === selected);
    $("rDoctor").innerHTML = '<option value="">Select...</option>' + list.map((d) =>
      `<option value="${d.id}">${esc(d.name)} — ${esc(d.specialization)}</option>`).join("");
  }

  $("rPatient").addEventListener("change", () => {
    const p = patients.find((x) => x.id === $("rPatient").value);
    if (p && !$("rDoctor").value && doctors.some((d) => d.id === p.doctorId && d.status === "Active")) {
      $("rDoctor").value = p.doctorId;
    }
  });

  function openForm(id = null, presetPatient = "") {
    editingId = id;
    HMSValidate.clearAll($("recordForm"));
    $("recordForm").reset();
    $("rVisit").max = today;
    $("recordModalTitle").textContent = id ? "Edit Medical Record" : "Add Medical Record";
    $("saveRecordBtn").textContent = id ? "Save Changes" : "Save Record";
    $("rId").value = id || HMSUtils.nextId("REC", records, "id");

    if (id) {
      const r = records.find((x) => x.id === id);
      fillDoctors(r.doctorId);
      $("rPatient").value = r.patientId; $("rDoctor").value = r.doctorId; $("rVisit").value = r.visitDate;
      $("rComplaint").value = r.complaint || ""; $("rSymptoms").value = r.symptoms || "";
      $("rBp").value = r.bp || ""; $("rHr").value = has(r.heartRate) ? r.heartRate : "";
      $("rTemp").value = has(r.temperature) ? r.temperature : ""; $("rWeight").value = has(r.weight) ? r.weight : "";
      $("rDiagnosis").value = r.diagnosis; $("rTreatment").value = r.treatment;
      $("rPrescription").value = r.prescription || ""; $("rLab").value = r.labNotes || "";
      $("rFollow").value = r.followUp || "";
    } else {
      fillDoctors("");
      $("rVisit").value = today;
      if (presetPatient && patients.some((p) => p.id === presetPatient)) {
        $("rPatient").value = presetPatient;
        $("rPatient").dispatchEvent(new Event("change"));
      }
    }
    HMSUI.open("recordModal");
  }
  $("addRecordBtn").addEventListener("click", () => openForm());

  // ---------------------------------------------------------
  // 4. VALIDATION
  // ---------------------------------------------------------
  const textRule = (label, min, max, required = true) => (v) => {
    v = v.trim();
    if (!v) return required ? `${label} is required.` : "";
    if (v.length < min) return `${label} must be at least ${min} characters.`;
    return v.length > max ? `${label} must be ${max} characters or fewer.` : "";
  };

  const validators = {
    rPatient: (v) => HMSValidate.required(v, "Patient"),
    rDoctor: (v) => HMSValidate.required(v, "Doctor"),
    rVisit: (v) => {
      if (!v) return "Visit date is required.";
      if (isNaN(new Date(v + "T00:00:00"))) return "Enter a valid date.";
      if (v > today) return "Visit date cannot be in the future.";
      const p = patients.find((x) => x.id === $("rPatient").value);
      if (p && v < p.dob) return "Visit date cannot be before the patient's date of birth.";
      return "";
    },
    rComplaint: textRule("Chief complaint", 3, 100),
    rSymptoms: textRule("Symptoms", 0, 200, false),
    rBp: (v) => {
      v = v.trim();
      if (!v) return "";
      const m = /^(\d{2,3})\/(\d{2,3})$/.exec(v);
      if (!m) return "Use the format 120/80 (systolic/diastolic).";
      const sys = Number(m[1]), dia = Number(m[2]);
      if (sys < 70 || sys > 250) return "Systolic pressure must be between 70 and 250.";
      if (dia < 40 || dia > 150) return "Diastolic pressure must be between 40 and 150.";
      if (sys <= dia) return "Systolic pressure must be higher than diastolic.";
      return "";
    },
    rHr: (v) => HMSValidate.numberRange(v, 30, 220, "Heart rate", true, false),
    rTemp: (v) => HMSValidate.numberRange(v, 30, 45, "Temperature", false, false),
    rWeight: (v) => HMSValidate.numberRange(v, 1, 300, "Weight", false, false),
    rDiagnosis: textRule("Diagnosis", 3, 100),
    rTreatment: textRule("Treatment", 3, 300),
    rPrescription: textRule("Prescription", 0, 200, false),
    rLab: textRule("Lab notes", 0, 300, false),
    rFollow: (v) => {
      if (!v) return "";
      if (isNaN(new Date(v + "T00:00:00"))) return "Enter a valid date.";
      const visit = $("rVisit").value;
      if (visit && v < visit) return "Follow-up date cannot be before the visit date.";
      if (visit) {
        const limit = new Date(visit + "T00:00:00");
        limit.setFullYear(limit.getFullYear() + 1);
        if (v > HMSUtils.toISO(limit)) return "Follow-up must be within 12 months of the visit.";
      }
      return "";
    }
  };

  Object.keys(validators).forEach((id) =>
    $(id).addEventListener("blur", () => HMSValidate.setError(id, validators[id]($(id).value))));
  $("rVisit").addEventListener("change", () => {
    if ($("rFollow").value) HMSValidate.setError("rFollow", validators.rFollow($("rFollow").value));
  });

  $("recordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!HMSValidate.runAll(validators)) {
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const num = (id) => ($(id).value.trim() === "" ? "" : Number($(id).value));
    const record = {
      id: $("rId").value,
      patientId: $("rPatient").value, doctorId: $("rDoctor").value, visitDate: $("rVisit").value,
      complaint: $("rComplaint").value.trim(), symptoms: $("rSymptoms").value.trim(),
      bp: $("rBp").value.trim(), heartRate: num("rHr"), temperature: num("rTemp"), weight: num("rWeight"),
      diagnosis: $("rDiagnosis").value.trim(), treatment: $("rTreatment").value.trim(),
      prescription: $("rPrescription").value.trim(), labNotes: $("rLab").value.trim(),
      followUp: $("rFollow").value
    };
    if (editingId) {
      records = records.map((r) => (r.id === editingId ? record : r));
      HMSLayout.toast(`Record ${record.id} updated successfully.`);
    } else {
      records.push(record);
      HMSLayout.toast(`Record ${record.id} added for ${HMSData.patientName(record.patientId)}.`);
    }
    HMSData.set("medicalRecords", records);
    HMSUI.close("recordModal");
    refresh();
  });

  // ---------------------------------------------------------
  // 5. DETAILS MODAL
  // ---------------------------------------------------------
  function openView(id) {
    const r = records.find((x) => x.id === id);
    $("viewTitle").textContent = "Medical Record " + r.id;
    $("viewBody").innerHTML = `
      <dl class="detail-list">
        <dt>Patient</dt><dd><a href="patient-profile.html?id=${r.patientId}">${esc(HMSData.patientName(r.patientId))}</a> (${r.patientId})</dd>
        <dt>Doctor</dt><dd><a href="doctor-profile.html?id=${r.doctorId}">${esc(HMSData.doctorName(r.doctorId))}</a></dd>
        <dt>Visit date</dt><dd>${HMSUtils.formatDate(r.visitDate)}</dd>
        <dt>Chief complaint</dt><dd>${esc(r.complaint) || "—"}</dd>
        <dt>Symptoms</dt><dd>${esc(r.symptoms) || "—"}</dd>
        <dt>Vital signs</dt><dd>${vitalChips(r)}</dd>
        <dt>Diagnosis</dt><dd>${esc(r.diagnosis)}</dd>
        <dt>Treatment</dt><dd>${esc(r.treatment)}</dd>
        <dt>Prescription</dt><dd>${esc(r.prescription) || "—"}</dd>
        <dt>Lab / test notes</dt><dd>${esc(r.labNotes) || "—"}</dd>
        <dt>Follow-up</dt><dd>${followUp(r).replace("<br>", " ")}</dd>
      </dl>`;
    $("viewFooter").innerHTML = `
      <button class="btn" type="button" data-close>Close</button>
      <button class="btn" type="button" id="viewHistoryBtn">Patient history</button>
      <button class="btn btn-primary" type="button" id="viewEditBtn">Edit record</button>`;
    $("viewHistoryBtn").addEventListener("click", () => { HMSUI.close("viewModal"); setView("history", r.patientId); });
    $("viewEditBtn").addEventListener("click", () => { HMSUI.close("viewModal"); openForm(r.id); });
    if ($("viewModal").classList.contains("hidden")) HMSUI.open("viewModal");
  }

  // ---------------------------------------------------------
  // 6. START
  //   ?new=1&patient=PAT-0001   open the add form (used by Appointments)
  //   ?patient=PAT-0001         open that patient's history
  //   ?view=REC-0001            open one record's details
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const pParam = params.get("patient");
  if (params.get("new") === "1") { renderList(); openForm(null, pParam || ""); }
  else if (pParam && patients.some((p) => p.id === pParam)) setView("history", pParam);
  else renderList();
  const viewParam = params.get("view");
  if (viewParam && records.some((r) => r.id === viewParam)) openView(viewParam);
});
