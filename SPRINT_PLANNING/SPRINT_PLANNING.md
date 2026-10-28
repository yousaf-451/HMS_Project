# HMS - Hospital Management System
## Sprint 1 Planning Document

**Course activity:** Agile/Scrum - Sprint Planning and Task Allocation  
**Sprint:** 19 Oct 2026 to 01 Nov 2026 (14 days)  
**Board snapshot:** 25 Oct 2026  
**Workspace link:** PASTE-YOUR-JIRA-OR-GITHUB-PROJECTS-LINK-HERE

> Files in this folder: `Sprint_Planning_Presentation.pptx` (slides), `scrum_board.html` (open in a browser), `product_backlog.csv` and `sprint_backlog_tasks.csv` (import into Jira / Trello / GitHub Projects), `WORKSPACE_SETUP.md` (import steps). Everything is generated from `sprint_data.py`.

---
## 1. Project overview

HMS is a web-based Hospital Management System: **browser (HMS/) -> Python server (server.py) -> SQLite database (HMS_DB/hms.db)**.

**Objectives**

- Replace paper / separate tools with one system for patients, doctors, appointments, records, bills and medicines.
- Keep data correct with three validation layers: browser, Python server, database constraints.
- Give staff dashboard, alerts, search and reports so they can see what needs attention.
- Prove quality with automatic tests (86 API checks, 48 schema checks, 44 browser checks).

**Major functional modules**

| Module | What it does |
|---|---|
| Patient Management | Register, search, edit, view patients and their history |
| Doctor Management | Doctor records, departments, weekly schedules, fees |
| Appointments | Booking with slots, double-booking prevention, week calendar |
| Medical Records | Visits, diagnosis, vitals, prescriptions, follow-ups |
| Billing | Invoices with live totals, discount, tax, payment status |
| Pharmacy | Medicine stock, expiry warnings, dispensing |
| Supporting | Login, dashboard, reports, notifications, global search, audit log |

---
## 2. Scrum team

| Member | Scrum role | Focus area | Responsibilities |
|---|---|---|---|
| Muhammad Abdullah Malik | Scrum Master + Developer (Team Lead) | Database & Backend | Runs Sprint ceremonies, removes blockers, keeps the board current. Builds database, server.py, login, audit log and API tests. |
| Umair Qaisar | Product Owner + Developer | Patients & Search | Owns and prioritises the Product Backlog, writes acceptance criteria, accepts finished stories. Builds Patient module, login page and global search. |
| Talha Azeem | Developer | Doctors & Appointments | Builds Doctor Management and Appointments (booking, slots, calendar, double-booking warning). |
| Waleed Ali | Developer | Records & Billing | Builds Medical Records (vitals, prescriptions) and Billing (invoices, live totals, payments). |
| Muhammad Yousaf | Developer / QA | Pharmacy, Dashboard & QA | Builds Pharmacy, Dashboard, Notifications, Reports and the browser self-test / final regression run. |

**Scrum events:** Sprint Planning (19 Oct), Daily Scrum 15 min at 10:00, Sprint Review (31 Oct 2026), Retrospective (01 Nov 2026).

---
## 3. Product Backlog (prioritised)

