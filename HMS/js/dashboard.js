/* =========================================================
   dashboard.js — Builds the dashboard from the dummy data
   (Dynamic: everything is computed, nothing is hard-coded.)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const patients = HMSData.get("patients");
  const doctors = HMSData.get("doctors");
  const appointments = HMSData.get("appointments");
  const medicines = HMSData.get("medicines");
  const invoices = HMSData.get("invoices");
  const records = HMSData.get("medicalRecords");
  const today = HMSUtils.today();
  const esc = HMSUtils.escapeHtml;

  document.getElementById("todayLabel").textContent = HMSUtils.formatDate(today);

  // ----- 1. Statistic cards (each links to its module) -----
  const todayAppts = appointments.filter((a) => a.date === today);
  const pendingAppts = appointments.filter((a) => a.status === "Pending");
  const pendingBills = invoices.filter((i) => i.status === "Pending" || i.status === "Partially Paid");
  const stats = [
    ["Total Patients", patients.length, "patients.html"],
    ["Total Doctors", doctors.length, "doctors.html"],
    ["Today's Appointments", todayAppts.length, "appointments.html"],
    ["Pending Appointments", pendingAppts.length, "appointments.html"],
    ["Available Beds", HMSData.beds.total - HMSData.beds.occupied + " / " + HMSData.beds.total, "patients.html"],
    ["Pending Bills", pendingBills.length, "billing.html"],
    ["Pharmacy Items", medicines.length, "pharmacy.html"]
  ];
  document.getElementById("statCards").innerHTML = stats.map(([label, value, href]) =>
    `<a class="stat-card" href="${href}">
       <div class="stat-label">${label}</div><div class="stat-value">${value}</div>
     </a>`).join("");

  // ----- 2. Smart alerts -----
  const alerts = [];
  medicines.forEach((m) => {
    const s = HMSData.stockStatus(m);
    if (s === "Expired") alerts.push(["danger", "⛔", `${m.name} is EXPIRED`, "pharmacy.html"]);
    else if (s === "Out of Stock") alerts.push(["danger", "⛔", `${m.name} is OUT OF STOCK`, "pharmacy.html"]);
    else if (s === "Low Stock") alerts.push(["warning", "⚠", `${m.name}: low stock (${m.quantity} left)`, "pharmacy.html"]);
  });
  pendingBills.forEach((i) =>
    alerts.push(["warning", "💳", `Invoice ${i.id} (${HMSData.patientName(i.patientId)}) is ${i.status}`, "billing.html"]));
  records.filter((r) => r.followUp && r.followUp <= HMSData.offset(7)).forEach((r) =>
    alerts.push([r.followUp < today ? "danger" : "info", "🔁",
      `Follow-up ${r.followUp < today ? "OVERDUE" : "due"} for ${HMSData.patientName(r.patientId)} (${HMSUtils.formatDate(r.followUp)})`,
      "medical-records.html"]));
  todayAppts.filter((a) => a.status !== "Cancelled" && a.status !== "Completed").forEach((a) =>
    alerts.push(["info", "📅", `Upcoming today: ${HMSData.patientName(a.patientId)} at ${a.time}`, "appointments.html"]));

  document.getElementById("alertList").innerHTML = alerts.length
    ? alerts.map(([level, icon, text, href]) =>
        `<a class="alert-item ${level}" href="${href}"><span aria-hidden="true">${icon}</span><span>${esc(text)}</span></a>`).join("")
    : '<div class="empty-state">No alerts. Everything looks fine.</div>';

  // ----- 3. Today's schedule -----
  const badge = { Confirmed: "success", Completed: "success", Scheduled: "info", Pending: "warning", Cancelled: "danger" };
  const icon = { Confirmed: "✔", Completed: "✔", Scheduled: "🕒", Pending: "⏳", Cancelled: "✖" };
  document.getElementById("schedule").innerHTML = todayAppts.length
    ? `<table><thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead><tbody>` +
      todayAppts.sort((a, b) => a.time.localeCompare(b.time)).map((a) =>
        `<tr><td>${a.time}</td><td>${esc(HMSData.patientName(a.patientId))}</td><td>${esc(HMSData.doctorName(a.doctorId))}</td>
         <td><span class="badge badge-${badge[a.status]}">${icon[a.status]} ${a.status}</span></td></tr>`).join("") +
      `</tbody></table>`
    : '<div class="empty-state">No appointments scheduled for today.</div>';

  // ----- 4. Bar chart: appointments by status (pure CSS, no library) -----
  const statuses = ["Scheduled", "Confirmed", "Pending", "Completed", "Cancelled"];
  const counts = statuses.map((s) => appointments.filter((a) => a.status === s).length);
  const max = Math.max(...counts, 1);
  document.getElementById("chart").innerHTML = statuses.map((s, i) =>
    `<div class="bar-col"><strong>${counts[i]}</strong>
       <div class="bar" style="height:${(counts[i] / max) * 100}%"></div><span>${s}</span></div>`).join("");

  // ----- 5. Recent patients (last 4 added) -----
  document.getElementById("recentPatients").innerHTML =
    `<table><thead><tr><th>ID</th><th>Name</th><th>Doctor</th><th>Status</th></tr></thead><tbody>` +
    patients.slice(-4).reverse().map((p) =>
      `<tr><td>${p.id}</td><td>${esc(p.firstName + " " + p.lastName)}</td>
       <td>${esc(HMSData.doctorName(p.doctorId))}</td><td><span class="badge badge-info">${p.status}</span></td></tr>`).join("") +
    `</tbody></table>`;

  // ----- 6. Recent activities (sample log) -----
  const activities = [
    "Appointment APT-0006 scheduled for " + HMSUtils.formatDate(HMSData.offset(2)),
    "Invoice INV-0001 marked as Paid",
    "Medical record REC-0002 added by " + HMSData.doctorName("DOC-002"),
    "Medicine stock updated: Sample Pain Relief 400mg",
    "New patient registered: " + HMSData.patientName("PAT-0006")
  ];
  document.getElementById("activities").innerHTML = activities.map((a) => `<li>${esc(a)}</li>`).join("");
});
