# HMS Presentation Guide

Suggested length: 12–15 minutes. Use **Chrome or Edge** and rehearse once.

## Before you start (3 minutes of setup)
1. Open the project in VS Code, press **Ctrl+Shift+B** (or run `python server.py`). The browser opens the login page.
2. Log in (`admin@hms.test` / `Admin@123`) and click **Reset demo data**.
3. In VS Code open `HMS_DB/hms.db` with the **SQLite Viewer** extension (second window or split screen), so you can show rows appear.
4. Open `http://localhost:8000/selftest.html` in another tab: it should say "0 failed".
5. Close other tabs, zoom to 100%, keep the console closed.

---

## 1. Project introduction (about 1 minute)
> "HMS is a Hospital Management System. Hospitals handle patients, doctors, appointments, medical records, bills and medicines, and when these are on paper or in separate tools, information gets lost and mistakes happen. HMS brings them into one system. It is a web app, a Python server, and a relational database that I designed and verified in the database activity."

## 2. Architecture (about 1 minute)
> "The browser shows the screens and checks the input so users get quick messages. The Python server receives the requests, checks the business rules, and talks to the database. The database has the final say: it enforces keys, formats, ranges and relationships. So there are three layers of validation, and the database is the last one."

`browser (HMS/)  →  server.py  →  SQLite database (HMS_DB/hms.db)`

## 3. The six modules (about 1 minute)
- **Patient Management:** register, search, edit and view patients.
- **Doctor Management:** doctor records, departments, schedules and fees.
- **Appointments:** book visits with department, doctor and time slots, and prevent double-booking.
- **Medical Records:** visit history, diagnosis, vitals, prescriptions, follow-ups.
- **Billing:** invoices with live totals, discount and tax, and payment status.
- **Pharmacy:** medicine stock, expiry warnings, and dispensing.

Supporting: Dashboard, Reports, Notifications, global Search.

---

## 4. Demonstration flow (about 8 minutes)

| Step | Do | Say |
|---|---|---|
| 1. Login | Submit empty, then a wrong password, then the correct one | "The password is checked by the server against the users table, where it is stored as a salted hash, not as plain text." |
| 2. Dashboard | Point at cards, alerts, schedule. Click the **Patients** card | "These numbers are read from the database. The alerts come from stock, bills and follow-ups." |
| 3. Add patient | **+ Add Patient**, press Save empty, then fill it in and save. **Switch to the SQLite Viewer** and refresh the `patients` table | "Required fields and formats are checked in the browser first. When I save, a new row appears in the `patients` table." |
| 4. Database refuses | In Patients, **Delete** a patient who has appointments (e.g. Ayesha Khan) | "The database refuses, because other tables refer to this patient: foreign key with ON DELETE RESTRICT. Hospital history cannot disappear by accident." |
| 5. Patient views | **Quick View**, then **View**, use the timeline filter | "The profile joins five tables: appointments, records, prescriptions, invoices and dispensing." |
| 6. Doctor | **Doctors**: "Available today" filter, open a profile | "Working days come from the `doctor_schedules` table, one row per day." |
| 7. Appointment | **Book Appointment**: department, doctor, date, time. Pick a slot marked "already booked" | "The warning appears in the form, and even if someone bypassed the form, a unique index in the database blocks two active appointments for the same doctor, date and time." |
| 8. Medical record | **Medical Records → + Add**, enter BP `80/120` and temperature `50` | "Optional vitals still have ranges, and systolic must be higher than diastolic. Blood pressure is stored as two numbers so it can be checked." |
| 9. Billing | **Create Invoice**, add rows, discount 10, tax 5, save. Show `invoices` and `invoice_items` in the viewer | "The total is calculated live. In the database the items are separate rows and the total is computed by a view, never stored." |
| 10. Pharmacy | **Dispensing**, quantity 5, dispense. Show `medicines.quantity` and the `dispensing` table | "Dispensing writes a history row and reduces the stock. The server refuses to dispense more than the stock." |
| 11. Alerts and search | Open the 🔔, mark one read, then search a name | "Read/unread is stored per user in `notification_reads`. Search covers all modules." |
| 12. Audit | Open the `audit_log` table | "Every insert, update and delete I made is recorded here." |
| 13. Wrap up | Show **Reports** | "A summary of all modules. Everything is dummy data." |

