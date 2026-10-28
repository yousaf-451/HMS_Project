/* =========================================================
   reports.js — Summary reports (Dynamic page: all numbers are computed)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const money = HMSUtils.money;

  const patients = HMSData.get("patients");
  const doctors = HMSData.get("doctors");
  const appointments = HMSData.get("appointments");
  const records = HMSData.get("medicalRecords");
  const invoices = HMSData.get("invoices");
  const medicines = HMSData.get("medicines");

  document.getElementById("reportMeta").textContent =
    "Generated on " + HMSUtils.formatDate(HMSUtils.today()) + " from the prototype's dummy data.";

  function countBy(list, keyFn) {
    const map = {};
    list.forEach((x) => { const k = keyFn(x); map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  // A bar PLUS the number, so the value never depends on the bar alone
  const bar = (v, max, showNumber = true) =>
    `<div class="meter"><span class="meter-track"><span class="meter-fill" style="width:${max ? Math.round((v / max) * 100) : 0}%"></span></span>${showNumber ? `<strong>${v}</strong>` : ""}</div>`;

  function countCard(title, pairs) {
    const max = Math.max(1, ...pairs.map((p) => p[1]));
    return `<section class="card"><h2>${title}</h2>` + (pairs.length
      ? `<div class="table-wrap"><table><thead><tr><th>Group</th><th>Count</th></tr></thead><tbody>` +
        pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${bar(v, max)}</td></tr>`).join("") + `</tbody></table></div>`
      : '<div class="empty-state">No data.</div>') + `</section>`;
  }

  function moneyCard(title, pairs) {
    const max = Math.max(1, ...pairs.map((p) => p[1]));
    return `<section class="card"><h2>${title}</h2>` + (pairs.length
      ? `<div class="table-wrap"><table><thead><tr><th>Group</th><th>Amount</th><th>Share</th></tr></thead><tbody>` +
        pairs.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${money(v)}</td><td>${bar(v, max, false)}</td></tr>`).join("") + `</tbody></table></div>`
      : '<div class="empty-state">No data.</div>') + `</section>`;
  }

  // Same category rule as billing.js (old dummy items have no stored category)
  function categoryOf(item) {
    if (item.category) return item.category;
    const n = item.name.toLowerCase();
    if (n.includes("consult")) return "Consultation";
    if (/lab|test|ecg|x-ray|scan/.test(n)) return "Laboratory";
    if (/medic|pharm/.test(n)) return "Pharmacy";
    return "Other";
  }

  const live = invoices.filter((i) => i.status !== "Cancelled");
  const billed = live.reduce((s, i) => s + HMSData.invoiceTotal(i), 0);
  const cards = [
    ["Patients", patients.length, "patients.html"], ["Doctors", doctors.length, "doctors.html"],
    ["Appointments", appointments.length, "appointments.html"], ["Medical records", records.length, "medical-records.html"],
    ["Invoices", invoices.length, "billing.html"], ["Total billed", money(billed), "billing.html"],
    ["Medicines", medicines.length, "pharmacy.html"]
  ];

  const byStatus = {};
  invoices.forEach((i) => { byStatus[i.status] = (byStatus[i.status] || 0) + HMSData.invoiceTotal(i); });
  const statusCounts = countBy(invoices, (i) => i.status);
  const billingByStatus = statusCounts.map(([s, n]) => [`${s} (${n} invoice${n === 1 ? "" : "s"})`, byStatus[s]]);

  const byCategory = {};
  live.forEach((inv) => {
    const sub = HMSData.invoiceSubtotal(inv) || 1;
    // Discount and tax are shared out in proportion, so category totals add up to the invoice total
    inv.items.forEach((it) => {
      const share = (Number(it.amount) / sub) * HMSData.invoiceTotal(inv);
      const c = categoryOf(it);
      byCategory[c] = (byCategory[c] || 0) + share;
    });
  });

  const stockValue = medicines.reduce((s, m) => s + m.quantity * m.price, 0);

  document.getElementById("reportRoot").innerHTML = `
    <section class="grid grid-stats" aria-label="Totals">
      ${cards.map(([l, v, href]) => `<a class="stat-card" href="${href}"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></a>`).join("")}
    </section>
    <div class="grid grid-2">
      ${countCard("Patients by status", countBy(patients, (p) => p.status))}
      ${countCard("Patients by gender", countBy(patients, (p) => p.gender))}
    </div>
    <div class="grid grid-2">
      ${countCard("Appointments by status", countBy(appointments, (a) => a.status))}
      ${countCard("Appointments by department", countBy(appointments, (a) => a.department))}
    </div>
    <div class="grid grid-2">
      ${moneyCard("Billing by payment status (with tax)", billingByStatus)}
      ${moneyCard("Charges by category (excluding cancelled)", Object.entries(byCategory).sort((a, b) => b[1] - a[1]))}
    </div>
    <div class="grid grid-2">
      ${countCard("Pharmacy by stock status", countBy(medicines, (m) => HMSData.stockStatus(m)))}
      ${countCard("Doctors by department", countBy(doctors, (d) => d.department))}
    </div>
    <p class="section-note">Pharmacy stock value (quantity × price, all items): <strong>${money(stockValue)}</strong>.
      Charges by category share each invoice's discount and tax in proportion, so the categories add up to the total billed.</p>`;

  document.getElementById("printReport").addEventListener("click", () => window.print());
});