| Rank | ID | User story | MoSCoW | Points | In Sprint 1 |
|---|---|---|---|---|---|
| 1 | PB-17 | As a developer, I need a verified relational database design so that all modules store data consistently. | Must | 8 | Yes |
| 2 | PB-01 | As a staff member, I want to log in securely so that only authorised people use HMS. | Must | 5 | Yes |
| 3 | PB-02 | As a receptionist, I want to register, edit, search and delete patients so that patient data is always current. | Must | 8 | Yes |
| 4 | PB-04 | As an administrator, I want to manage doctors and departments so that appointments can be assigned. | Must | 5 | Yes |
| 5 | PB-06 | As a receptionist, I want to book appointments with department, doctor, date and slot, and never double-book a doctor. | Must | 8 | Yes |
| 6 | PB-07 | As a doctor, I want to record visits with diagnosis and vitals so that medical history is complete. | Must | 8 | Yes |
| 7 | PB-09 | As a billing clerk, I want to create invoices with live totals, discount and tax so that patients are billed correctly. | Must | 8 | Yes |
| 8 | PB-10 | As a pharmacist, I want to manage medicine stock with expiry and low-stock warnings so that nothing runs out or expires. | Must | 5 | Yes |
| 9 | PB-11 | As a pharmacist, I want to dispense medicine and have stock reduce automatically so that stock is always accurate. | Must | 5 | Yes |
| 10 | PB-18 | As the team, we want automatic tests so that we can prove the Increment works. | Must | 5 | Yes |
| 11 | PB-03 | As a doctor, I want a patient profile with a timeline of appointments, records, bills and dispensing so that I see the full picture. | Should | 5 | Yes |
| 12 | PB-05 | As a receptionist, I want doctor schedules and an 'available today' filter so that I book the right doctor. | Should | 3 | Yes |
| 13 | PB-08 | As a doctor, I want to add prescriptions to a visit so that medicines are recorded with the record. | Should | 3 | Yes |
| 14 | PB-12 | As a manager, I want a dashboard with key numbers and alerts so that I see what needs attention. | Should | 5 | Yes |
| 15 | PB-15 | As a manager, I want reports across modules so that I can review hospital activity. | Should | 3 | Yes |
| 16 | PB-16 | As an auditor, I want every insert, update and delete logged so that changes can be traced. | Should | 3 | Yes |
| 17 | PB-13 | As a staff member, I want notifications with read/unread state so that I do not miss low stock or unpaid bills. | Could | 3 | Yes |
| 18 | PB-14 | As a staff member, I want one global search across modules so that I can find records quickly. | Could | 3 | Yes |
| 19 | PB-19 | As an administrator, I want role-based access (doctor, receptionist, pharmacist) so that users only see what they need. | Should | 8 | No |
| 20 | PB-20 | As a patient, I want SMS/email appointment reminders so that I do not miss visits. | Could | 5 | No |
| 21 | PB-21 | As a billing clerk, I want to print or export invoices as PDF so that I can give them to patients. | Could | 3 | No |
| 22 | PB-22 | As the hospital, we want to migrate to PostgreSQL and host online so that several branches can use HMS. | Won't (this sprint) | 8 | No |

Priority rule: dependencies first (database), then MUST items users cannot work without, then SHOULD and COULD. Sprint 1 takes 93 story points.

---
## 4. Sprint Goal and duration

**Sprint Goal:** Deliver a working, testable HMS Increment: a staff member can log in and manage patients, doctors, appointments (no double-booking), medical records, billing and pharmacy stock, with every change stored in the SQLite database and covered by automatic tests.

- **Duration:** 14 days, 19 Oct 2026 - 01 Nov 2026
- **Capacity:** 5 members x about 35 hours = about 175 hours; committed 166 hours (44 tasks, 93 story points)
- **Sprint Review / Retrospective:** 31 Oct 2026 / 01 Nov 2026

**Definition of Done**

- Code works in Chrome/Edge against the real database (no localStorage data).
- Browser validation, server rule and database constraint all behave as specified.
- Acceptance criteria demonstrated to the Product Owner.
- Automatic tests pass (tests/test_api.py, HMS_DB/verify_schema.py, selftest.html).
- Another team member has reviewed the code (In Review column) before Done.

---
## 5. Sprint Backlog (stories with acceptance criteria)

### PB-17 (8 pts, Must)
As a developer, I need a verified relational database design so that all modules store data consistently.

**Acceptance criteria**
- 16 tables created from schema.sql with primary keys, foreign keys, CHECK and UNIQUE constraints.
- ER diagram, sample data and verification report delivered; verify_schema.py reports 0 failed checks.

**Tasks:** T-01 (AB), T-02 (AB), T-03 (AB)

### PB-01 (5 pts, Must)
As a staff member, I want to log in securely so that only authorised people use HMS.

**Acceptance criteria**
- Empty form or wrong password is rejected with a clear message.
- Correct login (admin@hms.test) opens the dashboard; password is stored only as a salted hash.

**Tasks:** T-04 (AB), T-10 (UQ)

### PB-02 (8 pts, Must)
As a receptionist, I want to register, edit, search and delete patients so that patient data is always current.

**Acceptance criteria**
- Required fields (first name, phone, date of birth) and formats are validated before saving.
- A saved patient appears as a new row in the patients table.
- Deleting a patient who has appointments is refused by the database (foreign key RESTRICT).

**Tasks:** T-11 (UQ), T-12 (UQ), T-13 (UQ), T-17 (UQ)

