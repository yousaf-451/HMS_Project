/* =========================================================
   patient-profile.js — Detailed patient page
   URL: patient-profile.html?id=PAT-0001
   Includes the combined timeline (appointments, diagnoses,
   prescriptions, invoices, pharmacy dispensing).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const root = document.getElementById("profileRoot");
  const id = new URLSearchParams(window.location.search).get("id");
  const p = HMSData.get("patients").find((x) => x.id === id);

  // Patient not found (bad or deleted ID)
  if (!p) {
    root.innerHTML = `<div class="card empty-state"><h2>Patient not found</h2>
      <p>No patient with ID "${esc(id || "")}" exists.</p>
      <a class="btn btn-primary" href="patients.html">Back to patients</a></div>`;
    return;
  }

  const appts = HMSData.get("appointments").filter((a) => a.patientId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const records = HMSData.get("medicalRecords").filter((r) => r.patientId === id)
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  const invoices = HMSData.get("invoices").filter((i) => i.patientId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const doctor = HMSData.get("doctors").find((d) => d.id === p.doctorId);

  const tableOrEmpty = (headers, bodyRows, emptyText) => bodyRows.length
    ? `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
       <tbody>${bodyRows.join("")}</tbody></table></div>`
    : `<div class="empty-state">${emptyText}</div>`;

  const totalBilled = invoices.reduce((s, i) => s + HMSData.invoiceTotal(i), 0);
  const unpaidCount = invoices.filter((i) => ["Pending", "Partially Paid"].includes(i.status)).length;
  const initials = (p.firstName[0] + p.lastName[0]).toUpperCase();

  root.innerHTML = `
    <div class="page-header">
      <a href="patients.html">← Back to patients</a>
      <div>
        <button class="btn" id="printBtn" type="button">🖨 Print summary</button>
        <a class="btn btn-primary" href="patients.html?edit=${p.id}">Edit patient</a>
      </div>
    </div>

    <div class="profile-top">
      <div class="avatar" aria-hidden="true">${initials}</div>
      <div class="grow">
        <h1 style="margin:0">${esc(p.firstName + " " + p.lastName)}</h1>
        <span class="text-muted">${p.id} · ${HMSUtils.calcAge(p.dob)} years · ${p.gender} · Blood group ${p.bloodGroup}</span>
      </div>
      <span class="badge badge-info">${p.status}</span>
    </div>

    <div class="grid grid-2">
      <section class="card"><h2>Personal Information</h2>
        <dl class="detail-list">
          <dt>Date of birth</dt><dd>${HMSUtils.formatDate(p.dob)}</dd>
          <dt>Gender</dt><dd>${p.gender}</dd>
          <dt>Blood group</dt><dd>${p.bloodGroup}</dd>
          <dt>Medical notes</dt><dd>${esc(p.notes) || "—"}</dd>
        </dl></section>
      <section class="card"><h2>Contact Information</h2>
        <dl class="detail-list">
          <dt>Phone</dt><dd>${esc(p.phone)}</dd>
          <dt>Email</dt><dd>${esc(p.email) || "—"}</dd>
          <dt>Address</dt><dd>${esc(p.address)}</dd>
          <dt>Emergency contact</dt><dd>${esc(p.emergencyName)} (${esc(p.emergencyPhone)})</dd>
        </dl></section>
    </div>

    <section class="card" style="margin-bottom:24px"><h2>Assigned Doctor</h2>
      ${doctor
        ? `<dl class="detail-list"><dt>Name</dt><dd>${esc(doctor.name)}</dd>
           <dt>Specialization</dt><dd>${esc(doctor.specialization)}</dd>
           <dt>Department</dt><dd>${esc(doctor.department)}</dd>
           <dt>Consultation fee</dt><dd>${HMSUtils.money(doctor.fee)}</dd></dl>`
        : '<div class="empty-state">No doctor assigned (or doctor was deleted).</div>'}
    </section>

    <section class="card" style="margin-bottom:24px"><h2>Appointment History (${appts.length})</h2>
      ${tableOrEmpty(["ID", "Date", "Time", "Doctor", "Type", "Status", "Reason"],
        appts.map((a) => `<tr><td>${a.id}</td><td>${HMSUtils.formatDate(a.date)}</td><td>${a.time}</td>
          <td>${esc(HMSData.doctorName(a.doctorId))}</td><td>${a.type}</td><td>${a.status}</td><td>${esc(a.reason)}</td></tr>`),
        "No appointments yet.")}
      <p class="section-note"><a href="appointments.html">Open Appointments module</a></p>
    </section>

    <section class="card" style="margin-bottom:24px"><h2>Medical Record Summary (${records.length})</h2>
      ${tableOrEmpty(["Record", "Visit date", "Doctor", "Diagnosis", "Follow-up"],
        records.map((r) => `<tr><td>${r.id}</td><td>${HMSUtils.formatDate(r.visitDate)}</td>
          <td>${esc(HMSData.doctorName(r.doctorId))}</td><td>${esc(r.diagnosis)}</td><td>${HMSUtils.formatDate(r.followUp)}</td></tr>`),
        "No medical records yet.")}
      <p class="section-note"><a href="medical-records.html?patient=${p.id}">Open full history in Medical Records</a></p>
    </section>

    <section class="card" style="margin-bottom:24px"><h2>Prescriptions / Medicines</h2>
      ${tableOrEmpty(["Date", "Medicine (sample)", "Prescribed by"],
        records.filter((r) => r.prescription).map((r) => `<tr><td>${HMSUtils.formatDate(r.visitDate)}</td>
          <td>${esc(r.prescription)}</td><td>${esc(HMSData.doctorName(r.doctorId))}</td></tr>`),
        "No prescriptions recorded.")}
    </section>

    <section class="card" style="margin-bottom:24px"><h2>Billing Summary</h2>
      <p><strong>Total billed:</strong> ${HMSUtils.money(totalBilled)} &nbsp;|&nbsp;
         <strong>Unpaid / partly paid invoices:</strong> ${unpaidCount}</p>
      ${tableOrEmpty(["Invoice", "Date", "Total", "Status"],
        invoices.map((i) => `<tr><td><a href="billing.html?view=${i.id}">${i.id}</a></td><td>${HMSUtils.formatDate(i.date)}</td>
          <td>${HMSUtils.money(HMSData.invoiceTotal(i))}</td><td>${i.status}</td></tr>`),
        "No invoices yet.")}
      <p class="section-note"><a href="billing.html?patient=${p.id}">View this patient's invoices</a> ·
      <a href="billing.html?new=1&patient=${p.id}">Create invoice</a></p>
    </section>

    <section class="card" style="margin-bottom:24px"><h2>Patient Timeline</h2>
      <div class="timeline-tools">
        <label for="tlFilter">Show:</label>
        <select id="tlFilter">
          <option value="">Everything</option><option value="appt">Appointments</option>
          <option value="record">Diagnoses</option><option value="rx">Prescriptions</option>
          <option value="bill">Billing</option><option value="disp">Pharmacy dispensing</option>
        </select>
      </div>
      <div id="timelineBox" aria-live="polite"></div>
    </section>

    <p class="section-note">Prototype data is fictional and stored only in this browser.</p>`;

  // Print uses the browser's print dialog (sidebar/header are hidden by print CSS)
  document.getElementById("printBtn").addEventListener("click", () => window.print());

  // ---------------------------------------------------------
  // Combined timeline: 5 kinds of events, newest first
  // ---------------------------------------------------------
  const todayIso = HMSUtils.today();
  const sales = HMSStore.load("pharmacySales", []).filter((s) => s.patientId === id);
  const events = [];

  appts.forEach((a) => events.push({
    date: a.date, time: a.time, type: "appt", tag: "Appointment", href: `appointments.html?view=${a.id}`,
    title: `${a.type} with ${HMSData.doctorName(a.doctorId)} at ${a.time}`,
    detail: `${a.date > todayIso && !["Cancelled", "Completed"].includes(a.status) ? "Upcoming · " : ""}${a.status} · ${a.reason}`
  }));
  records.forEach((r) => {
    events.push({ date: r.visitDate, time: "", type: "record", tag: "Diagnosis", href: `medical-records.html?view=${r.id}`,
      title: r.diagnosis, detail: `Seen by ${HMSData.doctorName(r.doctorId)} · ${r.id}` });
    if (r.prescription) events.push({ date: r.visitDate, time: "", type: "rx", tag: "Prescription",
      href: `medical-records.html?view=${r.id}`, title: r.prescription, detail: `Prescribed by ${HMSData.doctorName(r.doctorId)}` });
  });
  invoices.forEach((i) => events.push({
    date: i.date, time: "", type: "bill", tag: "Billing", href: `billing.html?view=${i.id}`,
    title: `Invoice ${i.id}: ${HMSUtils.money(HMSData.invoiceTotal(i))}`, detail: i.status
  }));
  sales.forEach((s) => events.push({
    date: s.date, time: s.time, type: "disp", tag: "Pharmacy", href: "pharmacy.html?tab=dispense",
    title: `${s.qty} ${s.unit} of ${s.medicineName} dispensed`, detail: HMSUtils.money(s.amount)
  }));
  events.sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")));

  function renderTimeline() {
    const f = document.getElementById("tlFilter").value;
    const list = events.filter((e) => !f || e.type === f);
    document.getElementById("timelineBox").innerHTML = list.length
      ? `<ol class="timeline">` + list.map((e) => `
          <li class="tl-item tl-${e.type}">
            <div class="tl-date">${HMSUtils.formatDate(e.date)}<span class="tl-tag">${e.tag}</span></div>
            <div class="tl-card"><p><a href="${e.href}"><strong>${esc(e.title)}</strong></a></p>
              <p class="text-muted">${esc(e.detail)}</p></div>
          </li>`).join("") + `</ol>`
      : '<div class="empty-state">No events of this type for this patient yet.</div>';
  }
  document.getElementById("tlFilter").addEventListener("change", renderTimeline);
  renderTimeline();
});
