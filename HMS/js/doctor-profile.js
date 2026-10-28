/* =========================================================
   doctor-profile.js — Detailed doctor page
   URL: doctor-profile.html?id=DOC-001
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const root = document.getElementById("profileRoot");
  const id = new URLSearchParams(window.location.search).get("id");
  const d = HMSData.get("doctors").find((x) => x.id === id);

  if (!d) {
    root.innerHTML = `<div class="card empty-state"><h2>Doctor not found</h2>
      <p>No doctor with ID "${esc(id || "")}" exists.</p>
      <a class="btn btn-primary" href="doctors.html">Back to doctors</a></div>`;
    return;
  }

  const today = HMSUtils.today();
  const patients = HMSData.get("patients").filter((p) => p.doctorId === id);
  const allAppts = HMSData.get("appointments").filter((a) => a.doctorId === id);
  const current = allAppts
    .filter((a) => a.date >= today && !["Cancelled", "Completed"].includes(a.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const seenPatients = new Set(allAppts.map((a) => a.patientId)).size;

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chips = DAYS.map((day) => d.days.includes(day)
    ? `<span class="day-chip on">✔ ${day}</span>`
    : `<span class="day-chip">${day} (off)</span>`).join("");

  const initials = d.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const statusBadge = { Active: "success", "On Leave": "warning", Inactive: "danger" }[d.status] || "info";

  root.innerHTML = `
    <div class="page-header">
      <a href="doctors.html">← Back to doctors</a>
      <div>
        <a class="btn" href="appointments.html?new=1">Book appointment</a>
        <a class="btn btn-primary" href="doctors.html?edit=${d.id}">Edit doctor</a>
      </div>
    </div>

    <div class="profile-top">
      <div class="avatar" aria-hidden="true">${initials}</div>
      <div class="grow">
        <h1 style="margin:0">${esc(d.name)}</h1>
        <span class="text-muted">${d.id} · ${esc(d.specialization)} · ${esc(d.department)}</span>
      </div>
      <span class="badge badge-${statusBadge}">${d.status}</span>
    </div>

    <section class="grid grid-stats" aria-label="Doctor summary">
      <div class="stat-card"><div class="stat-label">Consultation fee</div><div class="stat-value">${HMSUtils.money(d.fee)}</div></div>
      <div class="stat-card"><div class="stat-label">Assigned patients</div><div class="stat-value">${patients.length}</div></div>
      <div class="stat-card"><div class="stat-label">Patients seen (appointments)</div><div class="stat-value">${seenPatients}</div></div>
      <div class="stat-card"><div class="stat-label">Upcoming appointments</div><div class="stat-value">${current.length}</div></div>
    </section>

    <div class="grid grid-2">
      <section class="card"><h2>Basic Information</h2>
        <dl class="detail-list">
          <dt>Specialization</dt><dd>${esc(d.specialization)}</dd>
          <dt>Department</dt><dd>${esc(d.department)}</dd>
          <dt>Qualification</dt><dd>${esc(d.qualification)}</dd>
          <dt>Experience</dt><dd>${d.experience} years</dd>
          <dt>Phone</dt><dd>${esc(d.phone)}</dd>
          <dt>Email</dt><dd>${esc(d.email)}</dd>
        </dl></section>
      <section class="card"><h2>Weekly Schedule</h2>
        <div class="day-chips">${chips}</div>
        <p style="margin-top:16px"><strong>Hours:</strong> ${d.time.replace("-", " – ")}</p>
        ${d.status !== "Active" ? `<p class="section-note">⚠ Status is "${d.status}", so this doctor is not taking appointments.</p>` : ""}
      </section>
    </div>

    <section class="card" style="margin-bottom:24px"><h2>Current Appointments (${current.length})</h2>
      ${current.length ? `<div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th><th>Reason</th></tr></thead>
        <tbody>${current.map((a) => `<tr><td>${a.id}</td><td>${HMSUtils.formatDate(a.date)}</td><td>${a.time}</td>
          <td><a href="patient-profile.html?id=${a.patientId}">${esc(HMSData.patientName(a.patientId))}</a></td>
          <td>${a.type}</td><td>${a.status}</td><td>${esc(a.reason)}</td></tr>`).join("")}</tbody></table></div>`
        : '<div class="empty-state">No upcoming appointments.</div>'}
      <p class="section-note"><a href="appointments.html">Open Appointments module</a></p>
    </section>

    <section class="card" style="margin-bottom:24px"><h2>Assigned Patients (${patients.length})</h2>
      ${patients.length ? `<div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Phone</th><th>Status</th></tr></thead>
        <tbody>${patients.map((p) => `<tr><td>${p.id}</td>
          <td><a href="patient-profile.html?id=${p.id}">${esc(p.firstName + " " + p.lastName)}</a></td>
          <td>${HMSUtils.calcAge(p.dob)}</td><td>${esc(p.phone)}</td><td>${p.status}</td></tr>`).join("")}</tbody></table></div>`
        : '<div class="empty-state">No patients assigned to this doctor.</div>'}
    </section>`;
});