### PB-04 (5 pts, Must)
As an administrator, I want to manage doctors and departments so that appointments can be assigned.

**Acceptance criteria**
- A doctor can be added/edited with department, fee and working days.
- Doctor list can be searched and filtered by department.

**Tasks:** T-20 (TA), T-21 (TA)

### PB-06 (8 pts, Must)
As a receptionist, I want to book appointments with department, doctor, date and slot, and never double-book a doctor.

**Acceptance criteria**
- Doctor list depends on the chosen department; time slots are offered for the chosen date.
- Selecting an already booked slot shows a warning in the form.
- Even if the form is bypassed, the database refuses two active appointments for the same doctor, date and time.

**Tasks:** T-06 (AB), T-24 (TA), T-25 (TA), T-26 (TA), T-27 (TA)

### PB-07 (8 pts, Must)
As a doctor, I want to record visits with diagnosis and vitals so that medical history is complete.

**Acceptance criteria**
- Optional vitals are range-checked (e.g. temperature, pulse); systolic must be higher than diastolic.
- Blood pressure is stored as two numbers; a patient's visit history lists all records.

**Tasks:** T-30 (WA), T-31 (WA), T-33 (WA)

### PB-09 (8 pts, Must)
As a billing clerk, I want to create invoices with live totals, discount and tax so that patients are billed correctly.

**Acceptance criteria**
- Invoice supports several item rows; subtotal, discount, tax and total update live.
- Items are stored as separate rows; total is computed by a view, never stored.
- Payment status (unpaid / partial / paid) is saved and shown.

**Tasks:** T-34 (WA), T-35 (WA), T-36 (WA)

### PB-10 (5 pts, Must)
As a pharmacist, I want to manage medicine stock with expiry and low-stock warnings so that nothing runs out or expires.

**Acceptance criteria**
- Medicine can be added with batch, expiry, quantity and price.
- Expired and low-stock medicines are flagged in the list and in alerts.

**Tasks:** T-40 (MY), T-41 (MY)

### PB-11 (5 pts, Must)
As a pharmacist, I want to dispense medicine and have stock reduce automatically so that stock is always accurate.

**Acceptance criteria**
- Dispensing writes a history row and reduces medicines.quantity.
- Dispensing more than the available stock is refused by the server.

**Tasks:** T-42 (MY), T-43 (MY)

### PB-18 (5 pts, Must)
As the team, we want automatic tests so that we can prove the Increment works.

**Acceptance criteria**
- python tests/test_api.py passes all 86 checks; HMS_DB/verify_schema.py passes all 48 checks.
- selftest.html reports 0 failed; 44 browser checks recorded in e2e_browser_results.txt.

**Tasks:** T-07 (AB), T-47 (MY), T-48 (MY)

### PB-03 (5 pts, Should)
As a doctor, I want a patient profile with a timeline of appointments, records, bills and dispensing so that I see the full picture.

**Acceptance criteria**
- Profile shows appointments, records, prescriptions, invoices and dispensing for one patient.
- Timeline can be filtered by type.

**Tasks:** T-14 (UQ)

### PB-05 (3 pts, Should)
As a receptionist, I want doctor schedules and an 'available today' filter so that I book the right doctor.

**Acceptance criteria**
- Working days come from doctor_schedules (one row per day).
- 'Available today' filter lists only doctors working today; doctor profile page opens.

**Tasks:** T-22 (TA), T-23 (TA)

### PB-08 (3 pts, Should)
As a doctor, I want to add prescriptions to a visit so that medicines are recorded with the record.

**Acceptance criteria**
- Several prescription rows can be added to one medical record.
- Prescriptions appear in the patient profile timeline.

**Tasks:** T-32 (WA)

### PB-12 (5 pts, Should)
As a manager, I want a dashboard with key numbers and alerts so that I see what needs attention.

**Acceptance criteria**
- Dashboard cards, alerts, today's schedule and a chart are read from the database.
- Clicking a card opens the related module.

**Tasks:** T-28 (TA), T-44 (MY)

### PB-15 (3 pts, Should)
As a manager, I want reports across modules so that I can review hospital activity.

**Acceptance criteria**
- Reports page summarises patients, appointments, billing and pharmacy figures from the database.

**Tasks:** T-46 (MY)

