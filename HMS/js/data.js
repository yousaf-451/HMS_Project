/* =========================================================
   data.js — Fictional dummy data for the HMS prototype.
   No real patient information. Dates are relative to "today".
   ========================================================= */

const HMSData = {
  // Date N days from today as "YYYY-MM-DD" (local time)
  offset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return HMSUtils.toISO(d);
  },

  // Original dummy data (used on first run and on reset)
  defaults() {
    const o = (n) => this.offset(n);
    const data = {
      patients: [
        { id: "PAT-0001", firstName: "Ayesha", lastName: "Khan", gender: "Female", dob: "1990-04-12", phone: "0300-1234567", email: "ayesha@example.com", bloodGroup: "A+", address: "House 12, Model Town", emergencyName: "Imran Khan", emergencyPhone: "0301-2345678", doctorId: "DOC-001", status: "Active", notes: "Sample: seasonal allergies." },
        { id: "PAT-0002", firstName: "Bilal", lastName: "Ahmed", gender: "Male", dob: "1985-11-03", phone: "0321-7654321", email: "", bloodGroup: "O+", address: "Street 4, Gulberg", emergencyName: "Sana Ahmed", emergencyPhone: "0322-1112223", doctorId: "DOC-002", status: "Active", notes: "" },
        { id: "PAT-0003", firstName: "Fatima", lastName: "Noor", gender: "Female", dob: "2001-07-21", phone: "0333-9876543", email: "fatima@example.com", bloodGroup: "B+", address: "Block C, Johar Town", emergencyName: "Noor Hassan", emergencyPhone: "0334-5556667", doctorId: "DOC-003", status: "Active", notes: "" },
        { id: "PAT-0004", firstName: "Hamza", lastName: "Malik", gender: "Male", dob: "1962-01-30", phone: "0345-1122334", email: "hamza@example.com", bloodGroup: "AB-", address: "Sector D, Bahria Town", emergencyName: "Zara Malik", emergencyPhone: "0346-7778889", doctorId: "DOC-001", status: "Admitted", notes: "Sample: monitored hypertension." },
        { id: "PAT-0005", firstName: "Zainab", lastName: "Raza", gender: "Female", dob: "2015-09-09", phone: "0312-4455667", email: "", bloodGroup: "O-", address: "Lane 2, Garden Town", emergencyName: "Ali Raza", emergencyPhone: "0313-9998887", doctorId: "DOC-004", status: "Active", notes: "" },
        { id: "PAT-0006", firstName: "Usman", lastName: "Tariq", gender: "Male", dob: "1978-12-15", phone: "0302-6677889", email: "usman@example.com", bloodGroup: "A-", address: "Phase 5, DHA", emergencyName: "Hina Tariq", emergencyPhone: "0303-2221110", doctorId: "DOC-002", status: "Discharged", notes: "" }
      ],
      doctors: [
        { id: "DOC-001", name: "Dr. Sara Siddiqui", specialization: "Cardiologist", department: "Cardiology", phone: "0300-1010101", email: "sara@hms.test", qualification: "MBBS, FCPS", experience: 12, fee: 50, days: ["Mon", "Wed", "Fri"], time: "09:00-14:00", status: "Active" },
        { id: "DOC-002", name: "Dr. Omar Farooq", specialization: "General Physician", department: "General Medicine", phone: "0300-2020202", email: "omar@hms.test", qualification: "MBBS", experience: 8, fee: 30, days: ["Mon", "Tue", "Thu", "Fri"], time: "10:00-16:00", status: "Active" },
        { id: "DOC-003", name: "Dr. Mina Aslam", specialization: "Dermatologist", department: "Dermatology", phone: "0300-3030303", email: "mina@hms.test", qualification: "MBBS, MCPS", experience: 6, fee: 40, days: ["Tue", "Wed", "Sat"], time: "11:00-17:00", status: "Active" },
        { id: "DOC-004", name: "Dr. Kamran Ali", specialization: "Pediatrician", department: "Pediatrics", phone: "0300-4040404", email: "kamran@hms.test", qualification: "MBBS, DCH", experience: 15, fee: 35, days: ["Mon", "Thu", "Sat"], time: "09:00-13:00", status: "On Leave" }
      ],
      appointments: [
        { id: "APT-0001", patientId: "PAT-0001", doctorId: "DOC-001", department: "Cardiology", date: o(0), time: "09:30", type: "Check-up", status: "Confirmed", reason: "Routine heart check" },
        { id: "APT-0002", patientId: "PAT-0002", doctorId: "DOC-002", department: "General Medicine", date: o(0), time: "11:00", type: "Consultation", status: "Pending", reason: "Fever and fatigue" },
        { id: "APT-0003", patientId: "PAT-0003", doctorId: "DOC-003", department: "Dermatology", date: o(0), time: "12:30", type: "Follow-up", status: "Scheduled", reason: "Skin rash follow-up" },
        { id: "APT-0004", patientId: "PAT-0004", doctorId: "DOC-001", department: "Cardiology", date: o(1), time: "10:00", type: "Follow-up", status: "Scheduled", reason: "Blood pressure review" },
        { id: "APT-0005", patientId: "PAT-0006", doctorId: "DOC-002", department: "General Medicine", date: o(-3), time: "14:00", type: "Consultation", status: "Completed", reason: "Back pain" },
        { id: "APT-0006", patientId: "PAT-0005", doctorId: "DOC-004", department: "Pediatrics", date: o(2), time: "09:30", type: "Check-up", status: "Pending", reason: "Vaccination check" }
      ],
      medicalRecords: [
        { id: "REC-0001", patientId: "PAT-0004", doctorId: "DOC-001", visitDate: o(-10), diagnosis: "Hypertension (sample)", symptoms: "Headache, dizziness", bp: "150/95", heartRate: 82, temperature: 36.8, weight: 82, treatment: "Lifestyle changes, monitoring", prescription: "Sample Tablet A 5mg", labNotes: "Lipid profile ordered", followUp: o(3) },
        { id: "REC-0002", patientId: "PAT-0006", doctorId: "DOC-002", visitDate: o(-3), diagnosis: "Muscle strain (sample)", symptoms: "Lower back pain", bp: "120/80", heartRate: 74, temperature: 36.6, weight: 76, treatment: "Rest, physiotherapy", prescription: "Sample Pain Relief 400mg", labNotes: "", followUp: o(7) },
        { id: "REC-0003", patientId: "PAT-0003", doctorId: "DOC-003", visitDate: o(-14), diagnosis: "Contact dermatitis (sample)", symptoms: "Itchy skin rash", bp: "110/70", heartRate: 70, temperature: 36.7, weight: 58, treatment: "Topical cream", prescription: "Sample Cream B", labNotes: "", followUp: o(-1) }
      ],
      invoices: [
        { id: "INV-0001", patientId: "PAT-0001", date: o(-2), items: [{ name: "Consultation", amount: 50 }, { name: "ECG Test", amount: 30 }], discount: 0, taxRate: 5, status: "Paid" },
        { id: "INV-0002", patientId: "PAT-0004", date: o(-10), items: [{ name: "Consultation", amount: 50 }, { name: "Lab Tests", amount: 60 }, { name: "Medicine", amount: 25 }], discount: 10, taxRate: 5, status: "Pending" },
        { id: "INV-0003", patientId: "PAT-0006", date: o(-3), items: [{ name: "Consultation", amount: 30 }, { name: "Medicine", amount: 20 }], discount: 0, taxRate: 5, status: "Partially Paid", amountPaid: 20 },
        { id: "INV-0004", patientId: "PAT-0003", date: o(-14), items: [{ name: "Consultation", amount: 40 }], discount: 0, taxRate: 5, status: "Pending" }
      ],
      medicines: [
        { id: "MED-0001", name: "Sample Tablet A 5mg", category: "Cardiac", manufacturer: "DemoPharma", quantity: 200, unit: "Tablets", price: 0.5, expiry: o(400), batch: "BA-1001" },
        { id: "MED-0002", name: "Sample Pain Relief 400mg", category: "Painkiller", manufacturer: "DemoPharma", quantity: 12, unit: "Tablets", price: 0.3, expiry: o(200), batch: "BP-2002" },
        { id: "MED-0003", name: "Sample Antibiotic C", category: "Antibiotic", manufacturer: "HealthCo", quantity: 0, unit: "Capsules", price: 1.2, expiry: o(300), batch: "AC-3003" },
        { id: "MED-0004", name: "Sample Cough Syrup", category: "Syrup", manufacturer: "HealthCo", quantity: 45, unit: "Bottles", price: 3.5, expiry: o(-20), batch: "CS-4004" },
        { id: "MED-0005", name: "Sample Cream B", category: "Topical", manufacturer: "DermaDemo", quantity: 60, unit: "Tubes", price: 4, expiry: o(20), batch: "CB-5005" },
        { id: "MED-0006", name: "Sample Vitamin D", category: "Supplement", manufacturer: "DemoPharma", quantity: 150, unit: "Tablets", price: 0.4, expiry: o(500), batch: "VD-6006" }
      ]
    };

    // Make sure every dummy appointment falls on a day its doctor works,
    // so Edit/Reschedule never starts with a schedule error.
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    data.appointments.forEach((a) => {
      const doc = data.doctors.find((d) => d.id === a.doctorId);
      const day = dayNames[new Date(a.date + "T00:00:00").getDay()];
      if (doc && !doc.days.includes(day)) doc.days.push(day);
    });
    return data;
  },

  // Load a collection. Seeds localStorage with defaults on first use.
  get(key) {
    let data = HMSStore.load(key, null);
    if (data === null) {
      data = this.defaults()[key];
      HMSStore.save(key, data);
    }
    return data;
  },

  // Save a modified collection (e.g. after add/edit/delete)
  set(key, value) { HMSStore.save(key, value); },

  // Hospital beds (static sample numbers)
  beds: { total: 60, occupied: 41 },

  // Shared department list (doctor form, appointments)
  departments: ["Cardiology", "General Medicine", "Dermatology", "Pediatrics",
                "Orthopedics", "Neurology", "Gynecology", "ENT"],

  // ----- Notifications: built from the live data every time -----
  // Each id includes the state ("...-expired"), so a changed situation creates a NEW unread notification.
  buildNotifications() {
    const today = HMSUtils.today();
    const soon = this.offset(7);
    const list = [];
    const add = (id, level, icon, category, text, href) =>
      list.push({ id, level, icon, category, text, href });

    this.get("medicines").forEach((m) => {
      const s = this.stockStatus(m);
      if (s === "Expired") add(`stock-${m.id}-expired`, "danger", "⛔", "Pharmacy", `${m.name} is expired`, "pharmacy.html?status=Expired");
      else if (s === "Out of Stock") add(`stock-${m.id}-out`, "danger", "✖", "Pharmacy", `${m.name} is out of stock`, "pharmacy.html?status=Out%20of%20Stock");
      else if (s === "Low Stock") add(`stock-${m.id}-low`, "warning", "⚠", "Pharmacy", `Medicine stock low: ${m.name} (${m.quantity} left)`, "pharmacy.html?status=Low%20Stock");
      if (s !== "Expired" && m.expiry <= this.offset(30))
        add(`expiry-${m.id}`, "warning", "⏳", "Pharmacy", `${m.name} expires on ${HMSUtils.formatDate(m.expiry)}`, "pharmacy.html");
    });

    this.get("invoices").filter((i) => i.status === "Pending" || i.status === "Partially Paid").forEach((i) =>
      add(`bill-${i.id}-${i.status}`, "warning", "💳", "Billing",
        `Payment pending: invoice ${i.id} for ${this.patientName(i.patientId)} (${i.status})`, `billing.html?view=${i.id}`));

    this.get("medicalRecords").filter((r) => r.followUp && r.followUp <= soon).forEach((r) =>
      add(`follow-${r.id}-${r.followUp}`, r.followUp < today ? "danger" : "info", "🔁", "Follow-up",
        `Follow-up ${r.followUp < today ? "overdue" : "due"} for ${this.patientName(r.patientId)} (${HMSUtils.formatDate(r.followUp)})`,
        `medical-records.html?view=${r.id}`));

    this.get("appointments")
      .filter((a) => a.date >= today && a.date <= this.offset(1) && !["Cancelled", "Completed"].includes(a.status))
      .forEach((a) =>
        add(`appt-${a.id}-${a.date}-${a.time}-${a.status}`, "info", "📅", "Appointments",
          `Appointment scheduled: ${this.patientName(a.patientId)} with ${this.doctorName(a.doctorId)}, ${HMSUtils.formatDate(a.date)} at ${a.time}`,
          `appointments.html?view=${a.id}`));

    const order = { danger: 0, warning: 1, info: 2 };
    const sorted = list.sort((a, b) => order[a.level] - order[b.level]);
    HMSStore.syncNotifications(sorted);      // keep the database's notifications table up to date
    return sorted;
  },

  readNotifications() { return HMSStore.load("readNotifs", []); },

  unreadCount() {
    const read = this.readNotifications();
    return this.buildNotifications().filter((n) => !read.includes(n.id)).length;
  },

  // ----- Shared calculations used by several modules -----
  stockStatus(m) {
    if (m.expiry < HMSUtils.today()) return "Expired";
    if (Number(m.quantity) === 0) return "Out of Stock";
    if (Number(m.quantity) <= 20) return "Low Stock";
    return "In Stock";
  },
  invoiceSubtotal(inv) { return inv.items.reduce((s, i) => s + Number(i.amount), 0); },
  invoiceTotal(inv) {
    const afterDiscount = this.invoiceSubtotal(inv) - Number(inv.discount || 0);
    return afterDiscount + afterDiscount * (Number(inv.taxRate || 0) / 100);
  },
  patientName(id) {
    const p = this.get("patients").find((x) => x.id === id);
    return p ? p.firstName + " " + p.lastName : "Unknown";
  },
  doctorName(id) {
    const d = this.get("doctors").find((x) => x.id === id);
    return d ? d.name : "Unknown";
  }
};

// When the database is empty, the server asks the browser for the starting (dummy) data
HMSStore.seedHook = () => HMSData.defaults();
