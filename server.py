#!/usr/bin/env python3
"""
HMS server — serves the web app AND a small JSON API on top of a SQLite database.

  python server.py            (Windows: py server.py)
  then open http://localhost:8000

Uses only the Python standard library (nothing to install).
Database file : HMS_DB/hms.db   (created automatically from HMS_DB/schema.sql)
Web app folder: HMS/

How the pieces fit
  browser (HMS/js/storage.js)  --JSON-->  this file  --SQL-->  HMS_DB/hms.db
The browser code keeps working with the same JSON "collections" as before
(patients, doctors, ...). This file maps each collection to the relational
tables in schema.sql and lets the DATABASE enforce its keys and constraints.
"""
import hashlib, json, os, re, secrets, sqlite3, sys, webbrowser
from datetime import date, datetime
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(BASE, "HMS")
SCHEMA = os.path.join(BASE, "HMS_DB", "schema.sql")
DB_PATH = os.environ.get("HMS_DB_PATH", os.path.join(BASE, "HMS_DB", "hms.db"))
HOST = "127.0.0.1"            # this computer only (not visible to other devices)

DEPARTMENTS = ["Cardiology", "General Medicine", "Dermatology", "Pediatrics",
               "Orthopedics", "Neurology", "Gynecology", "ENT"]
CATEGORIES = ["Cardiac", "Painkiller", "Antibiotic", "Syrup", "Topical", "Supplement", "Antacid", "Other"]
ADMIN_EMAIL, ADMIN_PASSWORD = "admin@hms.test", "Admin@123"
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

SESSIONS = {}                 # token -> {"user_id":..., "name":..., "role":...}  (memory only)


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status, self.message = status, message


# ------------------------------------------------------------------ database
def connect():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")          # make the database enforce foreign keys
    return con


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000).hex()
    return f"pbkdf2${salt}${h}"


