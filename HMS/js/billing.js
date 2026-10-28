/* =========================================================
   billing.js — Billing and Payments module
   List + stats → create/edit invoice (dynamic rows, live totals)
   → view → print → mark paid / cancel.
   No real payment processing happens anywhere in this file.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const money = HMSUtils.money;
  const $ = (id) => document.getElementById(id);

  let invoices = HMSData.get("invoices");
  const patients = HMSData.get("patients");
  const doctors = HMSData.get("doctors");
  const today = HMSUtils.today();
  let editingId = null;

  const MAX_ITEMS = 15;
  const CATS = ["Consultation", "Laboratory", "Pharmacy", "Other"];
  const OPEN = ["Pending", "Partially Paid"];
  const STATUS = {
    Paid: ["success", "✔"], Pending: ["warning", "⏳"],
    "Partially Paid": ["info", "◑"], Cancelled: ["danger", "✖"]
  };
  const badge = (s) => `<span class="badge badge-${STATUS[s][0]}">${STATUS[s][1]} ${s}</span>`;

  // ---------------------------------------------------------
  // 0. CALCULATION HELPERS
  // ---------------------------------------------------------
  // The seeded dummy items have no category, so we guess it from the name
  function categoryOf(item) {
    if (item.category) return item.category;
    const n = item.name.toLowerCase();
    if (n.includes("consult")) return "Consultation";
    if (/lab|test|ecg|x-ray|scan/.test(n)) return "Laboratory";
    if (/medic|pharm/.test(n)) return "Pharmacy";
    return "Other";
  }
  const catSum = (inv, c) =>
    inv.items.filter((i) => categoryOf(i) === c).reduce((s, i) => s + Number(i.amount), 0);

  // Subtotal − Discount = after discount; + Tax = Total
  function breakdown(inv) {
    const sub = HMSData.invoiceSubtotal(inv);
    const discount = Number(inv.discount || 0);
    const taxable = sub - discount;
    const tax = taxable * (Number(inv.taxRate || 0) / 100);
    return { sub, discount, taxable, tax, total: taxable + tax };
  }
  function paidOf(inv) {
    if (inv.status === "Paid") return HMSData.invoiceTotal(inv);
    if (inv.status === "Partially Paid") return Number(inv.amountPaid || 0);
    return 0;
  }

  // ---------------------------------------------------------
  // 1. SUMMARY CARDS + LIST
  // ---------------------------------------------------------
  function renderStats() {
    const live = invoices.filter((i) => i.status !== "Cancelled");
    const billed = live.reduce((s, i) => s + HMSData.invoiceTotal(i), 0);
    const collected = live.reduce((s, i) => s + paidOf(i), 0);
    const cards = [
      ["Total billed", money(billed)],
      ["Collected", money(collected)],
      ["Outstanding", money(billed - collected)],
      ["Open invoices", live.filter((i) => OPEN.includes(i.status)).length]
    ];
    $("billStats").innerHTML = cards.map(([label, value]) =>
      `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`).join("");
  }

  function getFiltered() {
    const q = $("searchBox").value.trim().toLowerCase();
    return invoices.filter((i) => {
      const hay = [i.id, i.patientId, HMSData.patientName(i.patientId), i.status,
                   ...i.items.map((x) => x.name)].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (!$("statusFilter").value || i.status === $("statusFilter").value);
    }).sort((a, b) => b.date.localeCompare(a.date));
  }

  const cell = (v) => (v > 0 ? money(v) : "—");

  function renderList() {
    renderStats();
    const list = getFiltered();
    $("resultCount").textContent = `Showing ${list.length} of ${invoices.length} invoices`;
    if (!list.length) {
      $("invoiceRows").innerHTML = `<tr><td colspan="13" class="empty-state">No invoices match your search or filters.</td></tr>`;
      return;
    }
    $("invoiceRows").innerHTML = list.map((inv) => {
      const b = breakdown(inv);
      const names = inv.items.slice(0, 2).map((i) => i.name).join(", ") +
                    (inv.items.length > 2 ? ` +${inv.items.length - 2} more` : "");
      return `<tr>
        <td>${inv.id}</td>
        <td><a href="patient-profile.html?id=${inv.patientId}">${esc(HMSData.patientName(inv.patientId))}</a></td>
        <td>${HMSUtils.formatDate(inv.date)}</td>
        <td>${esc(names)}</td>
        <td>${cell(catSum(inv, "Consultation"))}</td>
        <td>${cell(catSum(inv, "Laboratory"))}</td>
        <td>${cell(catSum(inv, "Pharmacy"))}</td>
        <td>${cell(catSum(inv, "Other"))}</td>
        <td>${cell(b.discount)}</td>
        <td>${cell(b.tax)}</td>
        <td><strong>${money(b.total)}</strong></td>
        <td>${badge(inv.status)}</td>
        <td><div class="actions-cell">
          <button class="btn btn-sm" data-act="view" data-id="${inv.id}" type="button">View</button>
          <button class="btn btn-sm" data-act="print" data-id="${inv.id}" type="button">Print</button>
          ${OPEN.includes(inv.status) ? `<button class="btn btn-sm btn-primary" data-act="pay" data-id="${inv.id}" type="button">Mark paid</button>` : ""}
        </div></td>
      </tr>`;
    }).join("");
  }

  $("searchBox").addEventListener("input", HMSUtils.debounce(renderList, 150));
  $("statusFilter").addEventListener("change", renderList);
  $("clearFilters").addEventListener("click", () => {
    $("searchBox").value = ""; $("statusFilter").value = ""; renderList();
  });

  $("invoiceRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "view") openView(id);
    if (btn.dataset.act === "print") printInvoice(id);
    if (btn.dataset.act === "pay") askMarkPaid(id);
  });

  // ---------------------------------------------------------
  // 2. INVOICE DOCUMENT (used by the View modal AND printing)
  // ---------------------------------------------------------
  function invoiceHtml(inv) {
    const p = patients.find((x) => x.id === inv.patientId);
    const b = breakdown(inv);
    const items = inv.items.map((i, n) => `<tr><td>${n + 1}</td><td>${categoryOf(i)}</td>
      <td>${esc(i.name)}</td><td class="num">${money(i.amount)}</td></tr>`).join("");
    const cats = CATS.map((c) => [c, catSum(inv, c)]).filter(([, v]) => v > 0)
      .map(([c, v]) => `${c}: ${money(v)}`).join(" · ");

    let payment = "";
    if (inv.status === "Paid") payment = `<div><dt>Amount paid</dt><dd>${money(b.total)}</dd></div>`;
    else if (inv.status === "Pending") payment = `<div><dt>Balance due</dt><dd>${money(b.total)}</dd></div>`;
    else if (inv.status === "Partially Paid") {
      payment = Number(inv.amountPaid) > 0
        ? `<div><dt>Amount paid</dt><dd>${money(inv.amountPaid)}</dd></div>
           <div><dt>Balance due</dt><dd>${money(b.total - inv.amountPaid)}</dd></div>`
        : `<div><dt>Amount paid</dt><dd>not recorded</dd></div>`;
    }

    return `<div class="invoice">
      <div class="invoice-head">
        <div><h2>🏥 HMS</h2><div>Hospital Management System</div></div>
        <div class="invoice-meta"><strong>Invoice ${inv.id}</strong><br>
          Date: ${HMSUtils.formatDate(inv.date)}<br>Status: ${badge(inv.status)}</div>
      </div>
      <div class="invoice-parties">
        <strong>Bill to:</strong> ${esc(HMSData.patientName(inv.patientId))} (${inv.patientId})<br>
        ${p ? "Phone: " + esc(p.phone) : "Patient record no longer exists"}
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Category</th><th>Description</th><th class="num">Amount</th></tr></thead>
        <tbody>${items}</tbody></table></div>
      <p class="invoice-cats">${cats}</p>
      <div class="totals-box"><dl class="totals">
        <div><dt>Subtotal</dt><dd>${money(b.sub)}</dd></div>
        <div><dt>− Discount</dt><dd>${money(b.discount)}</dd></div>
        <div><dt>Amount after discount</dt><dd>${money(b.taxable)}</dd></div>
        <div><dt>+ Tax (${Number(inv.taxRate || 0)}%)</dt><dd>${money(b.tax)}</dd></div>
        <div class="grand"><dt>Total</dt><dd>${money(b.total)}</dd></div>
        ${payment}
      </dl></div>
      ${inv.status === "Cancelled" ? "<p><strong>This invoice was cancelled.</strong></p>" : ""}
      <p class="invoice-foot">Prototype invoice with fictional data. Not a real bill. No payment was processed.</p>
    </div>`;
  }

  // ---------------------------------------------------------
  // 3. VIEW + PRINT + STATUS CHANGES
  // ---------------------------------------------------------
  function fillView(id) {
    const inv = invoices.find((x) => x.id === id);
    $("viewTitle").textContent = "Invoice " + inv.id;
    $("viewBody").innerHTML = invoiceHtml(inv);
    const open = OPEN.includes(inv.status);
    $("viewFooter").innerHTML = `
      <button class="btn" type="button" data-close>Close</button>
      <button class="btn" type="button" data-vact="print">🖨 Print</button>
      ${open ? '<button class="btn" type="button" data-vact="edit">Edit</button>' : ""}
      ${open ? '<button class="btn btn-primary" type="button" data-vact="pay">Mark as paid</button>' : ""}
      ${open ? '<button class="btn btn-danger" type="button" data-vact="cancel">Cancel invoice</button>' : ""}`;
    $("viewModal").dataset.id = id;
  }
  function openView(id) {
    fillView(id);
    if ($("viewModal").classList.contains("hidden")) HMSUI.open("viewModal");
  }

  // Printing: copy the invoice into #printArea and let CSS show only that area
  function printInvoice(id) {
    $("printArea").innerHTML = invoiceHtml(invoices.find((x) => x.id === id));
    document.body.classList.add("printing-invoice");
    window.print();
  }
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-invoice"));

  function changeStatus(id, status) {
    invoices = invoices.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i, status };
      if (status === "Paid") updated.amountPaid = HMSData.invoiceTotal(i);
      return updated;
    });
    HMSData.set("invoices", invoices);
    renderList();
    HMSLayout.toast(`Invoice ${id} marked as ${status}.`, status === "Cancelled" ? "info" : "success");
  }

  function askMarkPaid(id) {
    const inv = invoices.find((x) => x.id === id);
    HMSUI.confirm(
      `Mark invoice ${id} (${money(HMSData.invoiceTotal(inv))}) as fully paid? No real payment is processed in this prototype.`,
      () => changeStatus(id, "Paid"), "Yes, mark as paid");
  }

  $("viewModal").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-vact]");
    if (!btn) return;
    const id = $("viewModal").dataset.id;
    const act = btn.dataset.vact;
    if (act === "print") printInvoice(id);
    if (act === "edit") { HMSUI.close("viewModal"); openForm(id); }
    if (act === "pay") { HMSUI.close("viewModal"); askMarkPaid(id); }
    if (act === "cancel") {
      HMSUI.close("viewModal");
      HMSUI.confirm(`Cancel invoice ${id}? Cancelled invoices stay in the list but are not counted as billed.`,
        () => changeStatus(id, "Cancelled"), "Yes, cancel invoice");
    }
  });

  // ---------------------------------------------------------
  // 4. INVOICE FORM: dynamic rows + live totals
  // ---------------------------------------------------------
  $("bPatient").innerHTML = '<option value="">Select...</option>' +
    patients.map((p) => `<option value="${p.id}">${p.id} — ${esc(p.firstName + " " + p.lastName)}</option>`).join("");

  const rowEls = () => [...$("itemsBox").querySelectorAll("[data-row]")];
  const field = (row, name) => row.querySelector(`[data-f="${name}"]`);

  function addRow(item = {}) {
    const row = document.createElement("div");
    row.className = "item-row";
    row.setAttribute("data-row", "");
    row.innerHTML = `
      <div class="form-group">
        <select data-f="category" aria-label="Category">
          ${CATS.map((c) => `<option ${c === item.category ? "selected" : ""}>${c}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <input data-f="name" maxlength="60" placeholder="e.g. Blood test" aria-label="Service description" value="${esc(item.name || "")}">
      </div>
      <div class="form-group">
        <input type="number" data-f="amount" min="0.01" max="100000" step="0.01" placeholder="0.00"
               aria-label="Amount in dollars" value="${item.amount === undefined ? "" : item.amount}">
      </div>
      <button class="btn btn-sm btn-danger" type="button" data-remove aria-label="Remove this item">✕</button>
      <div class="field-error" data-err></div>`;
    $("itemsBox").appendChild(row);
    updateRowControls();
    return row;
  }

  function updateRowControls() {
    const n = rowEls().length;
    rowEls().forEach((r) => (r.querySelector("[data-remove]").disabled = n === 1));
    $("addItemBtn").disabled = n >= MAX_ITEMS;
    $("itemsHint").textContent = n >= MAX_ITEMS ? `Maximum of ${MAX_ITEMS} items reached.` : `${n} of ${MAX_ITEMS} items`;
  }

  const getItems = () => rowEls().map((r) => ({
    category: field(r, "category").value,
    name: field(r, "name").value.trim(),
    amount: field(r, "amount").value.trim() === "" ? NaN : Number(field(r, "amount").value)
  }));

  function totals() {
    const sub = getItems().reduce((s, i) => s + (isNaN(i.amount) ? 0 : i.amount), 0);
    const disc = Number($("bDiscount").value) || 0;
    const rate = Number($("bTax").value) || 0;
    const net = sub - disc;
    const tax = net * (rate / 100);
    return { sub, disc, rate, net, tax, total: net + tax };
  }

  function updateSummary() {
    const t = totals();
    $("sumSub").textContent = money(t.sub);
    $("sumDisc").textContent = money(t.disc);
    $("sumNet").textContent = money(t.net);
    $("sumTaxLabel").textContent = `+ Tax (${t.rate}%)`;
    $("sumTax").textContent = money(t.tax);
    $("sumTotal").textContent = money(t.total);
    const f = (n) => n.toFixed(2);
    $("sumFormula").textContent =
      `Total = (Subtotal − Discount) + Tax = (${f(t.sub)} − ${f(t.disc)}) + (${f(t.net)} × ${t.rate}%) = ${f(t.total)}`;
  }

  $("itemsBox").addEventListener("input", updateSummary);
  $("itemsBox").addEventListener("change", updateSummary);
  $("bDiscount").addEventListener("input", updateSummary);
  $("bTax").addEventListener("input", updateSummary);

  $("addItemBtn").addEventListener("click", () => {
    const row = addRow();
    field(row, "name").focus();
    updateSummary();
  });
  $("itemsBox").addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (!rm || rowEls().length === 1) return;
    rm.closest("[data-row]").remove();
    updateRowControls();
    updateSummary();
    $("addItemBtn").focus();
  });

  // Choosing a patient suggests a consultation row from their doctor's fee
  $("bPatient").addEventListener("change", () => {
    if (editingId) return;
    const p = patients.find((x) => x.id === $("bPatient").value);
    const d = p ? doctors.find((x) => x.id === p.doctorId) : null;
    const rows = rowEls();
    if (d && rows.length === 1) {
      const r = rows[0];
      if (!field(r, "amount").value && (!field(r, "name").value || field(r, "name").value === "Consultation")) {
        field(r, "category").value = "Consultation";
        field(r, "name").value = "Consultation";
        field(r, "amount").value = d.fee;
        updateSummary();
      }
    }
  });

  $("bStatus").addEventListener("change", () => {
    $("g-bPaid").classList.toggle("hidden", $("bStatus").value !== "Partially Paid");
    if ($("bStatus").value !== "Partially Paid") HMSValidate.setError("bPaid", "");
  });

  function openForm(id = null, presetPatient = "") {
    editingId = id;
    HMSValidate.clearAll($("invoiceForm"));
    $("invoiceForm").reset();
    $("itemsBox").innerHTML = "";
    $("bDate").max = today;
    $("invoiceModalTitle").textContent = id ? "Edit Invoice" : "Create Invoice";
    $("saveInvoiceBtn").textContent = id ? "Save Changes" : "Save Invoice";
    $("bId").value = id || HMSUtils.nextId("INV", invoices, "id");

    if (id) {
      const inv = invoices.find((x) => x.id === id);
      $("bPatient").value = inv.patientId;
      $("bDate").value = inv.date;
      $("bDiscount").value = inv.discount || "";
      $("bTax").value = inv.taxRate;
      $("bStatus").value = inv.status;
      $("bPaid").value = inv.amountPaid || "";
      inv.items.forEach((i) => addRow({ category: categoryOf(i), name: i.name, amount: i.amount }));
    } else {
      $("bDate").value = today;
      addRow({ category: "Consultation" });
      if (presetPatient && patients.some((p) => p.id === presetPatient)) {
        $("bPatient").value = presetPatient;
        $("bPatient").dispatchEvent(new Event("change"));
      }
    }
    $("g-bPaid").classList.toggle("hidden", $("bStatus").value !== "Partially Paid");
    updateRowControls();
    updateSummary();
    HMSUI.open("invoiceModal");
  }
  $("addInvoiceBtn").addEventListener("click", () => openForm());

  // ---------------------------------------------------------
  // 5. VALIDATION
  // ---------------------------------------------------------
  const MONEY_FORMAT = /^\d+(\.\d{1,2})?$/;

  const validators = {
    bPatient: (v) => HMSValidate.required(v, "Patient"),
    bDate: (v) => {
      if (!v) return "Invoice date is required.";
      if (isNaN(new Date(v + "T00:00:00"))) return "Enter a valid date.";
      return v > today ? "Invoice date cannot be in the future." : "";
    },
    bDiscount: (v) => {
      v = v.trim();
      if (!v) return "";
      if (!MONEY_FORMAT.test(v)) return "Discount must be a positive amount with at most 2 decimals.";
      const sub = totals().sub;
      return Number(v) > sub ? `Discount cannot be more than the subtotal (${money(sub)}).` : "";
    },
    bTax: (v) => HMSValidate.numberRange(v, 0, 30, "Tax rate"),
    bStatus: (v) => HMSValidate.required(v, "Payment status"),
    bPaid: (v) => {
      if ($("bStatus").value !== "Partially Paid") return "";
      v = v.trim();
      if (!v) return "Amount paid is required for a partially paid invoice.";
      if (isNaN(Number(v)) || Number(v) <= 0) return "Amount paid must be more than 0.";
      if (!MONEY_FORMAT.test(v)) return "Amount paid can have at most 2 decimals.";
      const total = totals().total;
      return Number(v) >= total
        ? `Amount paid must be less than the total (${money(total)}). Use status "Paid" for full payment.` : "";
    }
  };

  Object.keys(validators).forEach((id) =>
    $(id).addEventListener("blur", () => HMSValidate.setError(id, validators[id]($(id).value))));

  function validateRows() {
    let ok = true;
    rowEls().forEach((row) => {
      const name = field(row, "name").value.trim();
      const amt = field(row, "amount").value.trim();
      let msg = "";
      if (name.length < 2 || name.length > 60) msg = "Description must be 2 to 60 characters.";
      else {
        msg = HMSValidate.numberRange(amt, 0.01, 100000, "Amount");
        if (!msg && !MONEY_FORMAT.test(amt)) msg = "Amount can have at most 2 decimal places.";
      }
      row.classList.toggle("has-error", !!msg);
      row.querySelector("[data-err]").textContent = msg;
      if (msg) ok = false;
    });
    return ok;
  }

  $("invoiceForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fieldsOk = HMSValidate.runAll(validators);
    const rowsOk = validateRows();
    if (!fieldsOk || !rowsOk) {
      if (fieldsOk && !rowsOk) {
        const bad = $("itemsBox").querySelector(".has-error input");
        if (bad) bad.focus();
      }
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const t = totals();
    const record = {
      id: $("bId").value,
      patientId: $("bPatient").value,
      date: $("bDate").value,
      items: getItems(),
      discount: Number($("bDiscount").value) || 0,
      taxRate: Number($("bTax").value),
      status: $("bStatus").value
    };
    if (record.status === "Partially Paid") record.amountPaid = Number($("bPaid").value);
    if (record.status === "Paid") record.amountPaid = t.total;

    if (editingId) {
      invoices = invoices.map((i) => (i.id === editingId ? record : i));
      HMSLayout.toast(`Invoice ${record.id} updated. Total ${money(t.total)}.`);
    } else {
      invoices.push(record);
      HMSLayout.toast(`Invoice ${record.id} created. Total ${money(t.total)}.`);
    }
    HMSData.set("invoices", invoices);
    HMSUI.close("invoiceModal");
    renderList();
  });

  // ---------------------------------------------------------
  // 6. START
  //   ?new=1&patient=PAT-0001   open the create form for a patient
  //   ?new=1&patient=..&pharmacy=1.50&desc=..   start with a Pharmacy charge
  //   ?patient=PAT-0001         show only that patient's invoices
  //   ?view=INV-0001            open one invoice
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const pParam = params.get("patient");
  if (pParam && params.get("new") !== "1") $("searchBox").value = pParam;
  renderList();
  if (params.get("new") === "1") {
    openForm(null, pParam || "");
    const pharmacyAmount = Number(params.get("pharmacy"));
    if (pharmacyAmount > 0) {
      $("itemsBox").innerHTML = "";
      addRow({ category: "Pharmacy", name: (params.get("desc") || "Medicine").slice(0, 60), amount: pharmacyAmount });
      updateSummary();
    }
  }
  const viewParam = params.get("view");
  if (viewParam && invoices.some((i) => i.id === viewParam)) openView(viewParam);
});
