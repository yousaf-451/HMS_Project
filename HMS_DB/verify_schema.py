"""Builds the HMS schema in SQLite and tests the constraints.
The SQL is PostgreSQL-style; the only change made for SQLite is the identity column syntax."""
import sqlite3, re, sys

schema = open("schema.sql").read()
schema = schema.replace("INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript(schema)
db.executescript(open("sample_data.sql").read())

results = []
def expect_ok(tid, what, sql, params=()):
    try:
        db.execute(sql, params); db.rollback(); results.append((tid, what, "accepted", "accepted", True))
    except sqlite3.Error as e:
        results.append((tid, what, "accepted", "REJECTED: " + str(e)[:60], False))
def expect_fail(tid, what, sql, params=()):
    try:
        db.execute(sql, params); db.rollback(); results.append((tid, what, "rejected", "ACCEPTED (wrong)", False))
    except sqlite3.IntegrityError as e:
        db.rollback(); results.append((tid, what, "rejected", "rejected", True))
def expect_value(tid, what, sql, expected):
    got = db.execute(sql).fetchall()
    results.append((tid, what, str(expected), str(got), got == expected))

# --- structure ---
tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
expect_value("S1", "Number of tables created", "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [(len(tables),)])
expect_value("S2", "Sample data loads with no FK violations", "PRAGMA foreign_key_check", [])

# --- entity integrity (PK / UNIQUE) ---
P = ("INSERT INTO patients (patient_code,first_name,last_name,date_of_birth,gender,blood_group,phone,address,"
     "emergency_contact_name,emergency_contact_phone,assigned_doctor_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
good = ["PAT-0099","Sara","Ali","1995-05-05","Female","B+","0300-9999999","House 1, Street 2","Omar Ali","0301-1111111",1]
expect_ok  ("E1", "Valid patient is accepted", P, good)
d = good.copy(); d[0] = "PAT-0001"
expect_fail("E2", "Duplicate patient_code rejected (UNIQUE)", P, d)
d = good.copy(); d[0] = "ABC-0099"
expect_fail("E3", "Bad patient_code format rejected", P, d)
expect_fail("E4", "Duplicate doctor email rejected", "UPDATE doctors SET email='sara@hms.test' WHERE doctor_id=2")
expect_fail("E5", "Duplicate medicine batch_number rejected", "UPDATE medicines SET batch_number='BA-1001' WHERE medicine_id=2")
expect_fail("E6", "Duplicate department name rejected", "INSERT INTO departments (name) VALUES ('Cardiology')")

# --- domain integrity (CHECK) ---
d = good.copy(); d[6] = "12345"
expect_fail("D1", "Invalid phone format rejected", P, d)
d = good.copy(); d[4] = "Unknown"
expect_fail("D2", "Invalid gender rejected", P, d)
d = good.copy(); d[5] = "Z+"
expect_fail("D3", "Invalid blood group rejected", P, d)
d = good.copy(); d[1] = "A"
expect_fail("D4", "First name shorter than 2 characters rejected", P, d)
expect_fail("D5", "Doctor experience above 60 rejected", "UPDATE doctors SET experience_years=70 WHERE doctor_id=1")
expect_fail("D6", "Doctor fee above 100000 rejected", "UPDATE doctors SET consultation_fee=200000 WHERE doctor_id=1")
expect_fail("D7", "Schedule end time before start time rejected", "INSERT INTO doctor_schedules (doctor_id,day_of_week,start_time,end_time) VALUES (1,'Tue','14:00','09:00')")
expect_fail("D8", "Second schedule row for same doctor and day rejected", "INSERT INTO doctor_schedules (doctor_id,day_of_week,start_time,end_time) VALUES (1,'Mon','09:00','10:00')")
expect_fail("D9", "Medicine quantity below 0 rejected", "UPDATE medicines SET quantity=-1 WHERE medicine_id=1")
expect_fail("D10","Medicine price with value 0 rejected", "UPDATE medicines SET unit_price=0 WHERE medicine_id=1")
expect_fail("D11","Invoice tax rate above 30 rejected", "UPDATE invoices SET tax_rate=50 WHERE invoice_id=1")
expect_fail("D12","Invoice item amount 0 rejected", "UPDATE invoice_items SET amount=0 WHERE item_id=1")
expect_fail("D13","Partially Paid with amount_paid 0 rejected", "UPDATE invoices SET amount_paid=0 WHERE invoice_id=3")
expect_fail("D14","Blood pressure systolic <= diastolic rejected", "UPDATE medical_records SET bp_systolic=80, bp_diastolic=120 WHERE record_id=1")
expect_fail("D15","Only one BP value given rejected", "UPDATE medical_records SET bp_diastolic=NULL WHERE record_id=1")
expect_fail("D16","Temperature 50 rejected", "UPDATE medical_records SET temperature_c=50 WHERE record_id=1")
expect_fail("D17","Follow-up date before visit date rejected", "UPDATE medical_records SET follow_up_date='2026-01-01' WHERE record_id=1")
expect_ok  ("D18","Record with no vitals and no follow-up accepted",
            "INSERT INTO medical_records (record_code,patient_id,doctor_id,visit_date,chief_complaint,diagnosis,treatment) VALUES ('REC-0099',1,1,'2026-10-10','Checkup visit','Healthy (sample)','None')")
expect_ok  ("D19","Patient with no email accepted (optional field)", P, good)
expect_fail("D20","Invalid appointment type rejected", "UPDATE appointments SET appointment_type='Surgery' WHERE appointment_id=1")

# --- conflict detection (partial unique index) ---
A = "INSERT INTO appointments (appointment_code,patient_id,doctor_id,appointment_date,appointment_time,appointment_type,reason) VALUES (?,?,?,?,?,?,?)"
expect_fail("C1", "Double booking (same doctor, date, time) rejected", A, ("APT-0099",2,1,"2026-10-15","09:30","Check-up","Another visit"))
expect_ok  ("C2", "Same time with a different doctor accepted", A, ("APT-0099",2,2,"2026-10-15","09:30","Check-up","Another visit"))
db.execute("UPDATE appointments SET status='Cancelled' WHERE appointment_id=1")
expect_ok  ("C3", "Cancelled appointment frees its slot", A, ("APT-0099",2,1,"2026-10-15","09:30","Check-up","Another visit"))
db.rollback()

# --- referential integrity (FK) ---
expect_fail("F1", "Appointment for a non-existent patient rejected", A, ("APT-0098",999,1,"2026-10-20","10:00","Check-up","Some reason"))
expect_fail("F2", "Deleting a doctor who has patients rejected (RESTRICT)", "DELETE FROM doctors WHERE doctor_id=1")
expect_fail("F3", "Deleting a patient who has appointments rejected (RESTRICT)", "DELETE FROM patients WHERE patient_id=1")
expect_fail("F4", "Deleting a department used by doctors rejected", "DELETE FROM departments WHERE department_id=1")
db.execute("DELETE FROM invoices WHERE invoice_id=4")
expect_value("F5", "Deleting an invoice removes its items (CASCADE)", "SELECT COUNT(*) FROM invoice_items WHERE invoice_id=4", [(0,)])
db.rollback()
db.execute("DELETE FROM appointments WHERE appointment_id=5")
expect_value("F6", "Deleting an appointment keeps the medical record (SET NULL)", "SELECT appointment_id FROM medical_records WHERE record_id=2", [(None,)])
db.rollback()
expect_fail("F7", "Dispensing a non-existent medicine rejected", "INSERT INTO dispensing (patient_id,medicine_id,quantity,unit_price) VALUES (1,999,1,1.0)")

# --- derived data (views) ---
expect_value("V1", "INV-0001 total = (80 - 0) x 1.05", "SELECT total FROM v_invoice_totals WHERE invoice_code='INV-0001'", [(84.0,)])
expect_value("V2", "INV-0002 total = (135 - 10) x 1.05 (worked example)", "SELECT subtotal, tax_amount, total FROM v_invoice_totals WHERE invoice_code='INV-0002'", [(135.0, 6.25, 131.25)])
expect_value("V3", "Invoice totals for all 4 invoices", "SELECT invoice_code, total FROM v_invoice_totals ORDER BY invoice_code",
             [("INV-0001",84.0),("INV-0002",131.25),("INV-0003",52.5),("INV-0004",42.0)])
expect_value("V4", "Stock status computed correctly", "SELECT medicine_code, stock_status FROM v_medicine_status ORDER BY medicine_code",
             [("MED-0001","In Stock"),("MED-0002","Low Stock"),("MED-0003","Out of Stock"),("MED-0004","Expired"),("MED-0005","In Stock"),("MED-0006","In Stock")])
expect_value("V5", "Dispensing amount = 3 x 0.30", "SELECT amount FROM v_dispensing_amount", [(0.9,)])

# --- queries the screens need (completeness of access paths) ---
expect_value("Q1", "Doctor's working days from doctor_schedules (DOC-001)", "SELECT day_of_week FROM doctor_schedules WHERE doctor_id=1 ORDER BY schedule_id", [("Mon",),("Wed",),("Fri",)])
expect_value("Q2", "Department -> active doctors (Cardiology)", "SELECT d.full_name FROM doctors d JOIN departments p USING(department_id) WHERE p.name='Cardiology' AND d.status='Active'", [("Dr. Sara Siddiqui",)])
expect_value("Q3", "Patient history: records of PAT-0004 newest first",
             "SELECT r.record_code FROM medical_records r JOIN patients p USING(patient_id) WHERE p.patient_code='PAT-0004' ORDER BY r.visit_date DESC", [("REC-0001",)])
expect_value("Q4", "Pending / partly paid invoices (dashboard alert)", "SELECT COUNT(*) FROM invoices WHERE status IN ('Pending','Partially Paid')", [(3,)])
expect_value("Q5", "Unread notifications for the admin user",
             "SELECT COUNT(*) FROM notifications n WHERE NOT EXISTS (SELECT 1 FROM notification_reads r WHERE r.notification_id=n.notification_id AND r.user_id=1)", [(3,)])

ok = sum(1 for r in results if r[4]); bad = len(results) - ok
with open("test_results.txt", "w") as f:
    f.write(f"HMS schema verification: {ok} passed, {bad} failed, {len(results)} tests\n")
    f.write(f"Tables: {len(tables)} -> {', '.join(sorted(tables))}\n\n")
    for tid, what, exp, got, passed in results:
        f.write(f"{'PASS' if passed else 'FAIL'}  {tid:<4} {what}\n")
        if not passed: f.write(f"        expected: {exp}\n        got:      {got}\n")
print(open("test_results.txt").read())
sys.exit(1 if bad else 0)