### PB-16 (3 pts, Should)
As an auditor, I want every insert, update and delete logged so that changes can be traced.

**Acceptance criteria**
- Every insert, update and delete creates a row in audit_log with table, action and time.

**Tasks:** T-05 (AB)

### PB-13 (3 pts, Could)
As a staff member, I want notifications with read/unread state so that I do not miss low stock or unpaid bills.

**Acceptance criteria**
- Alerts are generated from stock, unpaid bills and follow-ups.
- Marking an alert read is stored per user in notification_reads.

**Tasks:** T-45 (MY)

### PB-14 (3 pts, Could)
As a staff member, I want one global search across modules so that I can find records quickly.

**Acceptance criteria**
- Searching a name or code returns matches from patients, doctors, appointments, records, invoices and medicines.

**Tasks:** T-15 (UQ)

---
## 6. Task breakdown and allocation

Each story is cut into tasks of 2-7 hours so one person can finish a task in a day or two. Each member owns one area, so work does not collide.

| Member | Area | Tasks | Hours | Done tasks |
|---|---|---|---|---|
| Muhammad Abdullah Malik | Database & Backend | 9 | 35 | 7 |
| Umair Qaisar | Patients & Search | 9 | 33 | 7 |
| Talha Azeem | Doctors & Appointments | 9 | 33 | 7 |
| Waleed Ali | Records & Billing | 8 | 32 | 7 |
| Muhammad Yousaf | Pharmacy, Dashboard & QA | 9 | 33 | 8 |

**Muhammad Abdullah Malik** (Scrum Master + Developer (Team Lead))

| Task | Story | Description | Hours | Status |
|---|---|---|---|---|
| T-01 | PB-17 | Design 16-table schema with keys and CHECK constraints (schema.sql) | 6 | Done |
| T-02 | PB-17 | Draw ER diagram and write sample_data.sql | 3 | Done |
| T-03 | PB-17 | Write verify_schema.py (48 schema checks) and database report | 4 | Done |
| T-04 | PB-01 | server.py: web server, JSON API skeleton, login with salted hash | 5 | Done |
| T-05 | PB-16 | Audit log: record every insert, update, delete | 3 | Done |
| T-06 | PB-06 | Server rule + unique index against double-booking | 4 | Done |
| T-07 | PB-18 | tests/test_api.py: 86 server + database rule checks | 5 | Done |
| T-08 | Process | Sprint admin: planning, daily scrum notes, keep board current | 3 | In Progress |
| T-09 | Process | Import backlog and board into Jira/GitHub Projects, share workspace link | 2 | To Do |

**Umair Qaisar** (Product Owner + Developer)

| Task | Story | Description | Hours | Status |
|---|---|---|---|---|
| T-10 | PB-01 | Login page UI with validation messages (index.html) | 4 | Done |
| T-11 | PB-02 | Patient form + browser validation (patients.html, validation.js) | 5 | Done |
| T-12 | PB-02 | Patient list: search, filter, edit, delete with FK refusal | 5 | Done |
| T-13 | PB-02 | Server patient endpoints and storage.js mapping | 3 | Done |
| T-14 | PB-03 | Patient profile page with timeline filter (patient-profile.js) | 5 | Done |
| T-15 | PB-14 | Global search page across modules (search.js) | 4 | Done |
| T-16 | Process | Product Owner: prioritise backlog, write acceptance criteria | 3 | Done |
| T-17 | PB-02 | Quick View modal for a patient | 2 | In Review |
| T-18 | Process | Product Owner acceptance of the Increment at Sprint Review | 2 | To Do |

**Talha Azeem** (Developer)

| Task | Story | Description | Hours | Status |
|---|---|---|---|---|
| T-20 | PB-04 | Doctor form and list with department filter (doctors.js) | 5 | Done |
| T-21 | PB-04 | Server doctor + department endpoints | 3 | Done |
| T-22 | PB-05 | Weekly schedule rows and 'Available today' filter | 4 | Done |
| T-23 | PB-05 | Doctor profile page (doctor-profile.js) | 3 | Done |
| T-24 | PB-06 | Booking form: department > doctor > date > time slots | 6 | Done |
| T-25 | PB-06 | 'Already booked' slot warning in the form | 3 | Done |
| T-26 | PB-06 | Week calendar view of appointments | 4 | Done |
| T-27 | PB-06 | Cancel / complete appointment status changes | 2 | In Review |
| T-28 | PB-12 | Dashboard 'today's schedule' widget | 3 | In Progress |

