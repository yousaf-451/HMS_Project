/* =========================================================
   selftest.js — Automatic checks for the HMS prototype.
   Reads the SAME data the app uses (localStorage), so it also
   catches problems created by your own testing.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("out");
  let pass = 0, fail = 0, list = null;

  function section(title) {
    out.insertAdjacentHTML("beforeend", `<h2>${title}</h2><ul></ul>`);
    list = out.lastElementChild;
  }
  function check(name, ok, detail = "") {
    ok ? pass++ : fail++;
    const li = document.createElement("li");
    li.className = ok ? "test-ok" : "test-fail";
    li.textContent = (ok ? "PASS: " : "FAIL: ") + name + (!ok && detail ? " (" + detail + ")" : "");
    list.appendChild(li);
  }
  function finish() {
    const s = document.getElementById("summary");
    s.textContent = `${pass} passed, ${fail} failed`;
    s.className = fail ? "test-fail" : "test-ok";
  }
  const same = (a, b) => Math.abs(a - b) < 0.001;

  // ---------- 1. Data integrity ----------
  const D = {};
  ["patients", "doctors", "appointments", "medicalRecords", "invoices", "medicines"]
    .forEach((k) => (D[k] = HMSData.get(k)));
  const dayOf = (iso) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(iso + "T00:00:00").getDay()];

  section("1. Data integrity");
  Object.entries(D).forEach(([k, rows]) => {
    const dups = rows.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
    check(`${k}: IDs are unique`, !dups.length, dups.join(", "));
  });
  const idSet = (k) => new Set(D[k].map((r) => r.id));
  const orphans = (rows, field, k) => rows.filter((r) => !idSet(k).has(r[field])).map((r) => r.id);
  [["patients", "doctorId", "doctors"], ["appointments", "patientId", "patients"],
   ["appointments", "doctorId", "doctors"], ["medicalRecords", "patientId", "patients"],
   ["medicalRecords", "doctorId", "doctors"], ["invoices", "patientId", "patients"]
  ].forEach(([from, field, to]) => {
    const o = orphans(D[from], field, to);
    check(`${from}.${field} points to an existing ${to} record`, !o.length,
      o.join(", ") + " (deleting a record leaves these by design; Reset demo data clears them)");
  });

  const live = D.appointments.filter((a) => a.status !== "Cancelled");
  const outside = live.filter((a) => {
    const d = D.doctors.find((x) => x.id === a.doctorId);
    return d && !d.days.includes(dayOf(a.date));
  }).map((a) => a.id);
  check("Appointments fall on a day the doctor works", !outside.length, outside.join(", "));

  const offGrid = D.appointments.filter((a) => Number(a.time.slice(3)) % 30 !== 0).map((a) => a.id);
  check("Appointment times are on the 30-minute grid", !offGrid.length, offGrid.join(", "));

  const keys = live.map((a) => a.doctorId + a.date + a.time);
  check("No double-booked doctor/date/time", keys.length === new Set(keys).size);

  check("Every invoice has items and a valid total",
    D.invoices.every((i) => i.items.length > 0 && isFinite(HMSData.invoiceTotal(i)) && HMSData.invoiceTotal(i) >= 0));
  check("Partially paid invoices have an amount paid below the total",
    D.invoices.filter((i) => i.status === "Partially Paid")
      .every((i) => Number(i.amountPaid) > 0 && Number(i.amountPaid) < HMSData.invoiceTotal(i)));
  check("Medicine quantities are whole numbers, 0 or more",
    D.medicines.every((m) => Number.isInteger(Number(m.quantity)) && Number(m.quantity) >= 0));

  // ---------- 2. Validation rules ----------
  const V = HMSValidate;
  section("2. Validation rules");
  check("Valid phone accepted", V.phone("0300-1234567", "Phone") === "");
  check("Bad phone rejected", V.phone("12345", "Phone") !== "");
  check("Empty required phone rejected", V.phone("", "Phone") !== "");
  check("Empty optional phone accepted", V.phone("", "Phone", false) === "");
  check("Valid email accepted", V.email("a@b.co") === "");
  check("Bad email rejected", V.email("abc") !== "");
  check("Empty optional email accepted", V.email("", "Email", false) === "");
  check("Name with digits rejected", V.personName("John123", "Name") !== "");
  check("Name with hyphen accepted", V.personName("Mary-Ann", "Name") === "");
  check("Future date of birth rejected", V.dob(HMSData.offset(5)) !== "");
  check("Normal date of birth accepted", V.dob("1990-01-01") === "");
  check("Number above range rejected", V.numberRange("70", 0, 60, "Value") !== "");
  check("Decimal rejected when whole number needed", V.numberRange("2.5", 0, 60, "Value", true) !== "");
  check("Empty optional number accepted", V.numberRange("", 0, 10, "Value", false, false) === "");

  // ---------- 3. Calculations ----------
  section("3. Calculations");
  check("Invoice: (100 - 10) + 5% tax = 94.50",
    same(HMSData.invoiceTotal({ items: [{ amount: 100 }], discount: 10, taxRate: 5 }), 94.5));
  check("Invoice: no discount, no tax = subtotal",
    same(HMSData.invoiceTotal({ items: [{ amount: 30 }, { amount: 20 }], discount: 0, taxRate: 0 }), 50));
  const med = (qty, days) => ({ quantity: qty, expiry: HMSData.offset(days) });
  check("Stock: quantity 21 is In Stock", HMSData.stockStatus(med(21, 100)) === "In Stock");
  check("Stock: quantity 20 is Low Stock", HMSData.stockStatus(med(20, 100)) === "Low Stock");
  check("Stock: quantity 0 is Out of Stock", HMSData.stockStatus(med(0, 100)) === "Out of Stock");
  check("Stock: past expiry is Expired (even with quantity 0)", HMSData.stockStatus(med(0, -1)) === "Expired");

  // ---------- 4. Helper functions ----------
  section("4. Helper functions");
  check("Money format", HMSUtils.money(1234.5) === "$1,234.50");
  check("Next ID", HMSUtils.nextId("PAT", [{ id: "PAT-0009" }], "id") === "PAT-0010");
  check("Local date helper (no time-zone shift)", HMSUtils.toISO(new Date(2026, 0, 5)) === "2026-01-05");
  check("Age calculation", HMSUtils.calcAge("2000-01-01") >= 26);
  check("escapeHtml escapes quotes and tags", HMSUtils.escapeHtml('a"b<c>') === "a&quot;b&lt;c&gt;");
  check("Storage save/load works", (() => {
    HMSStore.save("selftest", { ok: 1 });
    const ok = HMSStore.load("selftest", null).ok === 1;
    HMSStore.remove("selftest");
    return ok;
  })());

  // ---------- 5. Navigation: do all pages exist? ----------
  const pages = ["index.html", "about.html", "dashboard.html", "patients.html", "patient-profile.html", "doctors.html",
    "doctor-profile.html", "appointments.html", "medical-records.html", "billing.html", "pharmacy.html",
    "reports.html", "notifications.html", "search.html"];

  section("5. Navigation: page files");
  if (location.protocol.startsWith("http")) {
    Promise.all(pages.map((p) =>
      fetch(p, { method: "HEAD" }).then((r) => [p, r.ok]).catch(() => [p, false])
    )).then((results) => {
      results.forEach(([p, ok]) => check(p + " exists", ok));
      finish();
    });
  } else {
    list.insertAdjacentHTML("beforeend",
      "<li>Skipped: open this page with VS Code Live Server (http://...) to check that every page file exists.</li>");
    finish();
  }
});
