"""Single source of truth for HMS Sprint Planning.
Edit this file, then run:  python build_sprint_artifacts.py
It regenerates the CSV files, the Markdown plan, the Scrum board HTML and the JSON used by the slides."""
from datetime import date

PROJECT = "HMS - Hospital Management System"
SPRINT_NAME = "Sprint 1"
SPRINT_START = date(2026, 10, 19)
SPRINT_END = date(2026, 11, 1)
SNAPSHOT = date(2026, 10, 25)          # date the board snapshot was taken
REVIEW_DATE = date(2026, 10, 31)
RETRO_DATE = date(2026, 11, 1)
WORKSPACE_LINK = "PASTE-YOUR-JIRA-OR-GITHUB-PROJECTS-LINK-HERE"

SPRINT_GOAL = ("Deliver a working, testable HMS Increment: a staff member can log in and manage patients, doctors, "
               "appointments (no double-booking), medical records, billing and pharmacy stock, with every change "
               "stored in the SQLite database and covered by automatic tests.")

OBJECTIVES = [
    "Replace paper / separate tools with one system for patients, doctors, appointments, records, bills and medicines.",
    "Keep data correct with three validation layers: browser, Python server, database constraints.",
    "Give staff dashboard, alerts, search and reports so they can see what needs attention.",
    "Prove quality with automatic tests (86 API checks, 48 schema checks, 44 browser checks).",
]

MODULES = [
    ("Patient Management", "Register, search, edit, view patients and their history"),
    ("Doctor Management", "Doctor records, departments, weekly schedules, fees"),
    ("Appointments", "Booking with slots, double-booking prevention, week calendar"),
    ("Medical Records", "Visits, diagnosis, vitals, prescriptions, follow-ups"),
    ("Billing", "Invoices with live totals, discount, tax, payment status"),
    ("Pharmacy", "Medicine stock, expiry warnings, dispensing"),
    ("Supporting", "Login, dashboard, reports, notifications, global search, audit log"),
]

DEFINITION_OF_DONE = [
    "Code works in Chrome/Edge against the real database (no localStorage data).",
    "Browser validation, server rule and database constraint all behave as specified.",
    "Acceptance criteria demonstrated to the Product Owner.",
    "Automatic tests pass (tests/test_api.py, HMS_DB/verify_schema.py, selftest.html).",
    "Another team member has reviewed the code (In Review column) before Done.",
]

# short key -> (full name, role, responsibilities, focus area)
TEAM = {
    "AB": ("Muhammad Abdullah Malik", "Scrum Master + Developer (Team Lead)",
           "Runs Sprint ceremonies, removes blockers, keeps the board current. Builds database, server.py, login, audit log and API tests.",
           "Database & Backend"),
    "UQ": ("Umair Qaisar", "Product Owner + Developer",
           "Owns and prioritises the Product Backlog, writes acceptance criteria, accepts finished stories. Builds Patient module, login page and global search.",
           "Patients & Search"),
    "TA": ("Talha Azeem", "Developer",
           "Builds Doctor Management and Appointments (booking, slots, calendar, double-booking warning).",
           "Doctors & Appointments"),
    "WA": ("Waleed Ali", "Developer",
           "Builds Medical Records (vitals, prescriptions) and Billing (invoices, live totals, payments).",
           "Records & Billing"),
    "MY": ("Muhammad Yousaf", "Developer / QA",
           "Builds Pharmacy, Dashboard, Notifications, Reports and the browser self-test / final regression run.",
           "Pharmacy, Dashboard & QA"),
}

