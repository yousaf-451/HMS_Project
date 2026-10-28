-- Sample data mirroring the HMS prototype's dummy data (fictional).
-- Identity values are generated in insertion order (1, 2, 3 ...).

INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@hms.test', 'sample-hash-not-a-real-password', 'Admin User', 'Admin');

INSERT INTO departments (name) VALUES
 ('Cardiology'),('General Medicine'),('Dermatology'),('Pediatrics'),
 ('Orthopedics'),('Neurology'),('Gynecology'),('ENT');

INSERT INTO doctors (doctor_code, full_name, specialization, department_id, qualification, experience_years, phone, email, consultation_fee, status) VALUES
 ('DOC-001','Dr. Sara Siddiqui','Cardiologist',1,'MBBS, FCPS',12,'0300-1010101','sara@hms.test',50,'Active'),
 ('DOC-002','Dr. Omar Farooq','General Physician',2,'MBBS',8,'0300-2020202','omar@hms.test',30,'Active'),
 ('DOC-003','Dr. Mina Aslam','Dermatologist',3,'MBBS, MCPS',6,'0300-3030303','mina@hms.test',40,'Active'),
 ('DOC-004','Dr. Kamran Ali','Pediatrician',4,'MBBS, DCH',15,'0300-4040404','kamran@hms.test',35,'On Leave');

INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) VALUES
 (1,'Mon','09:00','14:00'),(1,'Wed','09:00','14:00'),(1,'Fri','09:00','14:00'),
 (2,'Mon','10:00','16:00'),(2,'Tue','10:00','16:00'),(2,'Thu','10:00','16:00'),(2,'Fri','10:00','16:00'),
 (3,'Tue','11:00','17:00'),(3,'Wed','11:00','17:00'),(3,'Sat','11:00','17:00'),
 (4,'Mon','09:00','13:00'),(4,'Thu','09:00','13:00'),(4,'Sat','09:00','13:00');

INSERT INTO patients (patient_code, first_name, last_name, date_of_birth, gender, blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone, assigned_doctor_id, status, medical_notes) VALUES
 ('PAT-0001','Ayesha','Khan','1990-04-12','Female','A+','0300-1234567','ayesha@example.com','House 12, Model Town','Imran Khan','0301-2345678',1,'Active','Sample: seasonal allergies.'),
 ('PAT-0002','Bilal','Ahmed','1985-11-03','Male','O+','0321-7654321',NULL,'Street 4, Gulberg','Sana Ahmed','0322-1112223',2,'Active',NULL),
 ('PAT-0003','Fatima','Noor','2001-07-21','Female','B+','0333-9876543','fatima@example.com','Block C, Johar Town','Noor Hassan','0334-5556667',3,'Active',NULL),
 ('PAT-0004','Hamza','Malik','1962-01-30','Male','AB-','0345-1122334','hamza@example.com','Sector D, Bahria Town','Zara Malik','0346-7778889',1,'Admitted','Sample: monitored hypertension.'),
 ('PAT-0005','Zainab','Raza','2015-09-09','Female','O-','0312-4455667',NULL,'Lane 2, Garden Town','Ali Raza','0313-9998887',4,'Active',NULL),
 ('PAT-0006','Usman','Tariq','1978-12-15','Male','A-','0302-6677889','usman@example.com','Phase 5, DHA','Hina Tariq','0303-2221110',2,'Discharged',NULL);

INSERT INTO appointments (appointment_code, patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, reason) VALUES
 ('APT-0001',1,1,'2026-10-15','09:30','Check-up','Confirmed','Routine heart check'),
 ('APT-0002',2,2,'2026-10-15','11:00','Consultation','Pending','Fever and fatigue'),
 ('APT-0003',3,3,'2026-10-15','12:30','Follow-up','Scheduled','Skin rash follow-up'),
 ('APT-0004',4,1,'2026-10-16','10:00','Follow-up','Scheduled','Blood pressure review'),
 ('APT-0005',6,2,'2026-10-12','14:00','Consultation','Completed','Back pain'),
 ('APT-0006',5,4,'2026-10-17','09:30','Check-up','Pending','Vaccination check');

INSERT INTO medicine_categories (name) VALUES
 ('Cardiac'),('Painkiller'),('Antibiotic'),('Syrup'),('Topical'),('Supplement'),('Antacid'),('Other');

