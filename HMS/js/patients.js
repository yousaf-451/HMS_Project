/* =========================================================
   patients.js — Patient Management logic
   List → filter/sort → add/edit (validated) → delete → quick view
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  let patients = HMSData.get("patients");
  const doctors = HMSData.get("doctors");
  let editingId = null;              // null = adding, otherwise the ID being edited

  const $ = (id) => document.getElementById(id);
  const rows = $("patientRows"), form = $("patientForm");

  const statusBadge = {
    Active: ["success", "✔"], Admitted: ["info", "🛏"], Discharged: ["warning", "🏠"]
  };
  const fullName = (p) => p.firstName + " " + p.lastName;

  // ---------------------------------------------------------
  // 1. LIST: filter + sort + render
  // ---------------------------------------------------------
  function getFiltered() {
    const q = $("searchBox").value.trim().toLowerCase();
    const list = patients.filter((p) => {
      const haystack = (p.id + " " + fullName(p) + " " + p.phone + " " + p.email).toLowerCase();
      return (!q || haystack.includes(q)) &&
             (!$("statusFilter").value || p.status === $("statusFilter").value) &&
             (!$("genderFilter").value || p.gender === $("genderFilter").value);
    });
    const sorters = {
      "name-asc":  (a, b) => fullName(a).localeCompare(fullName(b)),
      "name-desc": (a, b) => fullName(b).localeCompare(fullName(a)),
      "id-asc":    (a, b) => a.id.localeCompare(b.id),
      "id-desc":   (a, b) => b.id.localeCompare(a.id),
      "age-asc":   (a, b) => b.dob.localeCompare(a.dob),
      "age-desc":  (a, b) => a.dob.localeCompare(b.dob)
    };
    return list.sort(sorters[$("sortBy").value]);
  }

  function render() {
    const list = getFiltered();
    $("resultCount").textContent = `Showing ${list.length} of ${patients.length} patients`;
    if (!list.length) {
      rows.innerHTML = `<tr><td colspan="13" class="empty-state">No patients match your search or filters.</td></tr>`;
      return;
    }
    rows.innerHTML = list.map((p) => {
      const [cls, icon] = statusBadge[p.status] || ["info", ""];
      return `<tr>
        <td>${p.id}</td>
        <td>${esc(fullName(p))}</td>
        <td>${p.gender}</td>
        <td>${HMSUtils.calcAge(p.dob)}</td>
        <td>${HMSUtils.formatDate(p.dob)}</td>
        <td>${esc(p.phone)}</td>
        <td>${esc(p.email) || "—"}</td>
        <td>${p.bloodGroup}</td>
        <td>${esc(p.address)}</td>
        <td>${esc(p.emergencyName)}<br><small class="text-muted">${esc(p.emergencyPhone)}</small></td>
        <td>${esc(HMSData.doctorName(p.doctorId))}</td>
        <td><span class="badge badge-${cls}">${icon} ${p.status}</span></td>
        <td><div class="actions-cell">
          <button class="btn btn-sm" data-act="quick" data-id="${p.id}" type="button">Quick View</button>
          <a class="btn btn-sm" href="patient-profile.html?id=${p.id}">View</a>
          <button class="btn btn-sm" data-act="edit" data-id="${p.id}" type="button">Edit</button>
          <button class="btn btn-sm btn-danger" data-act="delete" data-id="${p.id}" type="button">Delete</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  $("searchBox").addEventListener("input", HMSUtils.debounce(render, 150));
  ["statusFilter", "genderFilter", "sortBy"].forEach((id) => $(id).addEventListener("change", render));
  $("clearFilters").addEventListener("click", () => {
    $("searchBox").value = ""; $("statusFilter").value = ""; $("genderFilter").value = "";
    $("sortBy").value = "name-asc"; render();
  });

  // One click listener for all row buttons (event delegation)
  rows.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "quick") openQuickView(id);
    if (btn.dataset.act === "edit") openForm(id);
    if (btn.dataset.act === "delete") deletePatient(id);
  });

  // ---------------------------------------------------------
  // 2. ADD / EDIT FORM
  // ---------------------------------------------------------
  $("pDoctor").innerHTML = '<option value="">Select...</option>' +
    doctors.map((d) => `<option value="${d.id}">${esc(d.name)} — ${esc(d.specialization)}</option>`).join("");
  $("pDob").max = HMSUtils.today();

  function openForm(id = null) {
    editingId = id;
    HMSValidate.clearAll(form);
    form.reset();
    $("patientModalTitle").textContent = id ? "Edit Patient" : "Add Patient";
    $("savePatientBtn").textContent = id ? "Save Changes" : "Save Patient";
    $("pId").readOnly = !!id;

    if (id) {
      const p = patients.find((x) => x.id === id);
      $("pId").value = p.id; $("pFirst").value = p.firstName; $("pLast").value = p.lastName;
      $("pDob").value = p.dob; $("pGender").value = p.gender; $("pBlood").value = p.bloodGroup;
      $("pPhone").value = p.phone; $("pEmail").value = p.email; $("pAddress").value = p.address;
      $("pEmName").value = p.emergencyName; $("pEmPhone").value = p.emergencyPhone;
      $("pDoctor").value = p.doctorId; $("pStatus").value = p.status; $("pNotes").value = p.notes;
    } else {
      $("pId").value = HMSUtils.nextId("PAT", patients, "id");
    }
    HMSUI.open("patientModal");
  }
  $("addPatientBtn").addEventListener("click", () => openForm());

  const validators = {
    pId: (v) => {
      v = v.trim();
      if (!v) return "Patient ID is required.";
      if (!/^PAT-\d{4}$/.test(v)) return "Use the format PAT-0001 (PAT- plus 4 digits).";
      if (!editingId && patients.some((p) => p.id === v)) return "This Patient ID already exists.";
      return "";
    },
    pFirst: (v) => HMSValidate.personName(v, "First name"),
    pLast: (v) => HMSValidate.personName(v, "Last name"),
    pDob: (v) => HMSValidate.dob(v),
    pGender: (v) => HMSValidate.required(v, "Gender"),
    pBlood: (v) => HMSValidate.required(v, "Blood group"),
    pPhone: (v) => HMSValidate.phone(v, "Phone"),
    pEmail: (v) => HMSValidate.email(v, "Email", false),
    pAddress: (v) => HMSValidate.required(v, "Address") ||
      (v.trim().length < 5 ? "Address must be at least 5 characters." : HMSValidate.maxLength(v, 120, "Address")),
    pEmName: (v) => HMSValidate.personName(v, "Emergency contact name"),
    pEmPhone: (v) => HMSValidate.phone(v, "Emergency contact phone"),
    pDoctor: (v) => HMSValidate.required(v, "Assigned doctor"),
    pStatus: (v) => HMSValidate.required(v, "Status"),
    pNotes: (v) => HMSValidate.maxLength(v, 300, "Medical notes")
  };

  Object.keys(validators).forEach((id) =>
    $(id).addEventListener("blur", () => HMSValidate.setError(id, validators[id]($(id).value))));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!HMSValidate.runAll(validators)) {
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const record = {
      id: $("pId").value.trim(),
      firstName: $("pFirst").value.trim(), lastName: $("pLast").value.trim(),
      gender: $("pGender").value, dob: $("pDob").value, phone: $("pPhone").value.trim(),
      email: $("pEmail").value.trim(), bloodGroup: $("pBlood").value, address: $("pAddress").value.trim(),
      emergencyName: $("pEmName").value.trim(), emergencyPhone: $("pEmPhone").value.trim(),
      doctorId: $("pDoctor").value, status: $("pStatus").value, notes: $("pNotes").value.trim()
    };
    if (editingId) {
      patients = patients.map((p) => (p.id === editingId ? record : p));
      HMSLayout.toast(`Patient ${record.id} updated successfully.`);
    } else {
      patients.push(record);
      HMSLayout.toast(`Patient ${record.id} added successfully.`);
    }
    HMSData.set("patients", patients);
    HMSUI.close("patientModal");
    render();
  });

  // ---------------------------------------------------------
  // 3. DELETE (with confirmation + linked-record warning)
  // ---------------------------------------------------------
  function deletePatient(id) {
    const p = patients.find((x) => x.id === id);
    const linked =
      HMSData.get("appointments").filter((a) => a.patientId === id).length +
      HMSData.get("medicalRecords").filter((r) => r.patientId === id).length +
      HMSData.get("invoices").filter((i) => i.patientId === id).length;
    const warning = linked ? ` This patient has ${linked} linked appointment/record/invoice entries, so the database will refuse to delete it.` : "";
    HMSUI.confirm(`Delete ${fullName(p)} (${id})?${warning}`, () => {
      patients = patients.filter((x) => x.id !== id);
      HMSData.set("patients", patients);
      render();
      HMSLayout.toast(`Patient ${id} deleted.`, "info");
    });
  }

  // ---------------------------------------------------------
  // 4. QUICK VIEW PANEL
  // ---------------------------------------------------------
  function openQuickView(id) {
    const p = patients.find((x) => x.id === id);
    const today = HMSUtils.today();
    const latest = HMSData.get("medicalRecords").filter((r) => r.patientId === id)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))[0];
    const next = HMSData.get("appointments")
      .filter((a) => a.patientId === id && a.date >= today && !["Cancelled", "Completed"].includes(a.status))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    const unpaid = HMSData.get("invoices").filter((i) => i.patientId === id && ["Pending", "Partially Paid"].includes(i.status));

    $("quickTitle").textContent = fullName(p);
    $("quickBody").innerHTML = `
      <dl class="detail-list">
        <dt>Patient ID</dt><dd>${p.id}</dd>
        <dt>Age / Gender</dt><dd>${HMSUtils.calcAge(p.dob)} / ${p.gender}</dd>
        <dt>Blood group</dt><dd>${p.bloodGroup}</dd>
        <dt>Status</dt><dd>${p.status}</dd>
        <dt>Doctor</dt><dd>${esc(HMSData.doctorName(p.doctorId))}</dd>
        <dt>Phone</dt><dd>${esc(p.phone)}</dd>
        <dt>Latest diagnosis</dt><dd>${latest ? esc(latest.diagnosis) : "No records yet"}</dd>
        <dt>Next appointment</dt><dd>${next ? HMSUtils.formatDate(next.date) + " at " + next.time : "None scheduled"}</dd>
        <dt>Unpaid invoices</dt><dd>${unpaid.length ? "⚠ " + unpaid.length : "None"}</dd>
        <dt>Notes</dt><dd>${esc(p.notes) || "—"}</dd>
      </dl>
      <p style="margin-top:16px"><a class="btn btn-primary" href="patient-profile.html?id=${p.id}">Open full profile</a></p>`;
    HMSUI.open("quickModal");
  }

  // ---------------------------------------------------------
  // 5. START (supports patients.html?edit=PAT-0001)
  // ---------------------------------------------------------
  render();
  const editParam = new URLSearchParams(window.location.search).get("edit");
  if (editParam && patients.some((p) => p.id === editParam)) openForm(editParam);
});