# Product backlog: id, story, priority rank, MoSCoW, points, in_sprint
PRODUCT_BACKLOG = [
 ("PB-17","As a developer, I need a verified relational database design so that all modules store data consistently.",1,"Must",8,True),
 ("PB-01","As a staff member, I want to log in securely so that only authorised people use HMS.",2,"Must",5,True),
 ("PB-02","As a receptionist, I want to register, edit, search and delete patients so that patient data is always current.",3,"Must",8,True),
 ("PB-04","As an administrator, I want to manage doctors and departments so that appointments can be assigned.",4,"Must",5,True),
 ("PB-06","As a receptionist, I want to book appointments with department, doctor, date and slot, and never double-book a doctor.",5,"Must",8,True),
 ("PB-07","As a doctor, I want to record visits with diagnosis and vitals so that medical history is complete.",6,"Must",8,True),
 ("PB-09","As a billing clerk, I want to create invoices with live totals, discount and tax so that patients are billed correctly.",7,"Must",8,True),
 ("PB-10","As a pharmacist, I want to manage medicine stock with expiry and low-stock warnings so that nothing runs out or expires.",8,"Must",5,True),
 ("PB-11","As a pharmacist, I want to dispense medicine and have stock reduce automatically so that stock is always accurate.",9,"Must",5,True),
 ("PB-18","As the team, we want automatic tests so that we can prove the Increment works.",10,"Must",5,True),
 ("PB-03","As a doctor, I want a patient profile with a timeline of appointments, records, bills and dispensing so that I see the full picture.",11,"Should",5,True),
 ("PB-05","As a receptionist, I want doctor schedules and an 'available today' filter so that I book the right doctor.",12,"Should",3,True),
 ("PB-08","As a doctor, I want to add prescriptions to a visit so that medicines are recorded with the record.",13,"Should",3,True),
 ("PB-12","As a manager, I want a dashboard with key numbers and alerts so that I see what needs attention.",14,"Should",5,True),
 ("PB-15","As a manager, I want reports across modules so that I can review hospital activity.",15,"Should",3,True),
 ("PB-16","As an auditor, I want every insert, update and delete logged so that changes can be traced.",16,"Should",3,True),
 ("PB-13","As a staff member, I want notifications with read/unread state so that I do not miss low stock or unpaid bills.",17,"Could",3,True),
 ("PB-14","As a staff member, I want one global search across modules so that I can find records quickly.",18,"Could",3,True),
 ("PB-19","As an administrator, I want role-based access (doctor, receptionist, pharmacist) so that users only see what they need.",19,"Should",8,False),
 ("PB-20","As a patient, I want SMS/email appointment reminders so that I do not miss visits.",20,"Could",5,False),
 ("PB-21","As a billing clerk, I want to print or export invoices as PDF so that I can give them to patients.",21,"Could",3,False),
 ("PB-22","As the hospital, we want to migrate to PostgreSQL and host online so that several branches can use HMS.",22,"Won't (this sprint)",8,False),
]

ACCEPTANCE = {
 "PB-17":["16 tables created from schema.sql with primary keys, foreign keys, CHECK and UNIQUE constraints.",
          "ER diagram, sample data and verification report delivered; verify_schema.py reports 0 failed checks."],
 "PB-01":["Empty form or wrong password is rejected with a clear message.",
          "Correct login (admin@hms.test) opens the dashboard; password is stored only as a salted hash."],
 "PB-02":["Required fields (first name, phone, date of birth) and formats are validated before saving.",
          "A saved patient appears as a new row in the patients table.",
          "Deleting a patient who has appointments is refused by the database (foreign key RESTRICT)."],
 "PB-04":["A doctor can be added/edited with department, fee and working days.",
          "Doctor list can be searched and filtered by department."],
 "PB-06":["Doctor list depends on the chosen department; time slots are offered for the chosen date.",
          "Selecting an already booked slot shows a warning in the form.",
          "Even if the form is bypassed, the database refuses two active appointments for the same doctor, date and time."],
 "PB-07":["Optional vitals are range-checked (e.g. temperature, pulse); systolic must be higher than diastolic.",
          "Blood pressure is stored as two numbers; a patient's visit history lists all records."],
 "PB-09":["Invoice supports several item rows; subtotal, discount, tax and total update live.",
          "Items are stored as separate rows; total is computed by a view, never stored.",
          "Payment status (unpaid / partial / paid) is saved and shown."],
 "PB-10":["Medicine can be added with batch, expiry, quantity and price.",
          "Expired and low-stock medicines are flagged in the list and in alerts."],
 "PB-11":["Dispensing writes a history row and reduces medicines.quantity.",
          "Dispensing more than the available stock is refused by the server."],
 "PB-18":["python tests/test_api.py passes all 86 checks; HMS_DB/verify_schema.py passes all 48 checks.",
          "selftest.html reports 0 failed; 44 browser checks recorded in e2e_browser_results.txt."],
 "PB-03":["Profile shows appointments, records, prescriptions, invoices and dispensing for one patient.",
          "Timeline can be filtered by type."],
 "PB-05":["Working days come from doctor_schedules (one row per day).",
          "'Available today' filter lists only doctors working today; doctor profile page opens."],
 "PB-08":["Several prescription rows can be added to one medical record.",
          "Prescriptions appear in the patient profile timeline."],
 "PB-12":["Dashboard cards, alerts, today's schedule and a chart are read from the database.",
          "Clicking a card opens the related module."],
 "PB-15":["Reports page summarises patients, appointments, billing and pharmacy figures from the database."],
 "PB-16":["Every insert, update and delete creates a row in audit_log with table, action and time."],
 "PB-13":["Alerts are generated from stock, unpaid bills and follow-ups.",
          "Marking an alert read is stored per user in notification_reads."],
 "PB-14":["Searching a name or code returns matches from patients, doctors, appointments, records, invoices and medicines."],
}