INSERT INTO medicines (medicine_code, name, category_id, manufacturer, quantity, unit, unit_price, expiry_date, batch_number) VALUES
 ('MED-0001','Sample Tablet A 5mg',1,'DemoPharma',200,'Tablets',0.50,'2030-01-01','BA-1001'),
 ('MED-0002','Sample Pain Relief 400mg',2,'DemoPharma',12,'Tablets',0.30,'2030-01-01','BP-2002'),
 ('MED-0003','Sample Antibiotic C',3,'HealthCo',0,'Capsules',1.20,'2030-01-01','AC-3003'),
 ('MED-0004','Sample Cough Syrup',4,'HealthCo',45,'Bottles',3.50,'2020-01-01','CS-4004'),
 ('MED-0005','Sample Cream B',5,'DermaDemo',60,'Tubes',4.00,'2030-01-01','CB-5005'),
 ('MED-0006','Sample Vitamin D',6,'DemoPharma',150,'Tablets',0.40,'2030-01-01','VD-6006');

INSERT INTO medical_records (record_code, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, symptoms, bp_systolic, bp_diastolic, heart_rate, temperature_c, weight_kg, diagnosis, treatment, lab_notes, follow_up_date) VALUES
 ('REC-0001',4,1,NULL,'2026-10-05','Headache and dizziness','Headache, dizziness',150,95,82,36.8,82,'Hypertension (sample)','Lifestyle changes, monitoring','Lipid profile ordered','2026-10-18'),
 ('REC-0002',6,2,5,'2026-10-12','Lower back pain','Lower back pain',120,80,74,36.6,76,'Muscle strain (sample)','Rest, physiotherapy',NULL,'2026-10-19'),
 ('REC-0003',3,3,NULL,'2026-10-01','Itchy skin rash','Itchy skin rash',110,70,70,36.7,58,'Contact dermatitis (sample)','Topical cream',NULL,'2026-10-14');

INSERT INTO prescriptions (record_id, medicine_id, medicine_text, dosage_instructions) VALUES
 (1,1,'Sample Tablet A 5mg',NULL),
 (2,2,'Sample Pain Relief 400mg',NULL),
 (3,5,'Sample Cream B',NULL);

INSERT INTO invoices (invoice_code, patient_id, invoice_date, discount, tax_rate, status, amount_paid) VALUES
 ('INV-0001',1,'2026-10-13',0,5,'Paid',84.00),
 ('INV-0002',4,'2026-10-05',10,5,'Pending',0),
 ('INV-0003',6,'2026-10-12',0,5,'Partially Paid',20.00),
 ('INV-0004',3,'2026-10-01',0,5,'Pending',0);

INSERT INTO invoice_items (invoice_id, category, description, amount) VALUES
 (1,'Consultation','Consultation',50),(1,'Laboratory','ECG Test',30),
 (2,'Consultation','Consultation',50),(2,'Laboratory','Lab Tests',60),(2,'Pharmacy','Medicine',25),
 (3,'Consultation','Consultation',30),(3,'Pharmacy','Medicine',20),
 (4,'Consultation','Consultation',40);

INSERT INTO dispensing (patient_id, medicine_id, quantity, unit_price, invoice_id) VALUES
 (6,2,3,0.30,3);

INSERT INTO notifications (event_key, category, level, message, related_table, related_id, link_url) VALUES
 ('stock-MED-0004-expired','Pharmacy','danger','Sample Cough Syrup is expired','medicines',4,'pharmacy.html?status=Expired'),
 ('stock-MED-0002-low','Pharmacy','warning','Medicine stock low: Sample Pain Relief 400mg','medicines',2,'pharmacy.html?status=Low%20Stock'),
 ('bill-INV-0002-Pending','Billing','warning','Payment pending: invoice INV-0002','invoices',2,'billing.html?view=INV-0002'),
 ('follow-REC-0003-2026-10-14','Follow-up','danger','Follow-up overdue for Fatima Noor','medical_records',3,'medical-records.html?view=REC-0003');
INSERT INTO notification_reads (user_id, notification_id) VALUES (1,1);
INSERT INTO audit_log (user_id, action, table_name, record_id) VALUES (1,'INSERT','patients',1);
