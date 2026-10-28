-- =====================================================================
-- HMS — Hospital Management System : Database schema
-- Dialect: PostgreSQL-style ANSI SQL (CHECK, FK, partial unique index).
-- Business codes (PAT-0001 ...) are kept as UNIQUE alternate keys because
-- the prototype and the UI use them; surrogate integer keys are the PKs.
-- Rules that need data from more than one row/table cannot be written as a
-- CHECK; they are listed at the bottom as TRIGGER / APPLICATION rules.
-- =====================================================================

-- ---------- 1. Security / users ----------
CREATE TABLE users (
  user_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email          VARCHAR(80)  NOT NULL UNIQUE CHECK (email LIKE '%_@_%.__%'),
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(60)  NOT NULL,
  role           VARCHAR(20)  NOT NULL
                 CHECK (role IN ('Admin','Doctor','Receptionist','Pharmacist','Accountant')),
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ---------- 2. Doctor management ----------
CREATE TABLE departments (
  department_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE doctors (
  doctor_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_code      VARCHAR(7)   NOT NULL UNIQUE CHECK (doctor_code LIKE 'DOC-___'),
  full_name        VARCHAR(40)  NOT NULL CHECK (LENGTH(full_name) >= 2),
  specialization   VARCHAR(50)  NOT NULL CHECK (LENGTH(specialization) >= 3),
  department_id    INT          NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
  qualification    VARCHAR(60)  NOT NULL CHECK (LENGTH(qualification) >= 2),
  experience_years SMALLINT     NOT NULL CHECK (experience_years BETWEEN 0 AND 60),
  phone            VARCHAR(12)  NOT NULL CHECK (phone LIKE '03__-_______'),
  email            VARCHAR(80)  NOT NULL UNIQUE CHECK (email LIKE '%_@_%.__%'),
  consultation_fee NUMERIC(8,2) NOT NULL CHECK (consultation_fee BETWEEN 0 AND 100000),
  status           VARCHAR(10)  NOT NULL DEFAULT 'Active'
                   CHECK (status IN ('Active','On Leave','Inactive'))
);

-- One row per working day (replaces the multi-valued "available days" field)
CREATE TABLE doctor_schedules (
  schedule_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id    INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  day_of_week  VARCHAR(3) NOT NULL CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  CHECK (end_time > start_time),
  UNIQUE (doctor_id, day_of_week)
);

-- ---------- 3. Patient management ----------
CREATE TABLE patients (
  patient_id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_code             VARCHAR(8)   NOT NULL UNIQUE CHECK (patient_code LIKE 'PAT-____'),
  first_name               VARCHAR(40)  NOT NULL CHECK (LENGTH(first_name) >= 2),
  last_name                VARCHAR(40)  NOT NULL CHECK (LENGTH(last_name) >= 2),
  date_of_birth            DATE         NOT NULL,
  gender                   VARCHAR(6)   NOT NULL CHECK (gender IN ('Male','Female','Other')),
  blood_group              VARCHAR(3)   NOT NULL
                           CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone                    VARCHAR(12)  NOT NULL CHECK (phone LIKE '03__-_______'),
  email                    VARCHAR(80)  NULL CHECK (email IS NULL OR email LIKE '%_@_%.__%'),
  address                  VARCHAR(120) NOT NULL CHECK (LENGTH(address) >= 5),
  emergency_contact_name   VARCHAR(40)  NOT NULL CHECK (LENGTH(emergency_contact_name) >= 2),
  emergency_contact_phone  VARCHAR(12)  NOT NULL CHECK (emergency_contact_phone LIKE '03__-_______'),
  assigned_doctor_id       INT          NOT NULL REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
  status                   VARCHAR(10)  NOT NULL DEFAULT 'Active'
                           CHECK (status IN ('Active','Admitted','Discharged')),
  medical_notes            VARCHAR(300) NULL
);

-- ---------- 4. Appointments ----------
CREATE TABLE appointments (
  appointment_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_code  VARCHAR(8)  NOT NULL UNIQUE CHECK (appointment_code LIKE 'APT-____'),
  patient_id        INT  NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  doctor_id         INT  NOT NULL REFERENCES doctors(doctor_id)   ON DELETE RESTRICT,
  appointment_date  DATE NOT NULL,
  appointment_time  TIME NOT NULL,
  appointment_type  VARCHAR(12) NOT NULL
                    CHECK (appointment_type IN ('Consultation','Follow-up','Emergency','Check-up')),
  status            VARCHAR(10) NOT NULL DEFAULT 'Scheduled'
                    CHECK (status IN ('Scheduled','Confirmed','Completed','Cancelled','Pending')),
  reason            VARCHAR(200) NOT NULL CHECK (LENGTH(reason) >= 5)
);
-- Conflict detection: one doctor cannot have two ACTIVE appointments at the same date and time
CREATE UNIQUE INDEX uq_doctor_slot
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE status <> 'Cancelled';

-- ---------- 5. Pharmacy (catalogue first, because prescriptions refer to it) ----------
CREATE TABLE medicine_categories (
  category_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE medicines (
  medicine_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medicine_code  VARCHAR(8)   NOT NULL UNIQUE CHECK (medicine_code LIKE 'MED-____'),
  name           VARCHAR(60)  NOT NULL CHECK (LENGTH(name) >= 2),
  category_id    INT          NOT NULL REFERENCES medicine_categories(category_id) ON DELETE RESTRICT,
  manufacturer   VARCHAR(50)  NOT NULL CHECK (LENGTH(manufacturer) >= 2),
  quantity       INT          NOT NULL CHECK (quantity BETWEEN 0 AND 100000),
  unit           VARCHAR(10)  NOT NULL
                 CHECK (unit IN ('Tablets','Capsules','Bottles','Tubes','Vials','Sachets')),
  unit_price     NUMERIC(7,2) NOT NULL CHECK (unit_price BETWEEN 0.01 AND 10000),
  expiry_date    DATE         NOT NULL,
  batch_number   VARCHAR(20)  NOT NULL UNIQUE CHECK (LENGTH(batch_number) >= 3)
);

-- ---------- 6. Medical records ----------
CREATE TABLE medical_records (
  record_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_code      VARCHAR(8)   NOT NULL UNIQUE CHECK (record_code LIKE 'REC-____'),
  patient_id       INT  NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  doctor_id        INT  NOT NULL REFERENCES doctors(doctor_id)   ON DELETE RESTRICT,
  appointment_id   INT  NULL REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  visit_date       DATE NOT NULL,
  chief_complaint  VARCHAR(100) NOT NULL CHECK (LENGTH(chief_complaint) >= 3),
  symptoms         VARCHAR(200) NULL,
  bp_systolic      SMALLINT NULL CHECK (bp_systolic  BETWEEN 70 AND 250),
  bp_diastolic     SMALLINT NULL CHECK (bp_diastolic BETWEEN 40 AND 150),
  heart_rate       SMALLINT NULL CHECK (heart_rate BETWEEN 30 AND 220),
  temperature_c    NUMERIC(3,1) NULL CHECK (temperature_c BETWEEN 30 AND 45),
  weight_kg        NUMERIC(4,1) NULL CHECK (weight_kg BETWEEN 1 AND 300),
  diagnosis        VARCHAR(100) NOT NULL CHECK (LENGTH(diagnosis) >= 3),
  treatment        VARCHAR(300) NOT NULL CHECK (LENGTH(treatment) >= 3),
  lab_notes        VARCHAR(300) NULL,
  follow_up_date   DATE NULL,
  CHECK ((bp_systolic IS NULL AND bp_diastolic IS NULL)
      OR (bp_systolic IS NOT NULL AND bp_diastolic IS NOT NULL AND bp_systolic > bp_diastolic)),
  CHECK (follow_up_date IS NULL OR follow_up_date >= visit_date)
);

CREATE TABLE prescriptions (
  prescription_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  record_id            INT NOT NULL REFERENCES medical_records(record_id) ON DELETE CASCADE,
  medicine_id          INT NULL REFERENCES medicines(medicine_id) ON DELETE SET NULL,
  medicine_text        VARCHAR(100) NOT NULL,   -- what the doctor wrote (free text in the prototype)
  dosage_instructions  VARCHAR(100) NULL
);

-- ---------- 7. Billing ----------
CREATE TABLE invoices (
  invoice_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_code  VARCHAR(8)    NOT NULL UNIQUE CHECK (invoice_code LIKE 'INV-____'),
  patient_id    INT           NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
  invoice_date  DATE          NOT NULL,
  discount      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax_rate      NUMERIC(4,1)  NOT NULL DEFAULT 5 CHECK (tax_rate BETWEEN 0 AND 30),
  status        VARCHAR(14)   NOT NULL DEFAULT 'Pending'
                CHECK (status IN ('Paid','Pending','Partially Paid','Cancelled')),
  amount_paid   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  CHECK (status <> 'Partially Paid' OR amount_paid > 0)
);

CREATE TABLE invoice_items (
  item_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id   INT NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  category     VARCHAR(12)   NOT NULL
               CHECK (category IN ('Consultation','Laboratory','Pharmacy','Other')),
  description  VARCHAR(60)   NOT NULL CHECK (LENGTH(description) >= 2),
  amount       NUMERIC(10,2) NOT NULL CHECK (amount BETWEEN 0.01 AND 100000)
);

-- ---------- 8. Pharmacy dispensing ----------
CREATE TABLE dispensing (
  dispense_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id    INT NOT NULL REFERENCES patients(patient_id)   ON DELETE RESTRICT,
  medicine_id   INT NOT NULL REFERENCES medicines(medicine_id) ON DELETE RESTRICT,
  quantity      INT NOT NULL CHECK (quantity >= 1),
  unit_price    NUMERIC(7,2) NOT NULL CHECK (unit_price > 0),  -- price at the time of sale (history)
  dispensed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dispensed_by  INT NULL REFERENCES users(user_id)       ON DELETE SET NULL,
  invoice_id    INT NULL REFERENCES invoices(invoice_id) ON DELETE SET NULL
);

-- ---------- 9. Notifications and audit ----------
CREATE TABLE notifications (
  notification_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_key        VARCHAR(100) NOT NULL UNIQUE,   -- stable key of the situation, e.g. 'stock-MED-0002-low'
  category         VARCHAR(12)  NOT NULL
                   CHECK (category IN ('Pharmacy','Billing','Follow-up','Appointments')),
  level            VARCHAR(7)   NOT NULL CHECK (level IN ('info','warning','danger')),
  message          VARCHAR(200) NOT NULL,
  related_table    VARCHAR(30)  NULL,
  related_id       INT          NULL,
  link_url         VARCHAR(150) NULL,              -- page that opens when the notification is clicked
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_reads (
  user_id          INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_id  INT NOT NULL REFERENCES notifications(notification_id) ON DELETE CASCADE,
  read_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notification_id)
);

CREATE TABLE audit_log (
  audit_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  action      VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE','VIEW')),
  table_name  VARCHAR(30) NOT NULL,
  record_id   INT NOT NULL,
  changed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- 10. Indexes for the searches and filters used by the screens ----------
CREATE INDEX ix_patients_name        ON patients (last_name, first_name);
CREATE INDEX ix_patients_doctor      ON patients (assigned_doctor_id);
CREATE INDEX ix_doctors_department   ON doctors (department_id);
CREATE INDEX ix_appt_patient         ON appointments (patient_id);
CREATE INDEX ix_appt_date            ON appointments (appointment_date);
CREATE INDEX ix_records_patient_date ON medical_records (patient_id, visit_date);
CREATE INDEX ix_records_followup     ON medical_records (follow_up_date);
CREATE INDEX ix_invoices_patient     ON invoices (patient_id);
CREATE INDEX ix_invoices_status      ON invoices (status);
CREATE INDEX ix_items_invoice        ON invoice_items (invoice_id);
CREATE INDEX ix_medicines_expiry     ON medicines (expiry_date);
CREATE INDEX ix_dispensing_patient   ON dispensing (patient_id);

-- ---------- 11. Views: derived data is computed, never stored ----------
-- Invoice maths: Subtotal - Discount = After discount; + Tax = Total
CREATE VIEW v_invoice_totals AS
SELECT i.invoice_id, i.invoice_code, i.status, i.discount, i.tax_rate, i.amount_paid,
       COALESCE(SUM(it.amount), 0)                                           AS subtotal,
       COALESCE(SUM(it.amount), 0) - i.discount                              AS amount_after_discount,
       ROUND((COALESCE(SUM(it.amount), 0) - i.discount) * i.tax_rate / 100.0, 2) AS tax_amount,
       ROUND((COALESCE(SUM(it.amount), 0) - i.discount) * (100 + i.tax_rate) / 100.0, 2) AS total
FROM invoices i
LEFT JOIN invoice_items it ON it.invoice_id = i.invoice_id
GROUP BY i.invoice_id, i.invoice_code, i.status, i.discount, i.tax_rate, i.amount_paid;

-- Stock status: Expired > Out of Stock > Low Stock (20 or fewer) > In Stock
CREATE VIEW v_medicine_status AS
SELECT m.*,
       CASE WHEN m.expiry_date < CURRENT_DATE THEN 'Expired'
            WHEN m.quantity = 0               THEN 'Out of Stock'
            WHEN m.quantity <= 20             THEN 'Low Stock'
            ELSE 'In Stock' END AS stock_status
FROM medicines m;

-- Dispensing amount = quantity x price at the time of sale
CREATE VIEW v_dispensing_amount AS
SELECT d.*, ROUND(d.quantity * d.unit_price, 2) AS amount FROM dispensing d;

-- =====================================================================
-- RULES THAT NEED A TRIGGER OR APPLICATION (transaction) LOGIC
-- (a CHECK cannot compare with other rows/tables or with "today")
--  R1  patients.date_of_birth <= today and age <= 120
--  R2  appointment_date >= today on INSERT; doctor must work that weekday
--      (doctor_schedules) and the time must lie inside start_time..end_time
--      on a 30-minute slot; the doctor must be 'Active'
--  R3  medical_records.visit_date <= today and >= patient date_of_birth
--  R4  invoices.invoice_date <= today
--  R5  invoices.discount <= SUM(invoice_items.amount);
--      amount_paid < invoice total when status = 'Partially Paid'
--  R6  1 to 15 invoice_items per invoice
--  R7  medicines.expiry_date > today when a medicine is first inserted
--  R8  dispensing: in ONE transaction check quantity <= medicines.quantity,
--      medicine not expired, insert the dispensing row, and subtract the
--      quantity from medicines.quantity (never below 0 — the CHECK enforces it)
--  R9  invoices and medical_records are never deleted (status 'Cancelled' /
--      audit_log instead) — enforced by permissions in a real deployment
-- =====================================================================