**Waleed Ali** (Developer)

| Task | Story | Description | Hours | Status |
|---|---|---|---|---|
| T-30 | PB-07 | Medical record form with vitals, BP as two numbers | 6 | Done |
| T-31 | PB-07 | Vitals range validation and systolic > diastolic rule | 3 | Done |
| T-32 | PB-08 | Prescription rows inside a medical record | 4 | Done |
| T-33 | PB-07 | Patient history view and follow-up date | 3 | Done |
| T-34 | PB-09 | Invoice form with dynamic item rows and live totals | 7 | Done |
| T-35 | PB-09 | Discount and tax calculation; total view in database | 4 | Done |
| T-36 | PB-09 | Payment status handling (unpaid / partial / paid) | 3 | Done |
| T-37 | Process | Peer code review of records and billing modules | 2 | In Review |

**Muhammad Yousaf** (Developer / QA)

| Task | Story | Description | Hours | Status |
|---|---|---|---|---|
| T-40 | PB-10 | Medicine form and stock list (pharmacy.js) | 5 | Done |
| T-41 | PB-10 | Expiry and low-stock warnings | 3 | Done |
| T-42 | PB-11 | Dispensing form that reduces stock and writes history | 5 | Done |
| T-43 | PB-11 | Server refusal when quantity exceeds stock | 2 | Done |
| T-44 | PB-12 | Dashboard cards, alerts and chart (dashboard.js) | 5 | Done |
| T-45 | PB-13 | Notifications with per-user read state | 4 | Done |
| T-46 | PB-15 | Reports page (reports.js) | 3 | Done |
| T-47 | PB-18 | In-browser selftest.html and 44 end-to-end checks | 4 | Done |
| T-48 | PB-18 | Final regression run on a clean machine; save results files | 2 | In Progress |

---
## 7. Task estimation and scheduling

Estimates are in hours (task level) and story points (story level). Priorities: High = blocks others or a Must story; Medium = Should; Low = Could.

| Task | Priority | Hours | Depends on | Start | Due | Completed | Status |
|---|---|---|---|---|---|---|---|
| T-01 | High | 6 | - | 19 Oct 2026 | 20 Oct 2026 | 20 Oct 2026 | Done |
| T-02 | Medium | 3 | T-01 | 20 Oct 2026 | 21 Oct 2026 | 21 Oct 2026 | Done |
| T-03 | Medium | 4 | T-01 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-04 | High | 5 | T-01 | 20 Oct 2026 | 21 Oct 2026 | 21 Oct 2026 | Done |
| T-05 | Medium | 3 | T-04 | 22 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-06 | High | 4 | T-01 | 22 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-07 | High | 5 | T-04 | 23 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-08 | Medium | 3 | - | 19 Oct 2026 | 01 Nov 2026 | - | In Progress |
| T-09 | High | 2 | T-08 | 26 Oct 2026 | 27 Oct 2026 | - | To Do |
| T-10 | High | 4 | T-04 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-11 | High | 5 | T-04 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-12 | High | 5 | T-11 | 22 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-13 | High | 3 | T-04 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-14 | Medium | 5 | T-12 | 23 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-15 | Low | 4 | T-12 | 24 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-16 | High | 3 | - | 19 Oct 2026 | 19 Oct 2026 | 19 Oct 2026 | Done |
| T-17 | Low | 2 | T-12 | 24 Oct 2026 | 26 Oct 2026 | - | In Review |
| T-18 | High | 2 | T-17 | 30 Oct 2026 | 31 Oct 2026 | - | To Do |
| T-20 | High | 5 | T-04 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-21 | High | 3 | T-04 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-22 | Medium | 4 | T-20 | 22 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-23 | Medium | 3 | T-22 | 23 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-24 | High | 6 | T-20 | 22 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-25 | High | 3 | T-24,T-06 | 24 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-26 | Medium | 4 | T-24 | 24 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-27 | Medium | 2 | T-24 | 25 Oct 2026 | 26 Oct 2026 | - | In Review |
| T-28 | Low | 3 | T-24 | 25 Oct 2026 | 27 Oct 2026 | - | In Progress |
| T-30 | High | 6 | T-12 | 22 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-31 | High | 3 | T-30 | 23 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-32 | Medium | 4 | T-30 | 23 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-33 | Medium | 3 | T-30 | 24 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-34 | High | 7 | T-12 | 22 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-35 | High | 4 | T-34 | 24 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-36 | Medium | 3 | T-34 | 25 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-37 | Medium | 2 | T-36 | 25 Oct 2026 | 27 Oct 2026 | - | In Review |
| T-40 | High | 5 | T-04 | 21 Oct 2026 | 22 Oct 2026 | 22 Oct 2026 | Done |
| T-41 | High | 3 | T-40 | 22 Oct 2026 | 23 Oct 2026 | 23 Oct 2026 | Done |
| T-42 | High | 5 | T-40 | 23 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-43 | High | 2 | T-42 | 24 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-44 | Medium | 5 | T-12,T-40 | 23 Oct 2026 | 24 Oct 2026 | 24 Oct 2026 | Done |
| T-45 | Low | 4 | T-44 | 24 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-46 | Medium | 3 | T-44 | 24 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-47 | High | 4 | T-45 | 25 Oct 2026 | 25 Oct 2026 | 25 Oct 2026 | Done |
| T-48 | High | 2 | T-47 | 28 Oct 2026 | 29 Oct 2026 | - | In Progress |

