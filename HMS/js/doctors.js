/* =========================================================
   doctors.js — Doctor Management logic
   List → filter → add/edit (validated) → delete
   Same pattern as patients.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const $ = (id) => document.getElementById(id);
  let doctors = HMSData.get("doctors");
  let editingId = null;

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const statusBadge = { Active: ["success", "✔"], "On Leave": ["warning", "🌴"], Inactive: ["danger", "✖"] };
  const timeText = (t) => t.replace("-", " – ");

  const deptOptions = HMSData.departments.map((d) => `<option>${d}</option>`).join("");
  $("deptFilter").insertAdjacentHTML("beforeend", deptOptions);
  $("dDept").innerHTML = '<option value="">Select...</option>' + deptOptions;

  // ---------------------------------------------------------
  // 1. LIST: filter + render
  // ---------------------------------------------------------
  function getFiltered() {
    const q = $("searchBox").value.trim().toLowerCase();
    const avail = $("availFilter").value;
    return doctors.filter((d) => {
      const haystack = (d.id + " " + d.name + " " + d.specialization + " " + d.email).toLowerCase();
      const availOk = !avail ||
        (avail === "today" ? d.status === "Active" && d.days.includes(todayName) : d.days.includes(avail));
      return (!q || haystack.includes(q)) &&
             (!$("deptFilter").value || d.department === $("deptFilter").value) &&
             (!$("statusFilter").value || d.status === $("statusFilter").value) &&
             availOk;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  function render() {
    const list = getFiltered();
    $("resultCount").textContent = `Showing ${list.length} of ${doctors.length} doctors`;
    if (!list.length) {
      $("doctorRows").innerHTML = `<tr><td colspan="10" class="empty-state">No doctors match your search or filters.</td></tr>`;
      return;
    }
    $("doctorRows").innerHTML = list.map((d) => {
      const [cls, icon] = statusBadge[d.status] || ["info", ""];
      return `<tr>
        <td>${d.id}</td>
        <td>${esc(d.name)}</td>
        <td>${esc(d.specialization)}</td>
        <td>${esc(d.department)}</td>
        <td>${esc(d.phone)}</td>
        <td>${esc(d.email)}</td>
        <td>${d.experience} yrs</td>
        <td>${d.days.join(", ")}<br><small class="text-muted">${timeText(d.time)}</small></td>
        <td><span class="badge badge-${cls}">${icon} ${d.status}</span></td>
        <td><div class="actions-cell">
          <a class="btn btn-sm" href="doctor-profile.html?id=${d.id}">View</a>
          <button class="btn btn-sm" data-act="edit" data-id="${d.id}" type="button">Edit</button>
          <button class="btn btn-sm btn-danger" data-act="delete" data-id="${d.id}" type="button">Delete</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  $("searchBox").addEventListener("input", HMSUtils.debounce(render, 150));
  ["deptFilter", "availFilter", "statusFilter"].forEach((id) => $(id).addEventListener("change", render));
  $("clearFilters").addEventListener("click", () => {
    $("searchBox").value = ""; $("deptFilter").value = ""; $("availFilter").value = ""; $("statusFilter").value = "";
    render();
  });

  $("doctorRows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    if (btn.dataset.act === "edit") openForm(btn.dataset.id);
    if (btn.dataset.act === "delete") deleteDoctor(btn.dataset.id);
  });

  // ---------------------------------------------------------
  // 2. ADD / EDIT FORM
  // ---------------------------------------------------------
  function nextDoctorId() {
    const nums = doctors.map((d) => parseInt(d.id.split("-")[1], 10) || 0);
    return "DOC-" + String(Math.max(0, ...nums) + 1).padStart(3, "0");
  }

  const checkedDays = () => DAYS.filter((day) => document.querySelector(`input[name="dDay"][value="${day}"]`).checked);

  function openForm(id = null) {
    editingId = id;
    HMSValidate.clearAll($("doctorForm"));
    $("doctorForm").reset();
    $("doctorModalTitle").textContent = id ? "Edit Doctor" : "Add Doctor";
    $("saveDoctorBtn").textContent = id ? "Save Changes" : "Save Doctor";
    $("dId").readOnly = !!id;

    if (id) {
      const d = doctors.find((x) => x.id === id);
      $("dId").value = d.id; $("dName").value = d.name; $("dSpec").value = d.specialization;
      $("dDept").value = d.department; $("dQual").value = d.qualification; $("dExp").value = d.experience;
      $("dPhone").value = d.phone; $("dEmail").value = d.email; $("dFee").value = d.fee;
      $("dStatus").value = d.status;
      const [start, end] = d.time.split("-");
      $("dStart").value = start; $("dEnd").value = end;
      d.days.forEach((day) => (document.querySelector(`input[name="dDay"][value="${day}"]`).checked = true));
    } else {
      $("dId").value = nextDoctorId();
    }
    HMSUI.open("doctorModal");
  }
  $("addDoctorBtn").addEventListener("click", () => openForm());

  const validators = {
    dId: (v) => {
      v = v.trim();
      if (!v) return "Doctor ID is required.";
      if (!/^DOC-\d{3}$/.test(v)) return "Use the format DOC-001 (DOC- plus 3 digits).";
      if (!editingId && doctors.some((d) => d.id === v)) return "This Doctor ID already exists.";
      return "";
    },
    dName: (v) => HMSValidate.personName(v, "Full name"),
    dSpec: (v) => {
      v = v.trim();
      if (!v) return "Specialization is required.";
      if (v.length < 3 || v.length > 50) return "Specialization must be 3 to 50 characters.";
      if (!/^[A-Za-z][A-Za-z\s\-\/&.]*$/.test(v)) return "Specialization may contain letters and spaces only.";
      return "";
    },
    dDept: (v) => HMSValidate.required(v, "Department"),
    dQual: (v) => {
      v = v.trim();
      if (!v) return "Qualification is required.";
      return v.length < 2 || v.length > 60 ? "Qualification must be 2 to 60 characters." : "";
    },
    dExp: (v) => HMSValidate.numberRange(v, 0, 60, "Experience", true),
    dPhone: (v) => HMSValidate.phone(v, "Phone"),
    dEmail: (v) => {
      const basic = HMSValidate.email(v, "Email", true);
      if (basic) return basic;
      const taken = doctors.some((d) => d.email.toLowerCase() === v.trim().toLowerCase() && d.id !== editingId);
      return taken ? "This email is already used by another doctor." : "";
    },
    dDays: () => (checkedDays().length ? "" : "Select at least one available day."),
    dStart: (v) => HMSValidate.required(v, "Start time"),
    dEnd: (v) => {
      if (!v) return "End time is required.";
      if ($("dStart").value && v <= $("dStart").value) return "End time must be after the start time.";
      return "";
    },
    dFee: (v) => HMSValidate.numberRange(v, 0, 100000, "Consultation fee"),
    dStatus: (v) => HMSValidate.required(v, "Status")
  };

  Object.keys(validators).forEach((id) => {
    if (id === "dDays") return;
    $(id).addEventListener("blur", () => HMSValidate.setError(id, validators[id]($(id).value)));
  });
  document.querySelectorAll('input[name="dDay"]').forEach((cb) =>
    cb.addEventListener("change", () => HMSValidate.setError("dDays", validators.dDays())));
  $("dStart").addEventListener("change", () => {
    if ($("dEnd").value) HMSValidate.setError("dEnd", validators.dEnd($("dEnd").value));
  });

  $("doctorForm").addEventListener("submit", (e) => {
    e.preventDefault();
    // dDays is a fieldset (no .value), so it is checked separately
    const daysMsg = validators.dDays();
    const { dDays, ...fieldValidators } = validators;
    const fieldsOk = HMSValidate.runAll(fieldValidators);
    HMSValidate.setError("dDays", daysMsg);
    if (!fieldsOk || daysMsg) {
      if (fieldsOk && daysMsg) document.querySelector('input[name="dDay"]').focus();
      HMSLayout.toast("Please fix the highlighted fields.", "error");
      return;
    }
    const record = {
      id: $("dId").value.trim(), name: $("dName").value.trim(), specialization: $("dSpec").value.trim(),
      department: $("dDept").value, phone: $("dPhone").value.trim(), email: $("dEmail").value.trim(),
      qualification: $("dQual").value.trim(), experience: Number($("dExp").value), fee: Number($("dFee").value),
      days: checkedDays(), time: $("dStart").value + "-" + $("dEnd").value, status: $("dStatus").value
    };
    if (editingId) {
      doctors = doctors.map((d) => (d.id === editingId ? record : d));
      HMSLayout.toast(`Doctor ${record.id} updated successfully.`);
    } else {
      doctors.push(record);
      HMSLayout.toast(`Doctor ${record.id} added successfully.`);
    }
    HMSData.set("doctors", doctors);
    HMSUI.close("doctorModal");
    render();
  });

  // ---------------------------------------------------------
  // 3. DELETE (with confirmation + linked-record warning)
  // ---------------------------------------------------------
  function deleteDoctor(id) {
    const d = doctors.find((x) => x.id === id);
    const patientCount = HMSData.get("patients").filter((p) => p.doctorId === id).length;
    const apptCount = HMSData.get("appointments").filter((a) => a.doctorId === id).length;
    const warning = patientCount || apptCount
      ? ` This doctor has ${patientCount} assigned patient(s) and ${apptCount} appointment(s), so the database will refuse to delete the doctor (set the status to Inactive instead).`
      : "";
    HMSUI.confirm(`Delete ${d.name} (${id})?${warning}`, () => {
      doctors = doctors.filter((x) => x.id !== id);
      HMSData.set("doctors", doctors);
      render();
      HMSLayout.toast(`Doctor ${id} deleted.`, "info");
    });
  }

  // ---------------------------------------------------------
  // 4. START (supports doctors.html?edit=DOC-001)
  // ---------------------------------------------------------
  render();
  const editParam = new URLSearchParams(window.location.search).get("edit");
  if (editParam && doctors.some((d) => d.id === editParam)) openForm(editParam);
});