def check_password(password, stored):
    try:
        _, salt, _ = stored.split("$")
    except ValueError:
        return False
    return secrets.compare_digest(hash_password(password, salt), stored)


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = connect()
    exists = con.execute("SELECT 1 FROM sqlite_master WHERE name='patients'").fetchone()
    if not exists:
        sql = open(SCHEMA, encoding="utf-8").read()
        # The schema is PostgreSQL-style; SQLite needs a different identity-column spelling.
        sql = sql.replace("INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        con.executescript(sql)
    with con:
        for d in DEPARTMENTS:
            con.execute("INSERT OR IGNORE INTO departments (name) VALUES (?)", (d,))
        for c in CATEGORIES:
            con.execute("INSERT OR IGNORE INTO medicine_categories (name) VALUES (?)", (c,))
        if not con.execute("SELECT 1 FROM users WHERE email=?", (ADMIN_EMAIL,)).fetchone():
            con.execute("INSERT INTO users (email,password_hash,full_name,role) VALUES (?,?,?,?)",
                        (ADMIN_EMAIL, hash_password(ADMIN_PASSWORD), "Admin User", "Admin"))
    con.close()


def is_seeded(con):
    return con.execute("PRAGMA user_version").fetchone()[0] == 1


# ------------------------------------------------------------------ helpers
def blank(v):
    return v is None or (isinstance(v, str) and v.strip() == "")


def to_int(v, label):
    if blank(v):
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        raise ApiError(400, f"{label} must be a whole number.")


def to_float(v, label):
    if blank(v):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        raise ApiError(400, f"{label} must be a number.")


def lookup(con, table, col, idcol, value, what):
    row = con.execute(f"SELECT {idcol} FROM {table} WHERE {col}=?", (value,)).fetchone()
    if not row:
        raise ApiError(400, f"Unknown {what}: {value}")
    return row[0]


def friendly(e):
    """Turn a raw SQLite integrity error into a message a user can read."""
    m = str(e)
    if m.startswith("UNIQUE constraint failed"):
        if "appointment_date" in m and "appointment_time" in m:
            return "The database refused this: that doctor already has an active appointment at that date and time."
        return "The database refused this: a value that must be unique already exists (" + m.split(": ", 1)[-1] + ")."
    if m.startswith("FOREIGN KEY"):
        return "The database refused this: it refers to a record that does not exist, or the record is still in use."
    if m.startswith("CHECK constraint failed"):
        return "The database refused this value: " + m + "."
    if m.startswith("NOT NULL"):
        return "The database refused this: a required value is missing (" + m.split(": ", 1)[-1] + ")."
    return "The database refused this change: " + m


def audit(con, user_id, action, table, record_id):
    con.execute("INSERT INTO audit_log (user_id, action, table_name, record_id) VALUES (?,?,?,?)",
                (user_id, action, table, record_id))


# ------------------------------------------------------------------ readers (database -> JSON the web app uses)
def read_patients(con):
    q = """SELECT p.*, d.doctor_code FROM patients p
           JOIN doctors d ON d.doctor_id = p.assigned_doctor_id ORDER BY p.patient_id"""
    return [{"id": r["patient_code"], "firstName": r["first_name"], "lastName": r["last_name"],
             "gender": r["gender"], "dob": r["date_of_birth"], "phone": r["phone"],
             "email": r["email"] or "", "bloodGroup": r["blood_group"], "address": r["address"],
             "emergencyName": r["emergency_contact_name"], "emergencyPhone": r["emergency_contact_phone"],
             "doctorId": r["doctor_code"], "status": r["status"], "notes": r["medical_notes"] or ""}
            for r in con.execute(q)]


def read_doctors(con):
    out = []
    for r in con.execute("""SELECT d.*, p.name AS dept FROM doctors d
                            JOIN departments p ON p.department_id = d.department_id ORDER BY d.doctor_id"""):
        sch = con.execute("SELECT day_of_week, start_time, end_time FROM doctor_schedules WHERE doctor_id=?",
                          (r["doctor_id"],)).fetchall()
        sch = sorted(sch, key=lambda s: DAYS.index(s["day_of_week"]))
        time = f'{sch[0]["start_time"]}-{sch[0]["end_time"]}' if sch else "09:00-17:00"
        out.append({"id": r["doctor_code"], "name": r["full_name"], "specialization": r["specialization"],
                    "department": r["dept"], "phone": r["phone"], "email": r["email"],
                    "qualification": r["qualification"], "experience": r["experience_years"],
                    "fee": r["consultation_fee"], "days": [s["day_of_week"] for s in sch],
                    "time": time, "status": r["status"]})
    return out


def read_appointments(con):
    q = """SELECT a.*, p.patient_code, d.doctor_code, dp.name AS dept
           FROM appointments a
           JOIN patients p ON p.patient_id = a.patient_id
           JOIN doctors d ON d.doctor_id = a.doctor_id
           JOIN departments dp ON dp.department_id = d.department_id
           ORDER BY a.appointment_id"""
    return [{"id": r["appointment_code"], "patientId": r["patient_code"], "doctorId": r["doctor_code"],
             "department": r["dept"], "date": r["appointment_date"], "time": r["appointment_time"],
             "type": r["appointment_type"], "status": r["status"], "reason": r["reason"]}
            for r in con.execute(q)]


def read_records(con):
    q = """SELECT r.*, p.patient_code, d.doctor_code FROM medical_records r
           JOIN patients p ON p.patient_id = r.patient_id
           JOIN doctors d ON d.doctor_id = r.doctor_id ORDER BY r.record_id"""
    out = []
    for r in con.execute(q):
        rx = con.execute("SELECT medicine_text FROM prescriptions WHERE record_id=? ORDER BY prescription_id",
                         (r["record_id"],)).fetchone()
        bp = f'{r["bp_systolic"]}/{r["bp_diastolic"]}' if r["bp_systolic"] is not None else ""
        nz = lambda v: "" if v is None else v
        out.append({"id": r["record_code"], "patientId": r["patient_code"], "doctorId": r["doctor_code"],
                    "visitDate": r["visit_date"], "complaint": r["chief_complaint"],
                    "symptoms": r["symptoms"] or "", "bp": bp, "heartRate": nz(r["heart_rate"]),
                    "temperature": nz(r["temperature_c"]), "weight": nz(r["weight_kg"]),
                    "diagnosis": r["diagnosis"], "treatment": r["treatment"],
                    "prescription": rx["medicine_text"] if rx else "", "labNotes": r["lab_notes"] or "",
                    "followUp": r["follow_up_date"] or ""})
    return out


def read_invoices(con):
    q = """SELECT i.*, p.patient_code FROM invoices i
           JOIN patients p ON p.patient_id = i.patient_id ORDER BY i.invoice_id"""
    out = []
    for r in con.execute(q):
        items = [{"category": it["category"], "name": it["description"], "amount": it["amount"]}
                 for it in con.execute("SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY item_id",
                                       (r["invoice_id"],))]
        out.append({"id": r["invoice_code"], "patientId": r["patient_code"], "date": r["invoice_date"],
                    "items": items, "discount": r["discount"], "taxRate": r["tax_rate"],
                    "status": r["status"], "amountPaid": r["amount_paid"]})
    return out


def read_medicines(con):
    q = """SELECT m.*, c.name AS cat FROM medicines m
           JOIN medicine_categories c ON c.category_id = m.category_id ORDER BY m.medicine_id"""
    return [{"id": r["medicine_code"], "name": r["name"], "category": r["cat"],
             "manufacturer": r["manufacturer"], "quantity": r["quantity"], "unit": r["unit"],
             "price": r["unit_price"], "expiry": r["expiry_date"], "batch": r["batch_number"]}
            for r in con.execute(q)]


def read_sales(con):
    q = """SELECT s.*, p.patient_code, m.medicine_code, m.name AS mname, m.unit
           FROM dispensing s JOIN patients p ON p.patient_id = s.patient_id
           JOIN medicines m ON m.medicine_id = s.medicine_id ORDER BY s.dispense_id"""
    out = []
    for r in con.execute(q):
        date, _, tm = (r["dispensed_at"] or "").partition(" ")
        out.append({"id": "DSP-%04d" % r["dispense_id"], "patientId": r["patient_code"],
                    "medicineId": r["medicine_code"], "medicineName": r["mname"], "unit": r["unit"],
                    "qty": r["quantity"], "unitPrice": r["unit_price"],
                    "amount": round(r["quantity"] * r["unit_price"], 2), "date": date, "time": tm[:5]})
    return out


# ------------------------------------------------------------------ writers (JSON -> table columns)
def category_guess(name):
    n = (name or "").lower()
    if "consult" in n: return "Consultation"
    if re.search(r"lab|test|ecg|x-ray|scan", n): return "Laboratory"
    if re.search(r"medic|pharm", n): return "Pharmacy"
    return "Other"


def dept_id(con, name):
    con.execute("INSERT OR IGNORE INTO departments (name) VALUES (?)", (name,))
    return con.execute("SELECT department_id FROM departments WHERE name=?", (name,)).fetchone()[0]


def category_id(con, name):
    con.execute("INSERT OR IGNORE INTO medicine_categories (name) VALUES (?)", (name,))
    return con.execute("SELECT category_id FROM medicine_categories WHERE name=?", (name,)).fetchone()[0]


def v_patient(con, p):
    return [p["id"], p["firstName"], p["lastName"], p["dob"], p["gender"], p["bloodGroup"], p["phone"],
            None if blank(p.get("email")) else p["email"], p["address"], p["emergencyName"],
            p["emergencyPhone"], lookup(con, "doctors", "doctor_code", "doctor_id", p["doctorId"], "doctor"),
            p["status"], None if blank(p.get("notes")) else p["notes"]]


def v_doctor(con, d):
    return [d["id"], d["name"], d["specialization"], dept_id(con, d["department"]), d["qualification"],
            to_int(d["experience"], "Experience"), d["phone"], d["email"], to_float(d["fee"], "Fee"), d["status"]]


def after_doctor(con, d):
    did = con.execute("SELECT doctor_id FROM doctors WHERE doctor_code=?", (d["id"],)).fetchone()[0]
    con.execute("DELETE FROM doctor_schedules WHERE doctor_id=?", (did,))
    try:
        start, end = d["time"].split("-")
    except (KeyError, ValueError):
        raise ApiError(400, "Working hours must look like 09:00-14:00.")
    for day in d.get("days", []):
        con.execute("INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)",
                    (did, day, start, end))


def v_appointment(con, a):
    return [a["id"], lookup(con, "patients", "patient_code", "patient_id", a["patientId"], "patient"),
            lookup(con, "doctors", "doctor_code", "doctor_id", a["doctorId"], "doctor"),
            a["date"], a["time"], a["type"], a["status"], a["reason"]]


def v_record(con, r):
    bp = r.get("bp")
    sys_, dia = None, None
    if not blank(bp):
        m = re.fullmatch(r"\s*(\d{2,3})\s*/\s*(\d{2,3})\s*", str(bp))
        if not m:
            raise ApiError(400, "Blood pressure must look like 120/80.")
        sys_, dia = int(m.group(1)), int(m.group(2))
    complaint = r.get("complaint") if not blank(r.get("complaint")) else (r.get("symptoms") or "Not recorded")
    return [r["id"], lookup(con, "patients", "patient_code", "patient_id", r["patientId"], "patient"),
            lookup(con, "doctors", "doctor_code", "doctor_id", r["doctorId"], "doctor"),
            r["visitDate"], complaint[:100] if len(complaint) >= 3 else "Not recorded",
            None if blank(r.get("symptoms")) else r["symptoms"], sys_, dia,
            to_int(r.get("heartRate"), "Heart rate"), to_float(r.get("temperature"), "Temperature"),
            to_float(r.get("weight"), "Weight"), r["diagnosis"], r["treatment"],
            None if blank(r.get("labNotes")) else r["labNotes"],
            None if blank(r.get("followUp")) else r["followUp"]]


def after_record(con, r):
    rid = con.execute("SELECT record_id FROM medical_records WHERE record_code=?", (r["id"],)).fetchone()[0]
    con.execute("DELETE FROM prescriptions WHERE record_id=?", (rid,))
    text = (r.get("prescription") or "").strip()
    if text:
        m = con.execute("SELECT medicine_id FROM medicines WHERE lower(name)=lower(?)", (text,)).fetchone()
        con.execute("INSERT INTO prescriptions (record_id, medicine_id, medicine_text) VALUES (?,?,?)",
                    (rid, m[0] if m else None, text[:100]))


def invoice_total(inv):
    sub = sum(float(i["amount"]) for i in inv["items"])
    net = sub - float(inv.get("discount") or 0)
    return round(net * (100 + float(inv.get("taxRate") or 0)) / 100.0, 2)


def v_invoice(con, i):
    paid = i.get("amountPaid")
    if i["status"] == "Paid" and not paid:
        paid = invoice_total(i)
    return [i["id"], lookup(con, "patients", "patient_code", "patient_id", i["patientId"], "patient"),
            i["date"], float(i.get("discount") or 0), float(i.get("taxRate") or 0), i["status"], float(paid or 0)]


def after_invoice(con, i):
    iid = con.execute("SELECT invoice_id FROM invoices WHERE invoice_code=?", (i["id"],)).fetchone()[0]
    con.execute("DELETE FROM invoice_items WHERE invoice_id=?", (iid,))
    if not i["items"]:
        raise ApiError(400, "An invoice needs at least one item.")
    if len(i["items"]) > 15:
        raise ApiError(400, "An invoice can have at most 15 items.")
    for it in i["items"]:
        con.execute("INSERT INTO invoice_items (invoice_id, category, description, amount) VALUES (?,?,?,?)",
                    (iid, it.get("category") or category_guess(it["name"]), it["name"], float(it["amount"])))


def v_medicine(con, m):
    return [m["id"], m["name"], category_id(con, m["category"]), m["manufacturer"],
            to_int(m["quantity"], "Quantity"), m["unit"], to_float(m["price"], "Price"), m["expiry"], m["batch"]]


def v_sale(con, s):
    return [int(s["id"].split("-")[1]),
            lookup(con, "patients", "patient_code", "patient_id", s["patientId"], "patient"),
            lookup(con, "medicines", "medicine_code", "medicine_id", s["medicineId"], "medicine"),
            to_int(s["qty"], "Quantity"), to_float(s["unitPrice"], "Unit price"),
            f'{s["date"]} {s.get("time") or "00:00"}:00']


# ------------------------------------------------------------------ server-side business rules (R1 - R8)
# A database CHECK cannot look at "today" or at other tables, so these rules live here.
# They return HTTP 400 (rule broken); the database itself answers 409 (constraint broken).
def today():
    return date.today().isoformat()


def rule_patient(con, p, before, seeding):
    if seeding: return
    if p["dob"] > today():
        raise ApiError(400, "Rule R1: date of birth cannot be in the future.")
    age = (date.today() - date.fromisoformat(p["dob"])).days / 365.25
    if age > 120:
        raise ApiError(400, "Rule R1: age cannot be more than 120 years.")


def rule_appointment(con, a, before, seeding):
    if seeding or a["status"] == "Cancelled": return
    if before and all(before[k] == a[k] for k in ("date", "time", "doctorId")):
        return                                              # only the status/reason changed: no re-check
    if a["date"] < today():
        raise ApiError(400, "Rule R2: appointment date cannot be in the past.")
    d = con.execute("SELECT doctor_id, status, full_name FROM doctors WHERE doctor_code=?", (a["doctorId"],)).fetchone()
    if not d:
        raise ApiError(400, "Unknown doctor: " + a["doctorId"])
    if d["status"] != "Active" and not (before and before["doctorId"] == a["doctorId"]):
        raise ApiError(400, f"Rule R2: {d['full_name']} is {d['status']} and cannot take new appointments.")
    day = DAYS[date.fromisoformat(a["date"]).weekday()]
    sch = con.execute("SELECT start_time, end_time FROM doctor_schedules WHERE doctor_id=? AND day_of_week=?",
                      (d["doctor_id"], day)).fetchone()
    if not sch:
        raise ApiError(400, f"Rule R2: {d['full_name']} does not work on {day}.")
    t = a["time"]
    if not (sch["start_time"] <= t < sch["end_time"]) or int(t[3:5]) % 30 != 0:
        raise ApiError(400, f"Rule R2: time must be a 30-minute slot between {sch['start_time']} and {sch['end_time']}.")
    if a["date"] == today() and t <= datetime.now().strftime("%H:%M"):
        raise ApiError(400, "Rule R2: that time has already passed today.")


def rule_record(con, r, before, seeding):
    if seeding: return
    if r["visitDate"] > today():
        raise ApiError(400, "Rule R3: visit date cannot be in the future.")
    p = con.execute("SELECT date_of_birth FROM patients WHERE patient_code=?", (r["patientId"],)).fetchone()
    if p and r["visitDate"] < p["date_of_birth"]:
        raise ApiError(400, "Rule R3: visit date cannot be before the patient's date of birth.")


def rule_invoice(con, i, before, seeding):
    if seeding: return
    if i["date"] > today():
        raise ApiError(400, "Rule R4: invoice date cannot be in the future.")
    sub = sum(float(x["amount"]) for x in i["items"])
    if float(i.get("discount") or 0) > sub + 1e-9:
        raise ApiError(400, f"Rule R5: discount cannot be more than the subtotal ({sub:.2f}).")
    if i["status"] == "Partially Paid" and float(i.get("amountPaid") or 0) >= invoice_total(i):
        raise ApiError(400, "Rule R5: for a partially paid invoice the amount paid must be less than the total.")


def rule_medicine(con, m, before, seeding):
    if seeding or before: return                            # only NEW medicines must have a future expiry
    if m["expiry"] <= today():
        raise ApiError(400, "Rule R7: a new medicine must expire after today.")


def rule_sale(con, s, before, seeding):
    if seeding or before: return
    m = con.execute("SELECT name, quantity, expiry_date FROM medicines WHERE medicine_code=?", (s["medicineId"],)).fetchone()
    if not m:
        raise ApiError(400, "Unknown medicine: " + s["medicineId"])
    if m["expiry_date"] < today():
        raise ApiError(400, f"Rule R8: {m['name']} is expired and cannot be dispensed.")
    if int(s["qty"]) > m["quantity"]:
        raise ApiError(400, f"Rule R8: only {m['quantity']} in stock, cannot dispense {s['qty']}.")


# collection -> how to read, which table/columns to write
SPECS = {
    "patients": dict(rule=rule_patient, read=read_patients, table="patients", key="patient_code", pk="patient_id",
                     cols=["patient_code", "first_name", "last_name", "date_of_birth", "gender", "blood_group",
                           "phone", "email", "address", "emergency_contact_name", "emergency_contact_phone",
                           "assigned_doctor_id", "status", "medical_notes"], values=v_patient),
    "doctors": dict(read=read_doctors, table="doctors", key="doctor_code", pk="doctor_id",
                    cols=["doctor_code", "full_name", "specialization", "department_id", "qualification",
                          "experience_years", "phone", "email", "consultation_fee", "status"],
                    values=v_doctor, after=after_doctor),
    "appointments": dict(rule=rule_appointment, read=read_appointments, table="appointments", key="appointment_code", pk="appointment_id",
                         cols=["appointment_code", "patient_id", "doctor_id", "appointment_date",
                               "appointment_time", "appointment_type", "status", "reason"], values=v_appointment),
    "medicalRecords": dict(rule=rule_record, read=read_records, table="medical_records", key="record_code", pk="record_id",
                           cols=["record_code", "patient_id", "doctor_id", "visit_date", "chief_complaint",
                                 "symptoms", "bp_systolic", "bp_diastolic", "heart_rate", "temperature_c",
                                 "weight_kg", "diagnosis", "treatment", "lab_notes", "follow_up_date"],
                           values=v_record, after=after_record),
    "invoices": dict(rule=rule_invoice, read=read_invoices, table="invoices", key="invoice_code", pk="invoice_id",
                     cols=["invoice_code", "patient_id", "invoice_date", "discount", "tax_rate", "status",
                           "amount_paid"], values=v_invoice, after=after_invoice),
    "medicines": dict(rule=rule_medicine, read=read_medicines, table="medicines", key="medicine_code", pk="medicine_id",
                      cols=["medicine_code", "name", "category_id", "manufacturer", "quantity", "unit",
                            "unit_price", "expiry_date", "batch_number"], values=v_medicine),
    "pharmacySales": dict(rule=rule_sale, read=read_sales, table="dispensing", key="dispense_id", pk="dispense_id",
                          cols=["dispense_id", "patient_id", "medicine_id", "quantity", "unit_price",
                                "dispensed_at"], values=v_sale, numeric_key=True),
}
SEED_ORDER = ["doctors", "patients", "appointments", "medicines", "medicalRecords", "invoices", "pharmacySales"]


def key_value(spec, cid):
    return int(cid.split("-")[1]) if spec.get("numeric_key") else cid


def sync_collection(con, key, incoming, user_id, seeding=False):
    """Make the table match the list sent by the browser: delete, then insert / update what changed."""
    spec = SPECS[key]
    if not isinstance(incoming, list):
        raise ApiError(400, "Expected a list.")
    before = {r["id"]: r for r in spec["read"](con)}
    ids = [r.get("id") for r in incoming]
    if any(not isinstance(i, str) or not i for i in ids):
        raise ApiError(400, "Every record needs an id.")
    if len(set(ids)) != len(ids):
        raise ApiError(400, "Two records have the same id.")

    for cid in before:                                       # 1. deletes first (frees unique values)
        if cid not in ids:
            kv = key_value(spec, cid)
            pk = con.execute(f"SELECT {spec['pk']} FROM {spec['table']} WHERE {spec['key']}=?", (kv,)).fetchone()[0]
            try:
                con.execute(f"DELETE FROM {spec['table']} WHERE {spec['key']}=?", (kv,))
            except sqlite3.IntegrityError:
                raise ApiError(409, f"Cannot delete {cid}: other records still refer to it. "
                                    "The database blocks this (foreign key rule ON DELETE RESTRICT).")
            audit(con, user_id, "DELETE", spec["table"], pk)

    for rec in incoming:                                     # 2. inserts and updates
        cid = rec["id"]
        if cid in before and before[cid] == rec:
            continue                                         # unchanged
        if spec.get("rule"):
            spec["rule"](con, rec, before.get(cid), seeding)     # server-side business rules
        vals = spec["values"](con, rec)
        cols = spec["cols"]
        if cid not in before:
            con.execute(f"INSERT INTO {spec['table']} ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", vals)
            action = "INSERT"
        else:
            sets = ",".join(f"{c}=?" for c in cols[1:])
            con.execute(f"UPDATE {spec['table']} SET {sets} WHERE {spec['key']}=?",
                        vals[1:] + [key_value(spec, cid)])
            action = "UPDATE"
        if spec.get("after"):
            spec["after"](con, rec)
        pk = con.execute(f"SELECT {spec['pk']} FROM {spec['table']} WHERE {spec['key']}=?",
                         (key_value(spec, cid),)).fetchone()[0]
        audit(con, user_id, action, spec["table"], pk)


# ---- notifications (alerts are computed by the browser; the database stores them and who has read them)
def sync_notifications(con, items):
    for n in items:
        con.execute("""INSERT INTO notifications (event_key, category, level, message, link_url)
                       VALUES (?,?,?,?,?)
                       ON CONFLICT(event_key) DO UPDATE SET message=excluded.message, level=excluded.level,
                         category=excluded.category, link_url=excluded.link_url""",
                    (str(n["key"])[:100], n["category"], n["level"], str(n["message"])[:200], n.get("href")))


def read_read_keys(con, user_id):
    return [r[0] for r in con.execute(
        """SELECT n.event_key FROM notification_reads r
           JOIN notifications n ON n.notification_id = r.notification_id
           WHERE r.user_id=? ORDER BY r.read_at""", (user_id,))]


def write_read_keys(con, user_id, keys):
    keys = set(keys)
    current = set(read_read_keys(con, user_id))
    for k in keys - current:
        row = con.execute("SELECT notification_id FROM notifications WHERE event_key=?", (k,)).fetchone()
        if row:
            con.execute("INSERT OR IGNORE INTO notification_reads (user_id, notification_id) VALUES (?,?)",
                        (user_id, row[0]))
    for k in current - keys:
        con.execute("""DELETE FROM notification_reads WHERE user_id=? AND notification_id =
                       (SELECT notification_id FROM notifications WHERE event_key=?)""", (user_id, k))


def reset_data(con):
    for t in ["notification_reads", "notifications", "dispensing", "prescriptions", "invoice_items", "invoices",
              "medical_records", "appointments", "patients", "doctor_schedules", "doctors", "medicines", "audit_log"]:
        con.execute(f"DELETE FROM {t}")
    con.execute("DELETE FROM sqlite_sequence")
    con.execute("PRAGMA user_version = 0")


# ------------------------------------------------------------------ HTTP
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WEB, **kw)

    def log_message(self, fmt, *args):
        if self.path.startswith("/api/") and not self.path.startswith("/api/status"):
            sys.stderr.write("  %s %s -> %s\n" % (self.command, self.path, args[1] if len(args) > 1 else ""))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")        # always load the newest files while developing
        super().end_headers()

    # --- plumbing
    def send_json(self, status, payload, extra_headers=()):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for k, v in extra_headers:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 5_000_000:
            raise ApiError(413, "Request too large.")
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            raise ApiError(400, "Invalid JSON.")

    def session(self):
        c = SimpleCookie(self.headers.get("Cookie", ""))
        return SESSIONS.get(c["hms_session"].value) if "hms_session" in c else None

    def do_GET(self):
        self.route() if self.path.startswith("/api/") else super().do_GET()

    def do_HEAD(self):
        if self.path.startswith("/api/"):
            self.send_error(405)
        else:
            super().do_HEAD()

    def do_POST(self):
        self.route() if self.path.startswith("/api/") else self.send_error(405)

    def do_PUT(self):
        self.route() if self.path.startswith("/api/") else self.send_error(405)

    def route(self):
        path = urlparse(self.path).path
        try:
            self.api(path)
        except ApiError as e:
            self.send_json(e.status, {"error": e.message})
        except sqlite3.IntegrityError as e:
            self.send_json(409, {"error": friendly(e)})
        except sqlite3.Error as e:
            self.send_json(500, {"error": "Database error: " + str(e)})
        except Exception as e:                                # never crash the server on one bad request
            sys.stderr.write("  ERROR: %r\n" % (e,))
            self.send_json(500, {"error": "Server error: " + str(e)})

    def api(self, path):
        m = self.command
        con = connect()
        try:
            if path == "/api/status" and m == "GET":
                self.send_json(200, {"ok": True, "database": "SQLite", "seeded": is_seeded(con),
                                     "authenticated": self.session() is not None})
                return
            if path == "/api/login" and m == "POST":
                b = self.body()
                row = con.execute("SELECT * FROM users WHERE email=? AND is_active=1",
                                  (str(b.get("email", "")).strip().lower(),)).fetchone()
                if not row or not check_password(str(b.get("password", "")), row["password_hash"]):
                    raise ApiError(401, "Incorrect email or password.")
                token = secrets.token_urlsafe(32)
                SESSIONS[token] = {"user_id": row["user_id"], "name": row["full_name"], "role": row["role"]}
                self.send_json(200, {"user": {"name": row["full_name"], "role": row["role"]}},
                               [("Set-Cookie", f"hms_session={token}; Path=/; HttpOnly; SameSite=Lax")])
                return
            if path == "/api/logout" and m == "POST":
                c = SimpleCookie(self.headers.get("Cookie", ""))
                if "hms_session" in c:
                    SESSIONS.pop(c["hms_session"].value, None)
                self.send_json(200, {"ok": True},
                               [("Set-Cookie", "hms_session=; Path=/; Max-Age=0; HttpOnly")])
                return

            user = self.session()                               # everything below needs a login
            if not user:
                raise ApiError(401, "Please log in.")

            if path == "/api/seed" and m == "POST":
                if is_seeded(con):
                    self.send_json(200, {"ok": True, "seeded": False})
                    return
                cols = self.body().get("collections", {})
                with con:
                    for key in SEED_ORDER:
                        if key in cols:
                            sync_collection(con, key, cols[key], user["user_id"], seeding=True)
                    con.execute("PRAGMA user_version = 1")
                self.send_json(200, {"ok": True, "seeded": True})
                return
            if path == "/api/reset" and m == "POST":
                with con:
                    reset_data(con)
                self.send_json(200, {"ok": True})
                return
            if path == "/api/notifications/sync" and m == "POST":
                with con:
                    sync_notifications(con, self.body().get("items", []))
                self.send_json(200, {"ok": True})
                return

            mt = re.fullmatch(r"/api/data/(\w+)", path)
            if mt:
                key = mt.group(1)
                if key != "readNotifs" and key not in SPECS:
                    raise ApiError(404, "Unknown collection.")
                if m == "GET":
                    value = read_read_keys(con, user["user_id"]) if key == "readNotifs" else SPECS[key]["read"](con)
                    self.send_json(200, {"value": value})
                    return
                if m == "PUT":
                    value = self.body().get("value")
                    with con:                                   # one transaction: all or nothing
                        if key == "readNotifs":
                            write_read_keys(con, user["user_id"], value or [])
                        else:
                            sync_collection(con, key, value, user["user_id"])
                    self.send_json(200, {"ok": True})
                    return
            raise ApiError(404, "Unknown API request.")
        finally:
            con.close()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    init_db()
    try:
        srv = ThreadingHTTPServer((HOST, port), Handler)
    except OSError:
        print(f"\n  Port {port} is already in use (is HMS already running in another window?).")
        print(f"  Close the other one, or use another port:  python server.py {port + 1}\n")
        sys.exit(1)
    url = f"http://localhost:{port}"
    print("\n  HMS is running.")
    print(f"  Open:      {url}")
    print("  Login:     admin@hms.test / Admin@123")
    print(f"  Database:  {DB_PATH}")
    print("  Stop:      press Ctrl+C\n")
    if os.environ.get("HMS_NO_BROWSER") != "1":
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")


if __name__ == "__main__":
    main()