**If you run short on time:** skip steps 6, 8 and 13.

---

## 5. Important forms
Patient, Doctor, Appointment, Medical Record, Invoice (with dynamic rows), Medicine, Stock update, Dispensing, and Login. Full field tables are in `PROTOTYPE_DOCUMENTATION.md`, section 6.

## 6. Data constraints (examples to say aloud)
- **Required vs optional:** patient email and medical notes are optional; first name, phone and date of birth are required.
- **Format:** phone `0300-1234567`, Patient ID `PAT-0001`, blood pressure `120/80`.
- **Range:** experience 0–60 years, heart rate 30–220, temperature 30–45 °C, tax 0–30 %.
- **Uniqueness:** Patient ID, Doctor ID and email, Medicine ID and batch number, and a doctor cannot have two appointments at the same date and time.
- **Cross-field:** end time after start time, follow-up not before the visit date, discount not above the subtotal.

## 7. Validation: three layers
1. **Browser:** HTML5 attributes and JavaScript, with friendly messages next to each field.
2. **Server:** business rules that need today's date or other tables (no future birth date, no booking in the past, doctor works that day, discount not above the subtotal, no dispensing more than the stock). Answers HTTP 400.
3. **Database:** keys, UNIQUE, CHECK, foreign keys, the unique index. Answers HTTP 409. Invalid data **never** reaches the tables.

## 8. Prototype limitations (say these honestly)
- Demo user only; roles exist in the database but are not enforced yet; no HTTPS or password reset.
- The pages send whole lists to the server; a production API would use one request per record.
- SQLite for easy installation; the schema is written for PostgreSQL.
- Dummy data only, no real payments, no hospital or pharmacy integration.
- "Available Beds" and "Recent Activities" are fixed sample content.

## 9. Future development
Role-based permissions on every endpoint, per-record REST API with asynchronous calls, PostgreSQL with migrations and backups, HTTPS and secure sessions, real reporting, "who viewed what" audit, payment and lab integrations, and deployment with automated tests.

---

## 10. Questions you may get

| Question | Suggested answer |
|---|---|
| Is the app really using the database? | "Yes. Every list on every screen is read from SQLite, and every save is a write to the tables. I can show the `hms.db` rows change while I use the app." |
| Which database system? | "SQLite, because it needs no installation. The SQL is written in PostgreSQL style, so moving to PostgreSQL is a small step." |
| Where are the validation rules? | "Three places: the browser for quick messages, the server for rules about dates and stock, and the database for keys and constraints. The database is the final protection." |
| Is the login secure? | "Passwords are salted and hashed, and the data API is closed to anyone not logged in. But it is a demo: one user, no HTTPS, no lock-out. Roles are in the table but not enforced yet." |
| Why can't I delete a patient? | "Because appointments, records or invoices refer to that patient. A foreign key with RESTRICT protects clinical and financial history." |
| Why can't records or invoices be deleted at all? | "Hospitals must keep them. Invoices can be cancelled, and every change is written to the audit log." |
| What stops SQL injection? | "The server never puts user text into SQL strings; it uses parameters. I tested a name like `Robert'); DROP TABLE patients;--`, and it is stored as plain text." |
| How did you test it? | "86 automatic checks for the server and database, 48 for the schema, and 44 clicks-through checks in a real browser. The results files are in the `tests` folder." |
| What would you improve first? | "Enforce roles on each endpoint, switch to a per-record API, and move to PostgreSQL." |

## 11. Final checks before presenting
- [ ] Server running (`python server.py`) and the login page opens
- [ ] **Reset demo data** was clicked
- [ ] `hms.db` open in the SQLite Viewer
- [ ] `selftest.html` shows 0 failed
- [ ] Browser zoom 100%, Chrome or Edge
- [ ] You have rehearsed once from login to the audit log
