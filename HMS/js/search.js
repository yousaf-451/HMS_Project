/* =========================================================
   search.js — Global Hospital Search
   URL: search.html?q=text
   Every word must appear somewhere in a record ("sara cardio" works).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const money = HMSUtils.money;
  const box = document.getElementById("results");
  const query = (new URLSearchParams(window.location.search).get("q") || "").trim();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (query.length < 2) {
    document.getElementById("summary").textContent = "";
    box.innerHTML = `<div class="card empty-state">Type at least 2 characters in the search box above and press Enter.</div>`;
    return;
  }

  const matches = (...parts) => {
    const hay = parts.join(" ").toLowerCase();
    return terms.every((t) => hay.includes(t));
  };
  const pName = (id) => HMSData.patientName(id);
  const dName = (id) => HMSData.doctorName(id);

  const groups = [
    { title: "Patients", icon: "🧑", items: HMSData.get("patients")
        .filter((p) => matches(p.id, p.firstName, p.lastName, p.phone, p.email, p.bloodGroup, p.status, p.address, p.gender))
        .map((p) => ({ href: `patient-profile.html?id=${p.id}`, title: `${p.firstName} ${p.lastName} (${p.id})`,
          sub: `${HMSUtils.calcAge(p.dob)} years · ${p.gender} · ${p.status} · ${p.phone}` })) },

    { title: "Doctors", icon: "🩺", items: HMSData.get("doctors")
        .filter((d) => matches(d.id, d.name, d.specialization, d.department, d.email, d.status, d.qualification))
        .map((d) => ({ href: `doctor-profile.html?id=${d.id}`, title: `${d.name} (${d.id})`,
          sub: `${d.specialization} · ${d.department} · ${d.status}` })) },

    { title: "Appointments", icon: "📅", items: HMSData.get("appointments")
        .filter((a) => matches(a.id, pName(a.patientId), dName(a.doctorId), a.department, a.type, a.status, a.reason, a.date))
        .map((a) => ({ href: `appointments.html?view=${a.id}`, title: `${a.id}: ${pName(a.patientId)} with ${dName(a.doctorId)}`,
          sub: `${HMSUtils.formatDate(a.date)} at ${a.time} · ${a.type} · ${a.status}` })) },

    { title: "Medical records", icon: "📋", items: HMSData.get("medicalRecords")
        .filter((r) => matches(r.id, pName(r.patientId), dName(r.doctorId), r.diagnosis, r.symptoms, r.prescription, r.complaint))
        .map((r) => ({ href: `medical-records.html?view=${r.id}`, title: `${r.id}: ${r.diagnosis}`,
          sub: `${pName(r.patientId)} · ${HMSUtils.formatDate(r.visitDate)} · ${dName(r.doctorId)}` })) },

    { title: "Invoices", icon: "💳", items: HMSData.get("invoices")
        .filter((i) => matches(i.id, i.patientId, pName(i.patientId), i.status, ...i.items.map((x) => x.name)))
        .map((i) => ({ href: `billing.html?view=${i.id}`, title: `${i.id}: ${pName(i.patientId)}`,
          sub: `${HMSUtils.formatDate(i.date)} · ${money(HMSData.invoiceTotal(i))} · ${i.status}` })) },

    { title: "Medicines", icon: "💊", items: HMSData.get("medicines")
        .filter((m) => matches(m.id, m.name, m.category, m.manufacturer, m.batch, HMSData.stockStatus(m)))
        .map((m) => ({ href: `pharmacy.html?search=${encodeURIComponent(m.id)}`, title: `${m.name} (${m.id})`,
          sub: `${m.category} · ${m.quantity} ${m.unit} · ${HMSData.stockStatus(m)}` })) }
  ];

  const total = groups.reduce((s, g) => s + g.items.length, 0);
  document.getElementById("summary").textContent =
    `${total} result${total === 1 ? "" : "s"} for "${query}"`;

  if (!total) {
    box.innerHTML = `<div class="card empty-state"><h2>No results</h2>
      <p>Nothing matches "${esc(query)}". Try a patient name, an ID such as PAT-0001, a medicine, or a status such as "pending".</p></div>`;
    return;
  }

  box.innerHTML = groups.filter((g) => g.items.length).map((g) => `
    <section class="card result-group" aria-label="${g.title}">
      <h2>${g.icon} ${g.title} (${g.items.length})</h2>
      <ul class="result-list">
        ${g.items.map((i) => `<li><a href="${i.href}">${esc(i.title)}</a><small>${esc(i.sub)}</small></li>`).join("")}
      </ul>
    </section>`).join("");
});
