# HMS — Hospital Management System (semester project)

A web app **connected to a real database**:
`browser (HMS/)  →  Python server (server.py)  →  SQLite database (HMS_DB/hms.db)`

| Folder / file | What it is |
|---|---|
| `HMS/` | The web app (HTML, CSS, JavaScript) with 6 modules + dashboard, reports, search, notifications |
| `server.py` | The backend: serves the app and a JSON API, talks to the database (Python standard library only) |
| `HMS_DB/` | Database design: `schema.sql`, ER diagram, sample data, verification report. `hms.db` is created here on first run |
| `tests/` | Automatic tests + their saved results |
| `SPRINT_PLANNING/` | Agile/Scrum Sprint Planning: slides, Scrum board, product & sprint backlog (CSV), planning document |
| `start_hms.bat` / `start_hms.command` / `start_hms.sh` | One-click start (Windows / Mac / Linux) |

## Run it (needs Python 3.8 or newer; nothing else to install)

**In VS Code (recommended)**
1. Unzip, then **File → Open Folder** → choose `HMS_Project`.
2. Press **Ctrl+Shift+B** (starts the server in the terminal). Or open the terminal (`` Ctrl+` ``) and type `python server.py` (Mac/Linux: `python3 server.py`, Windows: `py server.py`).
3. Your browser opens **http://localhost:8000**. Login: `admin@hms.test` / `Admin@123`.
4. Stop the server with **Ctrl+C** in the terminal.

**Without VS Code:** double-click `start_hms.bat` (Windows) or `start_hms.command` (Mac).

> Do **not** use Live Server or double-click `HMS/index.html` any more: the app needs the server to reach the database. If you do, the page tells you to start the server.

First start: the database file is created and filled with the dummy data. Use **Reset demo data** (top bar) to empty the tables and reload the dummy data.

## See the database working
- In VS Code install the extension **SQLite Viewer** (recommended automatically), then click `HMS_DB/hms.db` to browse the tables (`patients`, `appointments`, `invoice_items`, `audit_log` …) while you use the app.
- Try in the app: add a patient → it appears as a row in `patients`. Try to delete a patient who has appointments → **the database refuses** (foreign key). Book the same doctor at the same time → refused (unique index).
- `audit_log` records every insert / update / delete.

## Tests (optional, all need only Python 3)
```
python tests/test_api.py          # 86 checks of the server + database rules
cd HMS_DB && python verify_schema.py   # 48 checks of the schema itself
```
Saved results: `tests/test_api_results.txt`, `tests/e2e_browser_results.txt` (44 checks run in a real browser), `HMS_DB/test_results.txt`.
Open `http://localhost:8000/selftest.html` (after logging in) for the in-browser self-test.

## Documents for your teacher
- `HMS_DB/HMS_Database_Design_and_Verification_Report.md`: database design activity (ER diagram, tables, normalization, traceability, verification)
- `HMS/PROTOTYPE_DOCUMENTATION.md`: pages, forms and constraints
- `HMS/PRESENTATION_GUIDE.md`: what to say and click in class

## Good to know
- Everything runs only on your computer (the server listens on 127.0.0.1).
- Passwords are stored as salted hashes. There is one demo user.
- If the page says "Cannot reach the HMS server", the server is not running: start it as above.
- If port 8000 is busy: `python server.py 8001` and open http://localhost:8001

## Sprint Planning (Agile/Scrum activity)
See `SPRINT_PLANNING/`: `Sprint_Planning_Presentation.pptx`, `SPRINT_PLANNING.md`, `scrum_board.html`, the two CSV files for Jira / GitHub Projects / Trello, and `WORKSPACE_SETUP.md`. Team: Muhammad Abdullah Malik (Scrum Master, team lead), Umair Qaisar (Product Owner), Talha Azeem, Waleed Ali, Muhammad Yousaf.