# tasks: id, story, title, owner, hours, priority, depends, start, due, done (date or None), status
D = date
TASKS = [
 # --- Abdullah ---
 ("T-01","PB-17","Design 16-table schema with keys and CHECK constraints (schema.sql)","AB",6,"High","",D(2026,10,19),D(2026,10,20),D(2026,10,20),"Done"),
 ("T-02","PB-17","Draw ER diagram and write sample_data.sql","AB",3,"Medium","T-01",D(2026,10,20),D(2026,10,21),D(2026,10,21),"Done"),
 ("T-03","PB-17","Write verify_schema.py (48 schema checks) and database report","AB",4,"Medium","T-01",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-04","PB-01","server.py: web server, JSON API skeleton, login with salted hash","AB",5,"High","T-01",D(2026,10,20),D(2026,10,21),D(2026,10,21),"Done"),
 ("T-05","PB-16","Audit log: record every insert, update, delete","AB",3,"Medium","T-04",D(2026,10,22),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-06","PB-06","Server rule + unique index against double-booking","AB",4,"High","T-01",D(2026,10,22),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-07","PB-18","tests/test_api.py: 86 server + database rule checks","AB",5,"High","T-04",D(2026,10,23),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-08","Process","Sprint admin: planning, daily scrum notes, keep board current","AB",3,"Medium","",D(2026,10,19),D(2026,11,1),None,"In Progress"),
 ("T-09","Process","Import backlog and board into Jira/GitHub Projects, share workspace link","AB",2,"High","T-08",D(2026,10,26),D(2026,10,27),None,"To Do"),
 # --- Umair ---
 ("T-10","PB-01","Login page UI with validation messages (index.html)","UQ",4,"High","T-04",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-11","PB-02","Patient form + browser validation (patients.html, validation.js)","UQ",5,"High","T-04",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-12","PB-02","Patient list: search, filter, edit, delete with FK refusal","UQ",5,"High","T-11",D(2026,10,22),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-13","PB-02","Server patient endpoints and storage.js mapping","UQ",3,"High","T-04",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-14","PB-03","Patient profile page with timeline filter (patient-profile.js)","UQ",5,"Medium","T-12",D(2026,10,23),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-15","PB-14","Global search page across modules (search.js)","UQ",4,"Low","T-12",D(2026,10,24),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-16","Process","Product Owner: prioritise backlog, write acceptance criteria","UQ",3,"High","",D(2026,10,19),D(2026,10,19),D(2026,10,19),"Done"),
 ("T-17","PB-02","Quick View modal for a patient","UQ",2,"Low","T-12",D(2026,10,24),D(2026,10,26),None,"In Review"),
 ("T-18","Process","Product Owner acceptance of the Increment at Sprint Review","UQ",2,"High","T-17",D(2026,10,30),D(2026,10,31),None,"To Do"),
 # --- Talha ---
 ("T-20","PB-04","Doctor form and list with department filter (doctors.js)","TA",5,"High","T-04",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-21","PB-04","Server doctor + department endpoints","TA",3,"High","T-04",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-22","PB-05","Weekly schedule rows and 'Available today' filter","TA",4,"Medium","T-20",D(2026,10,22),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-23","PB-05","Doctor profile page (doctor-profile.js)","TA",3,"Medium","T-22",D(2026,10,23),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-24","PB-06","Booking form: department > doctor > date > time slots","TA",6,"High","T-20",D(2026,10,22),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-25","PB-06","'Already booked' slot warning in the form","TA",3,"High","T-24,T-06",D(2026,10,24),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-26","PB-06","Week calendar view of appointments","TA",4,"Medium","T-24",D(2026,10,24),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-27","PB-06","Cancel / complete appointment status changes","TA",2,"Medium","T-24",D(2026,10,25),D(2026,10,26),None,"In Review"),
 ("T-28","PB-12","Dashboard 'today's schedule' widget","TA",3,"Low","T-24",D(2026,10,25),D(2026,10,27),None,"In Progress"),
 # --- Waleed ---
 ("T-30","PB-07","Medical record form with vitals, BP as two numbers","WA",6,"High","T-12",D(2026,10,22),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-31","PB-07","Vitals range validation and systolic > diastolic rule","WA",3,"High","T-30",D(2026,10,23),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-32","PB-08","Prescription rows inside a medical record","WA",4,"Medium","T-30",D(2026,10,23),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-33","PB-07","Patient history view and follow-up date","WA",3,"Medium","T-30",D(2026,10,24),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-34","PB-09","Invoice form with dynamic item rows and live totals","WA",7,"High","T-12",D(2026,10,22),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-35","PB-09","Discount and tax calculation; total view in database","WA",4,"High","T-34",D(2026,10,24),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-36","PB-09","Payment status handling (unpaid / partial / paid)","WA",3,"Medium","T-34",D(2026,10,25),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-37","Process","Peer code review of records and billing modules","WA",2,"Medium","T-36",D(2026,10,25),D(2026,10,27),None,"In Review"),
 # --- Yousaf ---
 ("T-40","PB-10","Medicine form and stock list (pharmacy.js)","MY",5,"High","T-04",D(2026,10,21),D(2026,10,22),D(2026,10,22),"Done"),
 ("T-41","PB-10","Expiry and low-stock warnings","MY",3,"High","T-40",D(2026,10,22),D(2026,10,23),D(2026,10,23),"Done"),
 ("T-42","PB-11","Dispensing form that reduces stock and writes history","MY",5,"High","T-40",D(2026,10,23),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-43","PB-11","Server refusal when quantity exceeds stock","MY",2,"High","T-42",D(2026,10,24),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-44","PB-12","Dashboard cards, alerts and chart (dashboard.js)","MY",5,"Medium","T-12,T-40",D(2026,10,23),D(2026,10,24),D(2026,10,24),"Done"),
 ("T-45","PB-13","Notifications with per-user read state","MY",4,"Low","T-44",D(2026,10,24),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-46","PB-15","Reports page (reports.js)","MY",3,"Medium","T-44",D(2026,10,24),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-47","PB-18","In-browser selftest.html and 44 end-to-end checks","MY",4,"High","T-45",D(2026,10,25),D(2026,10,25),D(2026,10,25),"Done"),
 ("T-48","PB-18","Final regression run on a clean machine; save results files","MY",2,"High","T-47",D(2026,10,28),D(2026,10,29),None,"In Progress"),
]

RISKS = [
 ("Double-booking if two users book the same slot at the same moment","Medium","High","Unique index in the database as final guard; server checks first; test in test_api.py.","TA / AB"),
 ("Data lost or inconsistent between browser, server and database","Medium","High","Single data layer (storage.js); foreign keys RESTRICT; Reset demo data button; audit_log.","AB"),
 ("Modules depend on the database and server being ready first","High","Medium","Schema and server built first (T-01..T-04); others start after T-04; dependencies shown on the board.","AB"),
 ("Team members fall behind or are unavailable","Medium","Medium","Daily scrum, tasks of 2-7 hours, pair review, Scrum Master reassigns blocked work.","AB"),
 ("Scope creep (roles, SMS reminders, PDF export, PostgreSQL)","Medium","Medium","Kept in the Product Backlog (PB-19..PB-22); Product Owner decides; not in this Sprint.","UQ"),
 ("Demo fails on another computer (Python version, port 8000 busy)","Low","High","Standard library only; start scripts for Win/Mac/Linux; port can be changed; rehearsal on a clean machine (T-48).","MY"),
 ("Inconsistent validation between browser and server","Medium","Medium","Shared rules in validation.js; same rules re-checked in server.py and CHECK constraints; tests for each.","WA / UQ"),
]

INCREMENT = [
 "Login screen backed by the users table (salted password hash).",
 "Patients: add, edit, view, search and delete; the database refuses deleting a patient with history.",
 "Doctors: records, departments, weekly schedules, 'available today' filter.",
 "Appointments: department > doctor > date > slot booking; double-booking blocked by form, server and database.",
 "Medical records: vitals with range checks, prescriptions, patient history.",
 "Billing: invoices with live totals, discount, tax and payment status.",
 "Pharmacy: stock, expiry warnings, dispensing that reduces stock.",
 "Dashboard, notifications, reports, global search and audit log.",
 "Automatic tests: 86 API + 48 schema + 44 browser checks, all passing.",
]

DEMO_ORDER = [  # who presents which slide section
 ("1-2","Project overview, Scrum team","Muhammad Abdullah Malik"),
 ("3-5","Product Backlog, Sprint Goal, Sprint Backlog","Umair Qaisar"),
 ("6","Task breakdown and allocation","Muhammad Abdullah Malik"),
 ("7","Estimation, scheduling, burndown","Talha Azeem"),
 ("8","Scrum Board (live in the tool)","Waleed Ali"),
 ("9","Expected Increment + live demo","Muhammad Yousaf"),
 ("10","Risks and challenges, Q&A","All members"),
]

COLUMNS = ["To Do","In Progress","In Review","Done"]

# ---------- helpers ----------
def story_map():
    return {s[0]: s for s in PRODUCT_BACKLOG}

def working_days():
    from datetime import timedelta
    d = SPRINT_START; out=[]
    while d <= SPRINT_END:
        out.append(d); d += timedelta(days=1)
    return out

def burndown():
    total = sum(t[4] for t in TASKS)
    days = working_days(); n = len(days)
    rows=[]
    for i,d in enumerate(days):
        ideal = round(total*(1 - i/(n-1)),1)
        actual = None
        if d <= SNAPSHOT:
            done = sum(t[4] for t in TASKS if t[9] and t[9] <= d)
            actual = total - done
        rows.append((d,ideal,actual))
    return total, rows
