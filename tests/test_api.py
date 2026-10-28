"""
Integration tests: starts the real server on a temporary database and checks the API + database rules.
Run from the project folder:   python tests/test_api.py      (py tests/test_api.py on Windows)
Needs only Python 3. Writes tests/test_api_results.txt
"""
import http.cookiejar, json, os, socket, sqlite3, subprocess, sys, tempfile, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
DB = os.path.join(tmp, "test.db")
s = socket.socket(); s.bind(("127.0.0.1", 0)); PORT = s.getsockname()[1]; s.close()
env = dict(os.environ, HMS_DB_PATH=DB, HMS_NO_BROWSER="1")
proc = subprocess.Popen([sys.executable, os.path.join(ROOT, "server.py"), str(PORT)], env=env,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
URL = f"http://127.0.0.1:{PORT}"
for _ in range(50):
    try: urllib.request.urlopen(URL + "/api/status", timeout=1); break
    except Exception: time.sleep(0.1)

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
results = []

def call(method, path, body=None, client=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(URL + path, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        r = (client or opener).open(req, timeout=10)
        raw = r.read(); code = r.status
    except urllib.error.HTTPError as e:
        raw = e.read(); code = e.code
    try: return code, json.loads(raw)
    except Exception: return code, raw

def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))

def db():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row; return c

# ---------- starting data (small, but touches every collection)
doctors = [
 {"id":"DOC-001","name":"Dr. Sara Siddiqui","specialization":"Cardiologist","department":"Cardiology","phone":"0300-1010101","email":"sara@hms.test","qualification":"MBBS, FCPS","experience":12,"fee":50,"days":["Mon","Wed","Fri"],"time":"09:00-14:00","status":"Active"},
 {"id":"DOC-002","name":"Dr. Omar Farooq","specialization":"General Physician","department":"General Medicine","phone":"0300-2020202","email":"omar@hms.test","qualification":"MBBS","experience":8,"fee":30,"days":["Mon","Tue"],"time":"10:00-16:00","status":"Active"}]
def patient(i, doc="DOC-001", **kw):
    p = {"id":f"PAT-{i:04d}","firstName":"Ayesha","lastName":"Khan","gender":"Female","dob":"1990-04-12","phone":"0300-1234567","email":"","bloodGroup":"A+","address":"House 12, Model Town","emergencyName":"Imran Khan","emergencyPhone":"0301-2345678","doctorId":doc,"status":"Active","notes":""}
    p.update(kw); return p
patients = [patient(1), patient(2, "DOC-002", firstName="Bilal", lastName="Ahmed", email="b@example.com"), patient(3)]
appts = [{"id":"APT-0001","patientId":"PAT-0001","doctorId":"DOC-001","department":"Cardiology","date":"2030-01-07","time":"09:30","type":"Check-up","status":"Confirmed","reason":"Routine heart check"}]
records = [{"id":"REC-0001","patientId":"PAT-0001","doctorId":"DOC-001","visitDate":"2025-12-01","symptoms":"Headache","bp":"150/95","heartRate":82,"temperature":36.8,"weight":82,"diagnosis":"Hypertension (sample)","treatment":"Monitoring","prescription":"Sample Tablet A 5mg","labNotes":"","followUp":"2025-12-20"}]
invoices = [{"id":"INV-0001","patientId":"PAT-0001","date":"2025-12-01","items":[{"name":"Consultation","amount":50},{"name":"ECG Test","amount":30}],"discount":0,"taxRate":5,"status":"Paid"},
            {"id":"INV-0002","patientId":"PAT-0002","date":"2025-12-02","items":[{"name":"Consultation","amount":50},{"name":"Lab Tests","amount":60},{"name":"Medicine","amount":25}],"discount":10,"taxRate":5,"status":"Pending"}]
meds = [{"id":"MED-0001","name":"Sample Tablet A 5mg","category":"Cardiac","manufacturer":"DemoPharma","quantity":200,"unit":"Tablets","price":0.5,"expiry":"2035-01-01","batch":"BA-1001"},
        {"id":"MED-0002","name":"Sample Pain Relief 400mg","category":"Painkiller","manufacturer":"DemoPharma","quantity":12,"unit":"Tablets","price":0.3,"expiry":"2035-01-01","batch":"BP-2002"}]
sales = [{"id":"DSP-0001","patientId":"PAT-0002","medicineId":"MED-0002","medicineName":"Sample Pain Relief 400mg","unit":"Tablets","qty":3,"unitPrice":0.3,"amount":0.9,"date":"2025-12-02","time":"10:15"}]

# ---------- A. security
code, _ = call("GET", "/api/data/patients");                       check("A1 data API refuses a visitor who is not logged in (401)", code == 401)
code, _ = call("POST", "/api/login", {"email":"admin@hms.test","password":"wrong-pass"}); check("A2 wrong password is rejected (401)", code == 401)
code, _ = call("POST", "/api/login", {"email":"nobody@x.test","password":"Admin@123"});   check("A3 unknown user is rejected (401)", code == 401)
code, body = call("POST", "/api/login", {"email":"admin@hms.test","password":"Admin@123"}); check("A4 correct login works (200) and returns the user", code == 200 and body["user"]["role"] == "Admin")
code, body = call("GET", "/api/status");                             check("A5 status shows logged in and not seeded", code == 200 and body["authenticated"] and not body["seeded"])
h = db().execute("SELECT password_hash FROM users WHERE email='admin@hms.test'").fetchone()[0]
check("A6 password is stored as a salted hash, not plain text", h.startswith("pbkdf2$") and "Admin@123" not in h)
code, _ = call("GET", "/api/data/patients", client=urllib.request.build_opener()); check("A7 request without the cookie is refused (401)", code == 401)

# ---------- B. seed + round trip
code, _ = call("POST", "/api/seed", {"collections":{"doctors":doctors,"patients":patients,"appointments":appts,"medicalRecords":records,"medicines":meds,"invoices":invoices,"pharmacySales":sales}})
check("B1 starting data is accepted", code == 200)
code, body = call("GET", "/api/status");                             check("B2 database now marked as seeded", body["seeded"])
counts = {k: len(call("GET", f"/api/data/{k}")[1]["value"]) for k in ["doctors","patients","appointments","medicalRecords","invoices","medicines","pharmacySales"]}
check("B3 every collection reads back with the right number of rows", counts == {"doctors":2,"patients":3,"appointments":1,"medicalRecords":1,"invoices":2,"medicines":2,"pharmacySales":1}, str(counts))
got = call("GET", "/api/data/patients")[1]["value"]
check("B4 patient round-trips unchanged", got[1] == patients[1])
got = call("GET", "/api/data/doctors")[1]["value"]
check("B5 doctor days and hours round-trip through doctor_schedules", got[0]["days"] == ["Mon","Wed","Fri"] and got[0]["time"] == "09:00-14:00")
c = db()
check("B6 doctor_schedules has one row per working day (3+2)", c.execute("SELECT COUNT(*) FROM doctor_schedules").fetchone()[0] == 5)
check("B7 invoice items are separate rows (2+3)", c.execute("SELECT COUNT(*) FROM invoice_items").fetchone()[0] == 5)
check("B8 blood pressure is stored as two numbers", tuple(c.execute("SELECT bp_systolic,bp_diastolic FROM medical_records").fetchone()) == (150, 95))
check("B9 prescription is linked to the stocked medicine", c.execute("SELECT medicine_id FROM prescriptions").fetchone()[0] == 1)
check("B10 appointment department is derived from the doctor (not stored)", "department" not in [r[1] for r in c.execute("PRAGMA table_info(appointments)")] and call("GET","/api/data/appointments")[1]["value"][0]["department"] == "Cardiology")
inv = call("GET", "/api/data/invoices")[1]["value"]
check("B11 paid invoice without amountPaid gets the calculated total (84.00)", inv[0]["amountPaid"] == 84.0)
code, body = call("POST", "/api/seed", {"collections":{"patients":[]}})
check("B12 seeding again does nothing (existing data safe)", code == 200 and len(call("GET","/api/data/patients")[1]["value"]) == 3)
check("B13 the database has relational CHECK data: 3 patient rows", c.execute("SELECT COUNT(*) FROM patients").fetchone()[0] == 3)

# ---------- C. create / update / delete
new = patient(4, firstName="Zara", lastName="Ali")
code, _ = call("PUT", "/api/data/patients", {"value": patients + [new]})
check("C1 add a patient (200)", code == 200 and any(p["id"] == "PAT-0004" for p in call("GET","/api/data/patients")[1]["value"]))
check("C2 the new patient is a real row in the patients table", db().execute("SELECT first_name FROM patients WHERE patient_code='PAT-0004'").fetchone()[0] == "Zara")
cur = call("GET", "/api/data/patients")[1]["value"]
edited = [dict(p, phone="0345-7654321") if p["id"] == "PAT-0004" else p for p in cur]
code, _ = call("PUT", "/api/data/patients", {"value": edited})
check("C3 edit a patient (200) and the change is stored", code == 200 and db().execute("SELECT phone FROM patients WHERE patient_code='PAT-0004'").fetchone()[0] == "0345-7654321")
code, _ = call("PUT", "/api/data/patients", {"value": [p for p in edited if p["id"] != "PAT-0004"]})
check("C4 delete a patient with no linked records (200)", code == 200 and db().execute("SELECT COUNT(*) FROM patients WHERE patient_code='PAT-0004'").fetchone()[0] == 0)
a = db().execute("SELECT COUNT(*) FROM audit_log WHERE table_name='patients'").fetchone()[0]
check("C5 audit_log recorded the patient INSERT, UPDATE and DELETE", a >= 3, f"{a} rows")
sql_name = "Robert'); DROP TABLE patients;--"
code, _ = call("PUT", "/api/data/patients", {"value": call("GET","/api/data/patients")[1]["value"] + [patient(5, firstName=sql_name)]})
check("C6 SQL-injection text is stored as plain data, tables survive", code == 200 and db().execute("SELECT first_name FROM patients WHERE patient_code='PAT-0005'").fetchone()[0] == sql_name)
code, _ = call("PUT", "/api/data/patients", {"value": [p for p in call("GET","/api/data/patients")[1]["value"] if p["id"] != "PAT-0005"]})
check("C7 clean-up of the injection test row", code == 200)

# ---------- D. the DATABASE refuses invalid data
cur = call("GET", "/api/data/patients")[1]["value"]
def put_expect(key, value, want, name):
    code, body = call("PUT", f"/api/data/{key}", {"value": value})
    check(name, code == want, f"got {code}: {body.get('error') if isinstance(body, dict) else body}")
    return body
put_expect("patients", cur + [patient(9, phone="12345")], 409, "D1 bad phone format rejected by CHECK (409)")
put_expect("patients", cur + [patient(9, gender="Unknown")], 409, "D2 bad gender rejected by CHECK (409)")
put_expect("patients", cur + [patient(9, doc="DOC-099")], 400, "D3 unknown doctor rejected (400)")
put_expect("patients", cur + [dict(patient(1))], 400, "D4 duplicate id in one request rejected (400)")
put_expect("patients", cur + [patient(9, bloodGroup="Z+")], 409, "D5 bad blood group rejected by CHECK (409)")
d2 = call("GET", "/api/data/doctors")[1]["value"]
put_expect("doctors", d2 + [dict(d2[0], id="DOC-003", name="Dr. Copy Cat")], 409, "D6 duplicate doctor email rejected by UNIQUE (409)")
put_expect("doctors", [dict(d2[0], experience=70)] + d2[1:], 409, "D7 experience 70 rejected by CHECK (409)")
put_expect("doctors", [dict(d2[0], time="14:00-09:00")] + d2[1:], 409, "D8 end time before start time rejected by CHECK (409)")
body = put_expect("doctors", d2[1:], 409, "D9 deleting a doctor who has patients is blocked (409)")
check("D10 the blocked delete explains the foreign-key rule", "refer" in str(body.get("error", "")), body.get("error", ""))
check("D11 the doctor is still in the database", db().execute("SELECT COUNT(*) FROM doctors WHERE doctor_code='DOC-001'").fetchone()[0] == 1)
ap = call("GET", "/api/data/appointments")[1]["value"]
put_expect("appointments", ap + [dict(ap[0], id="APT-0002", patientId="PAT-0002")], 409, "D12 double-booking the same doctor/date/time rejected (409)")
put_expect("appointments", ap + [dict(ap[0], id="APT-0002", patientId="PAT-0002", doctorId="DOC-002", time="10:30", date="2030-01-08")], 200, "D13 a different doctor/time is accepted (200)")
ap = call("GET", "/api/data/appointments")[1]["value"]
put_expect("appointments", [dict(a, status="Cancelled") if a["id"] == "APT-0001" else a for a in ap] + [dict(ap[0], id="APT-0003", patientId="PAT-0002", status="Scheduled")], 200, "D14 cancelling frees the slot for a new booking (200)")
put_expect("appointments", [{"id":"APT-0009","patientId":"PAT-0001","doctorId":"DOC-001","date":"2030-01-09","time":"09:00","type":"Surgery","status":"Scheduled","reason":"Some reason"}] + call("GET","/api/data/appointments")[1]["value"], 409, "D15 invalid appointment type rejected (409)")
put_expect("patients", [p for p in cur if p["id"] != "PAT-0001"], 409, "D16 deleting a patient with appointments is blocked (409)")
rec = call("GET", "/api/data/medicalRecords")[1]["value"]
put_expect("medicalRecords", [dict(rec[0], temperature=50)], 409, "D17 temperature 50 rejected by CHECK (409)")
put_expect("medicalRecords", [dict(rec[0], bp="80/120")], 409, "D18 systolic not above diastolic rejected by CHECK (409)")
put_expect("medicalRecords", [dict(rec[0], bp="12080")], 400, "D19 malformed blood pressure rejected (400)")
put_expect("medicalRecords", [dict(rec[0], followUp="2000-01-01")], 409, "D20 follow-up before the visit rejected by CHECK (409)")
put_expect("medicalRecords", [dict(rec[0], bp="", heartRate="", temperature="", weight="", followUp="")], 200, "D21 optional vitals may be blank (200)")
inv = call("GET", "/api/data/invoices")[1]["value"]
put_expect("invoices", [dict(inv[0], items=[{"name":f"Item {i}","amount":1} for i in range(16)])] + inv[1:], 400, "D22 16 invoice items rejected (400)")
put_expect("invoices", [inv[0], dict(inv[1], status="Partially Paid", amountPaid=0)], 409, "D23 Partially Paid with 0 paid rejected by CHECK (409)")
put_expect("invoices", [inv[0], dict(inv[1], taxRate=50)], 409, "D24 tax rate 50 rejected by CHECK (409)")
put_expect("invoices", [inv[0], dict(inv[1], discount=0, items=[{"name":"Consultation","amount":0}])], 409, "D25 item amount 0 rejected by CHECK (409)")
m = call("GET", "/api/data/medicines")[1]["value"]
put_expect("medicines", [m[0], dict(m[1], batch="BA-1001")], 409, "D26 duplicate batch number rejected by UNIQUE (409)")
put_expect("medicines", [dict(m[0], quantity=-1), m[1]], 409, "D27 negative stock rejected by CHECK (409)")
body = put_expect("medicines", [m[0]], 409, "D28 deleting a medicine that was dispensed is blocked (409)")
put_expect("medicines", m + [dict(m[0], id="MED-0003", batch="NEW-3003", name="Sample New")], 200, "D29 a valid new medicine is accepted (200)")
put_expect("pharmacySales", [dict(sales[0], medicineId="MED-0099")], 400, "D30 dispensing an unknown medicine rejected (400)")
code, _ = call("PUT", "/api/data/nothing", {"value": []});  check("D31 unknown collection rejected (404)", code == 404)


# ---------- D2. server-side business rules (HTTP 400 = rule broken; 409 = database constraint broken)
import datetime as _dt
def _next_weekday(wd, weeks=1):                      # wd: Mon=0 .. Sun=6
    d = _dt.date.today() + _dt.timedelta(days=7 * weeks)
    while d.weekday() != wd: d += _dt.timedelta(days=1)
    return d.isoformat()
tomorrow = (_dt.date.today() + _dt.timedelta(days=1)).isoformat()
cur = call("GET", "/api/data/patients")[1]["value"]
put_expect("patients", cur + [patient(9, dob=tomorrow)], 400, "R1 date of birth in the future rejected by the server (400)")
ap = call("GET", "/api/data/appointments")[1]["value"]
base = dict(ap[0], id="APT-0010", patientId="PAT-0002", status="Scheduled")
put_expect("appointments", ap + [dict(base, date="2000-01-03", time="09:00")], 400, "R2a appointment in the past rejected (400)")
put_expect("appointments", ap + [dict(base, date=_next_weekday(1), time="09:00")], 400, "R2b doctor does not work that weekday: rejected (400)")
put_expect("appointments", ap + [dict(base, date=_next_weekday(0), time="15:00")], 400, "R2c time outside the doctor's working hours rejected (400)")
put_expect("appointments", ap + [dict(base, date=_next_weekday(0), time="09:10")], 400, "R2d time not on the 30-minute grid rejected (400)")
put_expect("appointments", ap + [dict(base, date=_next_weekday(0), time="09:30")], 200, "R2e a valid slot (Monday 09:30) is accepted (200)")
rec = call("GET", "/api/data/medicalRecords")[1]["value"]
put_expect("medicalRecords", [dict(rec[0], visitDate=tomorrow, followUp="")], 400, "R3a visit date in the future rejected (400)")
put_expect("medicalRecords", [dict(rec[0], visitDate="1980-01-01", followUp="")], 400, "R3b visit before the patient's birth date rejected (400)")
inv = call("GET", "/api/data/invoices")[1]["value"]
put_expect("invoices", [inv[0], dict(inv[1], date=tomorrow)], 400, "R4 invoice date in the future rejected (400)")
put_expect("invoices", [inv[0], dict(inv[1], discount=999)], 400, "R5a discount above the subtotal rejected (400)")
put_expect("invoices", [inv[0], dict(inv[1], status="Partially Paid", amountPaid=500)], 400, "R5b partial payment not below the total rejected (400)")
m = call("GET", "/api/data/medicines")[1]["value"]
put_expect("medicines", m + [dict(m[0], id="MED-0010", batch="OLD-1010", expiry="2000-01-01")], 400, "R7 new medicine that is already expired rejected (400)")
ss = call("GET", "/api/data/pharmacySales")[1]["value"]
put_expect("pharmacySales", ss + [dict(ss[0], id="DSP-0002", qty=99)], 400, "R8a dispensing more than the stock rejected (400)")
put_expect("pharmacySales", ss + [dict(ss[0], id="DSP-0002", qty=2)], 200, "R8b dispensing within the stock accepted (200)")

# ---------- E. notifications and per-user read state
items = [{"key":"stock-MED-0002-low","category":"Pharmacy","level":"warning","message":"Medicine stock low: Sample Pain Relief 400mg","href":"pharmacy.html"},
         {"key":"bill-INV-0002-Pending","category":"Billing","level":"warning","message":"Payment pending: INV-0002","href":"billing.html"}]
code, _ = call("POST", "/api/notifications/sync", {"items": items});   check("E1 alerts are stored in the notifications table", code == 200 and db().execute("SELECT COUNT(*) FROM notifications").fetchone()[0] == 2)
call("POST", "/api/notifications/sync", {"items": items});              check("E2 syncing twice does not create duplicates", db().execute("SELECT COUNT(*) FROM notifications").fetchone()[0] == 2)
code, _ = call("PUT", "/api/data/readNotifs", {"value": ["stock-MED-0002-low"]})
check("E3 marking read is saved per user", code == 200 and call("GET","/api/data/readNotifs")[1]["value"] == ["stock-MED-0002-low"])
check("E4 the read state is a row in notification_reads", db().execute("SELECT COUNT(*) FROM notification_reads").fetchone()[0] == 1)
call("PUT", "/api/data/readNotifs", {"value": []});                      check("E5 marking unread removes the row", call("GET","/api/data/readNotifs")[1]["value"] == [])

# ---------- F. static files and privacy
code, _ = call("GET", "/index.html");                    check("F1 the web app is served (200)", code == 200)
code, _ = call("GET", "/../server.py");                  check("F2 server source is not downloadable", code in (404, 400))
code, _ = call("GET", "/HMS_DB/hms.db");                 check("F3 the database file is not downloadable", code == 404)
code, _ = call("GET", "/%2e%2e/server.py");              check("F4 path traversal is blocked", code in (404, 400))

# ---------- G. logout and reset
code, _ = call("POST", "/api/logout");                                   check("G1 logout works", code == 200)
code, _ = call("GET", "/api/data/patients");                             check("G2 after logout the data API is closed again (401)", code == 401)
call("POST", "/api/login", {"email":"admin@hms.test","password":"Admin@123"})
code, _ = call("POST", "/api/reset")
c = db()
check("G3 reset empties the data tables", code == 200 and all(c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] == 0 for t in ["patients","doctors","appointments","invoices","medicines","dispensing"]))
check("G4 reset keeps the users table (login still works)", c.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 1)
check("G5 after reset the database is marked empty again", not call("GET","/api/status")[1]["seeded"])

proc.terminate()
passed = sum(1 for r in results if r[1])
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_api_results.txt"), "w") as f:
    f.write(f"HMS API + database integration tests: {passed} passed, {len(results) - passed} failed, {len(results)} tests\n\n")
    for n, ok, d in results:
        f.write(("PASS  " if ok else "FAIL  ") + n + ("" if ok or not d else f"\n        {d}") + "\n")
print(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_api_results.txt")).read())
sys.exit(0 if passed == len(results) else 1)
