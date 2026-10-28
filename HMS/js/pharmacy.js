/* =========================================================
   pharmacy.js — Pharmacy Management module
   Stock list + warnings → add/edit → stock update → details → delete
   → dispensing (calculates amount, reduces stock, keeps a log).
   Stock status is COMPUTED by HMSData.stockStatus(), never typed in.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const money = HMSUtils.money;
  const $ = (id) => document.getElementById(id);

  let medicines = HMSData.get("medicines");
  const patients = HMSData.get("patients");
  let sales = HMSStore.load("pharmacySales", []);
  const today = HMSUtils.today();
  let editingId = null, original = null, stockId = null, view = "stock";

  const CATEGORIES = ["Antibiotic", "Painkiller", "Cardiac", "Syrup", "Topical", "Supplement", "Antacid", "Other"];
  const UNITS = ["Tablets", "Capsules", "Bottles", "Tubes", "Vials", "Sachets"];
  const EXPIRY_WARN_DAYS = 30;
  const STATUS = {
    "In Stock": ["success", "✔"], "Low Stock": ["warning", "⚠"],
    "Out of Stock": ["danger", "✖"], "Expired": ["danger", "⛔"]
  };
  const statusOf = (m) => HMSData.stockStatus(m);
  const badge = (s) => `<span class="badge badge-${STATUS[s][0]}">${STATUS[s][1]} ${s}</span>`;
  const daysTo = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
  const round2 = (n) => Math.round(n * 100) / 100;
  const dispensable = (m) => statusOf(m) !== "Expired" && Number(m.quantity) > 0;

  function expiryNote(m) {
    const d = daysTo(m.expiry);
    if (d < 0) return `<br><small>⛔ expired ${-d} day${d === -1 ? "" : "s"} ago</small>`;
    if (d <= EXPIRY_WARN_DAYS) return `<br><small>⚠ expires in ${d} day${d === 1 ? "" : "s"}</small>`;
    return "";
  }

  // ---------------------------------------------------------
  // 1. STOCK LIST: summary cards, alert banner, filters, table
  // ---------------------------------------------------------
  $("categoryFilter").insertAdjacentHTML("beforeend", CATEGORIES.map((c) => `<option>${c}</option>`).join(""));
  $("mCategory").innerHTML = '<option value="">Select...</option>' + CATEGORIES.map((c) => `<option>${c}</option>`).join("");
  $("mUnit").innerHTML = '<option value="">Select...</option>' + UNITS.map((u) => `<option>${u}</option>`).join("");

  function renderStats() {
    const count = (s) => medicines.filter((m) => statusOf(m) === s).length;
    const cards = [
      ["Total medicines", medicines.length, "", ""],
      ["In Stock", count("In Stock"), "", "In Stock"],
      ["Low Stock", count("Low Stock"), "warn", "Low Stock"],
      ["Out of Stock", count("Out of Stock"), "danger", "Out of Stock"],
      ["Expired", count("Expired"), "danger", "Expired"]
    ];
    const active = $("statusFilter").value;
    $("medStats").innerHTML = cards.map(([label, n, cls, filter]) =>
      `<button class="stat-card ${cls}" type="button" data-filter="${filter}" aria-pressed="${active === filter}">
         <div class="stat-label">${label}</div><div class="stat-value">${n}</div>
       </button>`).join("");
  }
  $("medStats").addEventListener("click", (e) => {
    const card = e.target.closest("[data-filter]");
    if (!card) return;
    $("statusFilter").value = card.dataset.filter;
    renderStock();
  });

  function renderBanner() {
    const count = (s) => medicines.filter((m) => statusOf(m) === s).length;
    const soon = medicines.filter((m) => statusOf(m) !== "Expired" && daysTo(m.expiry) <= EXPIRY_WARN_DAYS).length;
    const parts = [];
    if (count("Expired")) parts.push(`${count("Expired")} expired`);
    if (count("Out of Stock")) parts.push(`${count("Out of Stock")} out of stock`);
    if (count("Low Stock")) parts.push(`${count("Low Stock")} low stock`);
    if (soon) parts.push(`${soon} expiring within ${EXPIRY_WARN_DAYS} days`);
    $("alertBanner").textContent = parts.length ? "Attention needed: " + parts.join(", ") + "." : "";
    $("alertBanner").classList.toggle("hidden", !parts.length);
  }

  function getFiltered() {
    const q = $("searchBox").value.trim().toLowerCase();
    return medicines.filter((m) => {
      const hay = [m.id, m.name, m.category, m.manufacturer, m.batch].join(" ").toLowerCase();
      return (!q || hay.includes(q)) &&
             (!$("categoryFilter").value || m.category === $("categoryFilter").value) &&
             (!$("statusFilter").value || statusOf(m) === $("statusFilter").value);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderStock() {
    renderStats();
    const list = getFiltered();
    $("resultCount").textContent = `Showing ${list.length} of ${medicines.length} medicines`;
    if (!list.length) {
      $("medRows").innerHTML = `<tr><td colspan="11" class="empty-state">No medicines match your search or filters.</td></tr>`;
      return;
    }
    $("medRows").innerHTML = list.map((m) => {
      const s = statusOf(m);
      const rowCls = s === "Expired" || s === "Out of Stock" ? "row-danger" : s === "Low Stock" ? "row-warning" : "";
      const qtyCls = Number(m.quantity) === 0 ? "qty-zero" : s === "Low Stock" ? "qty-low" : "";
      return `<tr class="${rowCls}">
        <td>${m.id}</td>
        <td>${esc(m.name)}</td>
        <td>${esc(m.category)}</td>
        <td>${esc(m.manufacturer)}</td>
        <td class="${qtyCls}">${m.quantity}</td>
        <td>${esc(m.unit)}</td>
        <td>${money(m.price)}</td>
        <td>${HMSUtils.formatDate(m.expiry)}${expiryNote(m)}</td>
        <td>${esc(m.batch)}</td>
        <td>${badge(s)}</td>
        <td><div class="actions-cell">
          <button class="btn btn-sm" data-act="view" data-id="${m.id}" type="button">View</button>
          <button class="btn btn-sm" data-act="edit" data-id="${m.id}" type="button">Edit</button>
          <button class="btn btn-sm" data-act="stock" data-id="${m.id}" type="button">Stock</button>
          <button class="btn btn-sm btn-danger" data-act="delete" data-id="${m.id}" type="button">Delete</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  $("searchBox").addEventListener("input", HMSUtils.debounce(renderStock, 150));
  ["categoryFilter", "statusFilter"].forEach((id) => $(id).addEventListener("change", renderStock));
  $("clearFilters").addEventListener("click", () => {
    $("searchBox").value = ""; $("categoryFilter").value = ""; $("statusFilter").value = ""; renderStock();
  });

  $("medRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "view") openView(id);
    if (btn.dataset.act === "edit") openForm(id);
    if (btn.dataset.act === "stock") openStock(id);
    if (btn.dataset.act === "delete") deleteMedicine(id);
  });

  function renderAll() {
    renderStock(); renderBanner(); fillDispenseMedicines(); updateCalc(); renderLog();
  }

  // ---------------------------------------------------------
  // 2. ADD / EDIT FORM
  // ---------------------------------------------------------
  function updateExpiryNoteBox() {
    const v = $("mExpiry").value;
    let msg = "";
    if (v && !isNaN(new Date(v + "T00:00:00"))) {
      const d = daysTo(v);
      if (d < 0) msg = "This date has passed, so the medicine will be shown as Expired.";
      else if (d <= EXPIRY_WARN_DAYS) msg = `Expires in ${d} day${d === 1 ? "" : "s"}. It will be flagged as expiring soon.`;
    }
    $("expiryNote").textContent = msg;
    $("expiryNote").classList.toggle("hidden", !msg);
  }
  $("mExpiry").addEventListener("change", updateExpiryNoteBox);

  function openForm(id = null) {
    editingId = id;
    original = id ? medicines.find((m) => m.id === id) : null;
    HMSValidate.clearAll($("medForm"));
    $("medForm").reset();
    $("medModalTitle").textContent = id ? "Edit Medicine" : "Add Medicine";
    $("saveMedBtn").textContent = id ? "Save Changes" : "Save Medicine";
    $("mId").readOnly = !!id;
    $("mExpiry").min = id ? "" : HMSData.offset(1);
    $("mExpiry").max = HMSData.offset(3650);

    if (id) {
      const m = original;
      $("mId").value = m.id; $("mName").value = m.name; $("mCategory").value = m.category;
      $("mManuf").value = m.manufacturer; $("mQty").value = m.quantity; $("mUnit").value = m.unit;
      $("mPrice").value = m.price; $("mExpiry").value = m.expiry; $("mBatch").value = m.batch;
    } else {
      $("mId").value = HMSUtils.nextId("MED", medicines, "id");
    }
    updateExpiryNoteBox();
    HMSUI.open("medModal");
  }
  $("addMedBtn").addEventListener("click", () => openForm());

  const textRule = (label, min, max, pattern, patternMsg) => (v) => {
    v = v.trim();
    if (!v) return `${label} is required.`;
    if (v.length < min || v.length > max) return `${label} must be ${min} to ${max} characters.`;
    return pattern.test(v) ? "" : patternMsg;
  };

  const validators = {
    mId: (v) => {
      v = v.trim();
      if (!v) return "Medicine ID is required.";
      if (!/^MED-\d{4}$/.test(v)) return "Use the format MED-0001 (MED- plus 4 digits).";
      if (!editingId && medicines.some((m) => m.id === v)) return "This Medicine ID already exists.";
      return "";
    },
    mName: textRule("Medicine name", 2, 60, /^[A-Za-z0-9][A-Za-z0-9\s\-.\/()%+]*$/,
      "Name may contain letters, digits, spaces and - . / ( ) % + only."),
    mCategory: (v) => HMSValidate.required(v, "Category"),
    mManuf: textRule("Manufacturer", 2, 50, /^[A-Za-z0-9][A-Za-z0-9\s&.,'-]*$/,
      "Manufacturer may contain letters, digits, spaces and & . , ' - only."),
    mQty: (v) => HMSValidate.numberRange(v, 0, 100000, "Quantity", true),
    mUnit: (v) => HMSValidate.required(v, "Unit"),
    mPrice: (v) => {
      const msg = HMSValidate.numberRange(v, 0.01, 10000, "Price");
      if (msg) return msg;
      return /^\d+(\.\d{1,2})?$/.test(v.trim()) ? "" : "Price can have at most 2 decimal places.";
    },
    mExpiry: (v) => {
      if (!v) return "Expiry date is required.";
      if (isNaN(new Date(v + "T00:00:00"))) return "Enter a valid date.";
      const unchanged = editingId && original.expiry === v;
      if (v <= today && !unchanged) return "Expiry date must be after today. Expired medicine cannot be added.";
      if (v > HMSData.offset(3650)) return "Expiry date must be within 10 years.";
      return "";
    },
    mBatch: (v) => {
      const msg = textRule("Batch number", 3, 20, /^[A-Za-z0-9-]+$/, "Batch number may contain letters, digits and hyphens only.")(v);
      if (msg) return msg;
      const taken = medicines.some((m) => m.batch.toLowerCase() === v.trim().toLowerCase() && m.id !== editingId);
      return taken ? "This batch number is already used by another medicine." : "";
    }
  };

  Object.keys(validators).forEach((id) =>
    $(id).addEventListener("blur", () => HMSValidate.setError(id, validators[id]($(id).value))));

  $("medForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!HMSValidate.runAll(validators)) {
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const record = {
      id: $("mId").value.trim(), name: $("mName").value.trim(), category: $("mCategory").value,
      manufacturer: $("mManuf").value.trim(), quantity: Number($("mQty").value), unit: $("mUnit").value,
      price: Number($("mPrice").value), expiry: $("mExpiry").value, batch: $("mBatch").value.trim().toUpperCase()
    };
    if (editingId) {
      medicines = medicines.map((m) => (m.id === editingId ? record : m));
      HMSLayout.toast(`Medicine ${record.id} updated successfully.`);
    } else {
      medicines.push(record);
      HMSLayout.toast(`Medicine ${record.id} added successfully.`);
    }
    HMSData.set("medicines", medicines);
    HMSUI.close("medModal");
    renderAll();
  });

  // ---------------------------------------------------------
  // 3. STOCK UPDATE
  // ---------------------------------------------------------
  function newQuantity() {
    const m = medicines.find((x) => x.id === stockId);
    if (!m || $("sAmount").value.trim() === "") return null;
    const a = Number($("sAmount").value);
    if (isNaN(a)) return null;
    const type = $("sType").value;
    return type === "add" ? Number(m.quantity) + a : type === "remove" ? Number(m.quantity) - a : a;
  }
  function updatePreview() {
    const m = medicines.find((x) => x.id === stockId);
    const n = newQuantity();
    $("stockPreview").textContent = n === null || n < 0 ? "" : `New quantity: ${n} ${m.unit}`;
  }

  function openStock(id) {
    stockId = id;
    const m = medicines.find((x) => x.id === id);
    HMSValidate.clearAll($("stockForm"));
    $("stockForm").reset();
    $("stockTitle").textContent = "Update Stock: " + m.name;
    $("stockInfo").innerHTML = `<p style="margin:0"><strong>${m.id}</strong> · current quantity
      <strong>${m.quantity} ${esc(m.unit)}</strong> · ${badge(statusOf(m))}</p>
      ${statusOf(m) === "Expired" ? '<p class="section-note">⛔ This medicine is expired. Adding stock will not make it usable.</p>' : ""}`;
    updatePreview();
    HMSUI.open("stockModal");
  }

  const stockValidators = {
    sType: (v) => HMSValidate.required(v, "Action"),
    sAmount: (v) => {
      const m = medicines.find((x) => x.id === stockId);
      const type = $("sType").value;
      const min = type === "set" ? 0 : 1;
      const msg = HMSValidate.numberRange(v, min, 100000, "Amount", true);
      if (msg) return msg;
      const n = newQuantity();
      if (type === "remove" && n < 0) return `Cannot remove more than the current stock (${m.quantity}).`;
      if (type === "add" && n > 100000) return "The new quantity would be more than 100,000.";
      return "";
    }
  };
  $("sAmount").addEventListener("input", updatePreview);
  $("sAmount").addEventListener("blur", () => HMSValidate.setError("sAmount", stockValidators.sAmount($("sAmount").value)));
  $("sType").addEventListener("change", () => {
    updatePreview();
    if ($("sAmount").value) HMSValidate.setError("sAmount", stockValidators.sAmount($("sAmount").value));
  });

  $("stockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!HMSValidate.runAll(stockValidators)) {
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const n = newQuantity();
    medicines = medicines.map((m) => (m.id === stockId ? { ...m, quantity: n } : m));
    HMSData.set("medicines", medicines);
    HMSUI.close("stockModal");
    renderAll();
    HMSLayout.toast(`Stock of ${stockId} is now ${n}.`);
  });

  // ---------------------------------------------------------
  // 4. DETAILS + DELETE
  // ---------------------------------------------------------
  function openView(id) {
    const m = medicines.find((x) => x.id === id);
    const d = daysTo(m.expiry);
    const expiryText = d < 0 ? `⛔ Expired ${-d} day(s) ago` : d <= EXPIRY_WARN_DAYS ? `⚠ Expires in ${d} day(s)` : `${d} days left`;
    $("viewTitle").textContent = m.name;
    $("viewBody").innerHTML = `
      <dl class="detail-list">
        <dt>Medicine ID</dt><dd>${m.id}</dd>
        <dt>Stock status</dt><dd>${badge(statusOf(m))}</dd>
        <dt>Category</dt><dd>${esc(m.category)}</dd>
        <dt>Manufacturer</dt><dd>${esc(m.manufacturer)}</dd>
        <dt>Quantity</dt><dd>${m.quantity} ${esc(m.unit)}</dd>
        <dt>Price per unit</dt><dd>${money(m.price)}</dd>
        <dt>Stock value</dt><dd>${money(m.quantity * m.price)}</dd>
        <dt>Expiry date</dt><dd>${HMSUtils.formatDate(m.expiry)} (${expiryText})</dd>
        <dt>Batch number</dt><dd>${esc(m.batch)}</dd>
      </dl>`;
    $("viewFooter").innerHTML = `
      <button class="btn" type="button" data-close>Close</button>
      <button class="btn" type="button" id="vStock">Update stock</button>
      <button class="btn btn-primary" type="button" id="vEdit">Edit medicine</button>`;
    $("vStock").addEventListener("click", () => { HMSUI.close("viewModal"); openStock(id); });
    $("vEdit").addEventListener("click", () => { HMSUI.close("viewModal"); openForm(id); });
    HMSUI.open("viewModal");
  }

  function deleteMedicine(id) {
    const m = medicines.find((x) => x.id === id);
    const extra = Number(m.quantity) > 0 ? ` It still has ${m.quantity} ${m.unit} in stock, which will be lost.` : "";
    HMSUI.confirm(`Delete ${m.name} (${id})?${extra}`, () => {
      medicines = medicines.filter((x) => x.id !== id);
      HMSData.set("medicines", medicines);
      renderAll();
      HMSLayout.toast(`Medicine ${id} deleted.`, "info");
    });
  }

  // ---------------------------------------------------------
  // 5. DISPENSING
  // ---------------------------------------------------------
  $("xPatient").innerHTML = '<option value="">Select...</option>' +
    patients.map((p) => `<option value="${p.id}">${p.id} — ${esc(p.firstName + " " + p.lastName)}</option>`).join("");

  function fillDispenseMedicines() {
    const keep = $("xMedicine").value;
    const list = medicines.filter(dispensable).sort((a, b) => a.name.localeCompare(b.name));
    $("xMedicine").innerHTML = list.length
      ? '<option value="">Select...</option>' + list.map((m) =>
          `<option value="${m.id}">${esc(m.name)} — ${m.quantity} ${esc(m.unit)} @ ${money(m.price)}</option>`).join("")
      : '<option value="">No medicine available to dispense</option>';
    if (list.some((m) => m.id === keep)) $("xMedicine").value = keep;
  }

  function updateCalc() {
    const m = medicines.find((x) => x.id === $("xMedicine").value);
    const qty = Number($("xQty").value);
    const validQty = Number.isInteger(qty) && qty > 0;
    $("cUnit").textContent = m ? money(m.price) : "—";
    $("cQty").textContent = validQty ? qty : 0;
    $("cAmount").textContent = m && validQty ? money(round2(qty * m.price)) : "$0.00";
    $("cLeft").textContent = m && validQty ? `${m.quantity - qty} ${m.unit}` : "—";
    $("xQty").max = m ? m.quantity : "";
  }
  $("xMedicine").addEventListener("change", updateCalc);
  $("xQty").addEventListener("input", updateCalc);

  const dispenseValidators = {
    xPatient: (v) => HMSValidate.required(v, "Patient"),
    xMedicine: (v) => {
      if (!v) return "Medicine is required.";
      const m = medicines.find((x) => x.id === v);
      return m && dispensable(m) ? "" : "This medicine can no longer be dispensed.";
    },
    xQty: (v) => {
      const m = medicines.find((x) => x.id === $("xMedicine").value);
      if (!m) return v.trim() === "" ? "Quantity is required." : "Select a medicine first.";
      const msg = HMSValidate.numberRange(v, 1, Number(m.quantity), "Quantity", true);
      return msg.includes("between") ? `Quantity must be between 1 and ${m.quantity} (available stock).` : msg;
    }
  };
  Object.keys(dispenseValidators).forEach((id) =>
    $(id).addEventListener("blur", () => HMSValidate.setError(id, dispenseValidators[id]($(id).value))));
  $("xMedicine").addEventListener("change", () => {
    if ($("xQty").value) HMSValidate.setError("xQty", dispenseValidators.xQty($("xQty").value));
  });

  $("dispenseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!HMSValidate.runAll(dispenseValidators)) {
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const m = medicines.find((x) => x.id === $("xMedicine").value);
    const qty = Number($("xQty").value);
    const patientId = $("xPatient").value;
    const amount = round2(qty * m.price);
    const entry = {
      id: HMSUtils.nextId("DSP", sales, "id"), patientId, medicineId: m.id, medicineName: m.name,
      unit: m.unit, qty, unitPrice: m.price, amount,
      date: today, time: new Date().toTimeString().slice(0, 5)
    };
    sales.push(entry);
    HMSStore.save("pharmacySales", sales);
    medicines = medicines.map((x) => (x.id === m.id ? { ...x, quantity: x.quantity - qty } : x));
    HMSData.set("medicines", medicines);

    $("dispenseForm").reset();
    HMSValidate.clearAll($("dispenseForm"));
    renderAll();
    $("dispReceipt").innerHTML = `
      <h3>✔ Dispensed (${entry.id})</h3>
      <p style="margin:0">${qty} ${esc(m.unit)} of <strong>${esc(m.name)}</strong> to
        <strong>${esc(HMSData.patientName(patientId))}</strong><br>
        Amount: <strong>${money(amount)}</strong> · Stock left: ${m.quantity - qty} ${esc(m.unit)}</p>
      <p style="margin:8px 0 0"><a href="billing.html?new=1&patient=${patientId}&pharmacy=${amount}&desc=${encodeURIComponent((qty + " x " + m.name).slice(0, 60))}">Create an invoice with this Pharmacy charge</a>
        (${money(amount)} is added as a Pharmacy item)</p>`;
    $("dispReceipt").classList.remove("hidden");
    HMSLayout.toast(`Dispensed ${qty} × ${m.name}: ${money(amount)}.`);
  });

  function renderLog() {
    const list = sales.slice().reverse().slice(0, 8);
    $("dispLog").innerHTML = list.length
      ? `<table><thead><tr><th>ID</th><th>When</th><th>Patient</th><th>Medicine</th><th>Qty</th><th>Amount</th></tr></thead><tbody>` +
        list.map((s) => `<tr><td>${s.id}</td><td>${HMSUtils.formatDate(s.date)} ${s.time}</td>
          <td>${esc(HMSData.patientName(s.patientId))}</td><td>${esc(s.medicineName)}</td>
          <td>${s.qty} ${esc(s.unit)}</td><td>${money(s.amount)}</td></tr>`).join("") + `</tbody></table>`
      : '<div class="empty-state">Nothing dispensed yet. Use the form to dispense a medicine.</div>';
  }

  // ---------------------------------------------------------
  // 6. VIEW SWITCH + START
  //   ?tab=dispense · ?status=Low%20Stock · ?search=text
  // ---------------------------------------------------------
  function setView(v) {
    view = v;
    $("stockView").classList.toggle("hidden", v !== "stock");
    $("dispenseView").classList.toggle("hidden", v !== "dispense");
    $("addMedBtn").classList.toggle("hidden", v !== "stock");
    $("stockViewBtn").setAttribute("aria-pressed", v === "stock");
    $("dispenseViewBtn").setAttribute("aria-pressed", v === "dispense");
  }
  $("stockViewBtn").addEventListener("click", () => setView("stock"));
  $("dispenseViewBtn").addEventListener("click", () => setView("dispense"));

  const params = new URLSearchParams(window.location.search);
  if (params.get("status") && STATUS[params.get("status")]) $("statusFilter").value = params.get("status");
  if (params.get("search")) $("searchBox").value = params.get("search");
  renderAll();
  if (params.get("tab") === "dispense") setView("dispense");
});