**Critical path:** T-01 schema -> T-04 server/login -> module tasks -> T-47 browser self-test -> T-48 final regression run.

**Burndown (hours remaining)**

| Day | Ideal | Actual |
|---|---|---|
| 19 Oct | 166.0 | 163 |
| 20 Oct | 153.2 | 157 |
| 21 Oct | 140.5 | 149 |
| 22 Oct | 127.7 | 120 |
| 23 Oct | 114.9 | 92 |
| 24 Oct | 102.2 | 44 |
| 25 Oct | 89.4 | 18 |
| 26 Oct | 76.6 |  |
| 27 Oct | 63.8 |  |
| 28 Oct | 51.1 |  |
| 29 Oct | 38.3 |  |
| 30 Oct | 25.5 |  |
| 31 Oct | 12.8 |  |
| 01 Nov | 0.0 |  |

---
## 8. Scrum Board (snapshot 25 Oct 2026)

| To Do (2) | In Progress (3) | In Review (3) | Done (36) |
|---|---|---|---|
| T-09 Import backlog and board into Jira/GitHub ... (Malik) | T-08 Sprint admin: planning, daily scrum notes,... (Malik) | T-17 Quick View modal for a patient... (Qaisar) | T-01 Design 16-table schema with keys and CHECK... (Malik) |
| T-18 Product Owner acceptance of the Increment ... (Qaisar) | T-28 Dashboard 'today's schedule' widget... (Azeem) | T-27 Cancel / complete appointment status chang... (Azeem) | T-02 Draw ER diagram and write sample_data.sql... (Malik) |
|  | T-48 Final regression run on a clean machine; s... (Yousaf) | T-37 Peer code review of records and billing mo... (Ali) | T-03 Write verify_schema.py (48 schema checks) ... (Malik) |
|  |  |  | T-04 server.py: web server, JSON API skeleton, ... (Malik) |
|  |  |  | T-05 Audit log: record every insert, update, de... (Malik) |
|  |  |  | T-06 Server rule + unique index against double-... (Malik) |
|  |  |  | T-07 tests/test_api.py: 86 server + database ru... (Malik) |
|  |  |  | T-10 Login page UI with validation messages (in... (Qaisar) |
|  |  |  | T-11 Patient form + browser validation (patient... (Qaisar) |
|  |  |  | T-12 Patient list: search, filter, edit, delete... (Qaisar) |
|  |  |  | T-13 Server patient endpoints and storage.js ma... (Qaisar) |
|  |  |  | T-14 Patient profile page with timeline filter ... (Qaisar) |
|  |  |  | T-15 Global search page across modules (search.... (Qaisar) |
|  |  |  | T-16 Product Owner: prioritise backlog, write a... (Qaisar) |
|  |  |  | T-20 Doctor form and list with department filte... (Azeem) |
|  |  |  | T-21 Server doctor + department endpoints... (Azeem) |
|  |  |  | T-22 Weekly schedule rows and 'Available today'... (Azeem) |
|  |  |  | T-23 Doctor profile page (doctor-profile.js)... (Azeem) |
|  |  |  | T-24 Booking form: department > doctor > date >... (Azeem) |
|  |  |  | T-25 'Already booked' slot warning in the form... (Azeem) |
|  |  |  | T-26 Week calendar view of appointments... (Azeem) |
|  |  |  | T-30 Medical record form with vitals, BP as two... (Ali) |
|  |  |  | T-31 Vitals range validation and systolic > dia... (Ali) |
|  |  |  | T-32 Prescription rows inside a medical record... (Ali) |
|  |  |  | T-33 Patient history view and follow-up date... (Ali) |
|  |  |  | T-34 Invoice form with dynamic item rows and li... (Ali) |
|  |  |  | T-35 Discount and tax calculation; total view i... (Ali) |
|  |  |  | T-36 Payment status handling (unpaid / partial ... (Ali) |
|  |  |  | T-40 Medicine form and stock list (pharmacy.js)... (Yousaf) |
|  |  |  | T-41 Expiry and low-stock warnings... (Yousaf) |
|  |  |  | T-42 Dispensing form that reduces stock and wri... (Yousaf) |
|  |  |  | T-43 Server refusal when quantity exceeds stock... (Yousaf) |
|  |  |  | T-44 Dashboard cards, alerts and chart (dashboa... (Yousaf) |
|  |  |  | T-45 Notifications with per-user read state... (Yousaf) |
|  |  |  | T-46 Reports page (reports.js)... (Yousaf) |
|  |  |  | T-47 In-browser selftest.html and 44 end-to-end... (Yousaf) |

See `scrum_board.html` for the full visual board. Progress: 148 of 166 hours done (89%).

---
## 9. Expected Sprint Increment

- Login screen backed by the users table (salted password hash).
- Patients: add, edit, view, search and delete; the database refuses deleting a patient with history.
- Doctors: records, departments, weekly schedules, 'available today' filter.
- Appointments: department > doctor > date > slot booking; double-booking blocked by form, server and database.
- Medical records: vitals with range checks, prescriptions, patient history.
- Billing: invoices with live totals, discount, tax and payment status.
- Pharmacy: stock, expiry warnings, dispensing that reduces stock.
- Dashboard, notifications, reports, global search and audit log.
- Automatic tests: 86 API + 48 schema + 44 browser checks, all passing.

Demonstration: Sprint Review on 31 Oct 2026, following `HMS/PRESENTATION_GUIDE.md`.

---
## 10. Risks and challenges

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Double-booking if two users book the same slot at the same moment | Medium | High | Unique index in the database as final guard; server checks first; test in test_api.py. | TA / AB |
| Data lost or inconsistent between browser, server and database | Medium | High | Single data layer (storage.js); foreign keys RESTRICT; Reset demo data button; audit_log. | AB |
| Modules depend on the database and server being ready first | High | Medium | Schema and server built first (T-01..T-04); others start after T-04; dependencies shown on the board. | AB |
| Team members fall behind or are unavailable | Medium | Medium | Daily scrum, tasks of 2-7 hours, pair review, Scrum Master reassigns blocked work. | AB |
| Scope creep (roles, SMS reminders, PDF export, PostgreSQL) | Medium | Medium | Kept in the Product Backlog (PB-19..PB-22); Product Owner decides; not in this Sprint. | UQ |
| Demo fails on another computer (Python version, port 8000 busy) | Low | High | Standard library only; start scripts for Win/Mac/Linux; port can be changed; rehearsal on a clean machine (T-48). | MY |
| Inconsistent validation between browser and server | Medium | Medium | Shared rules in validation.js; same rules re-checked in server.py and CHECK constraints; tests for each. | WA / UQ |

---
## Who presents what

| Slides | Topic | Presenter |
|---|---|---|
| 1-2 | Project overview, Scrum team | Muhammad Abdullah Malik |
| 3-5 | Product Backlog, Sprint Goal, Sprint Backlog | Umair Qaisar |
| 6 | Task breakdown and allocation | Muhammad Abdullah Malik |
| 7 | Estimation, scheduling, burndown | Talha Azeem |
| 8 | Scrum Board (live in the tool) | Waleed Ali |
| 9 | Expected Increment + live demo | Muhammad Yousaf |
| 10 | Risks and challenges, Q&A | All members |
